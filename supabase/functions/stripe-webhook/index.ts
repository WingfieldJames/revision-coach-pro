import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const log = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

// ---------- helpers ----------

async function recordEvent(
  db: SupabaseClient,
  event_id: string,
  event_type: string,
  stripe_object_id: string | null,
  payload: any
): Promise<{ alreadyProcessed: boolean }> {
  const { error } = await db.from("stripe_webhook_events").insert({
    event_id,
    event_type,
    stripe_object_id,
    status: "processing",
    payload,
  });
  if (error) {
    if ((error as any).code === "23505") {
      // Unique violation — we've seen this event before.
      const { data: existing } = await db
        .from("stripe_webhook_events")
        .select("status")
        .eq("event_id", event_id)
        .maybeSingle();
      if (existing && existing.status === "processed") {
        return { alreadyProcessed: true };
      }
      // Was failed/processing previously — allow re-processing this delivery.
      return { alreadyProcessed: false };
    }
    log("ERROR: Failed to record event", { event_id, error });
  }
  return { alreadyProcessed: false };
}

async function markEvent(
  db: SupabaseClient,
  event_id: string,
  status: "processed" | "failed" | "skipped",
  patch: { user_id?: string | null; product_id?: string | null; error_message?: string } = {}
) {
  await db
    .from("stripe_webhook_events")
    .update({
      status,
      processed_at: new Date().toISOString(),
      ...patch,
    })
    .eq("event_id", event_id);
}

async function resolveUserId(
  db: SupabaseClient,
  metadataUserId: string | null,
  customerEmail: string | null
): Promise<string | null> {
  if (metadataUserId) return metadataUserId;
  if (!customerEmail) return null;
  const { data } = await db
    .from("users")
    .select("id")
    .ilike("email", customerEmail)
    .maybeSingle();
  return data?.id ?? null;
}

async function resolveProductId(
  db: SupabaseClient,
  session: Stripe.Checkout.Session,
  paymentType: string
): Promise<string | null> {
  const metaProductId = session.metadata?.product_id || null;
  if (metaProductId) return metaProductId;

  const metaSlug = session.metadata?.product_slug || null;
  if (metaSlug) {
    const { data } = await db.from("products").select("id").eq("slug", metaSlug).maybeSingle();
    if (data?.id) return data.id;
  }

  // Try line items price id mapping (only useful if products have stripe_*_price_id set).
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
    const priceId = lineItems.data?.[0]?.price?.id;
    if (priceId) {
      const col = paymentType === "monthly" ? "stripe_monthly_price_id" : "stripe_lifetime_price_id";
      const { data } = await db.from("products").select("id").eq(col, priceId).maybeSingle();
      if (data?.id) return data.id;
    }
  } catch (e) {
    log("WARN: line item lookup failed", { error: (e as Error).message });
  }

  // Last resort: legacy generic checkouts default to Edexcel Economics.
  const { data: fallback } = await db
    .from("products")
    .select("id")
    .eq("slug", "edexcel-economics")
    .maybeSingle();
  return fallback?.id ?? null;
}

async function upsertSubscription(
  db: SupabaseClient,
  args: {
    userId: string;
    productId: string;
    paymentType: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    subscriptionEnd: string | null;
  }
) {
  const { userId, productId, paymentType, stripeSubscriptionId, stripeCustomerId, subscriptionEnd } = args;
  const { data: existing } = await db
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("active", true)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await db
      .from("user_subscriptions")
      .update({
        tier: "deluxe",
        payment_type: paymentType,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        subscription_end: subscriptionEnd,
        cancelled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await db
    .from("user_subscriptions")
    .insert({
      user_id: userId,
      product_id: productId,
      tier: "deluxe",
      payment_type: paymentType,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      subscription_end: subscriptionEnd,
      active: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ---------- main ----------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  log("Webhook received", { method: req.method });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature", { status: 400, headers: corsHeaders });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      log("ERROR: STRIPE_WEBHOOK_SECRET missing");
      return new Response("Webhook secret not configured", { status: 500, headers: corsHeaders });
    }
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    log("ERROR: signature verification failed", { error: (err as Error).message });
    return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Idempotency: record event first.
  const objectId = (event.data?.object as any)?.id ?? null;
  const { alreadyProcessed } = await recordEvent(db, event.id, event.type, objectId, event as any);
  if (alreadyProcessed) {
    log("Skipping already-processed event", { eventId: event.id, type: event.type });
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log("checkout.session.completed", { id: session.id, mode: session.mode, paymentStatus: session.payment_status });

        // Skip non-paid sessions and acknowledge.
        if (session.payment_status !== "paid") {
          await markEvent(db, event.id, "skipped");
          break;
        }

        // School license branch (unchanged behaviour).
        if (session.metadata?.checkout_type === "school_license") {
          // Existing behaviour preserved — handled elsewhere historically.
          await markEvent(db, event.id, "processed", { error_message: "school_license handled" });
          break;
        }

        // Resolve email/customer.
        let customerEmail = session.customer_email;
        const customerId = (session.customer as string) || null;
        if (!customerEmail && customerId) {
          try {
            const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
            customerEmail = customer.email;
          } catch (err) {
            log("ERROR: customer retrieve", { error: (err as Error).message });
          }
        }

        const paymentType = session.metadata?.payment_type || (session.mode === "subscription" ? "monthly" : "lifetime");
        const userId = await resolveUserId(db, session.metadata?.user_id ?? null, customerEmail);
        const productId = await resolveProductId(db, session, paymentType);

        if (!userId || !productId) {
          const msg = `Could not resolve user (${userId}) or product (${productId})`;
          log("ERROR: " + msg, { sessionId: session.id, customerEmail });
          await markEvent(db, event.id, "failed", { user_id: userId, product_id: productId, error_message: msg });
          // Return 500 so Stripe retries.
          return new Response(msg, { status: 500, headers: corsHeaders });
        }

        // Determine subscription_end accurately.
        let subscriptionEnd: string | null = null;
        let stripeSubscriptionId: string | null = null;
        if (session.mode === "subscription" && session.subscription) {
          stripeSubscriptionId = session.subscription as string;
          try {
            const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
          } catch (err) {
            log("WARN: failed to read live sub period_end, defaulting +30d", { error: (err as Error).message });
            const d = new Date();
            d.setDate(d.getDate() + 30);
            subscriptionEnd = d.toISOString();
          }
        } else {
          // Exam Season Pass expires 2026-06-30
          subscriptionEnd = "2026-06-30T23:59:59.000Z";
        }

        try {
          await upsertSubscription(db, {
            userId,
            productId,
            paymentType,
            stripeSubscriptionId,
            stripeCustomerId: customerId,
            subscriptionEnd,
          });
        } catch (err) {
          const msg = `subscription upsert failed: ${(err as Error).message}`;
          log("ERROR: " + msg);
          await markEvent(db, event.id, "failed", { user_id: userId, product_id: productId, error_message: msg });
          return new Response(msg, { status: 500, headers: corsHeaders });
        }

        // Sync legacy users table (best-effort).
        if (customerEmail) {
          const { data: updated } = await db
            .from("users")
            .update({
              is_premium: true,
              subscription_tier: "Deluxe",
              payment_type: paymentType,
              stripe_customer_id: customerId,
              stripe_subscription_id: stripeSubscriptionId,
              subscription_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("email", customerEmail)
            .select("id");
          if (!updated || updated.length === 0) {
            await db.from("users").upsert({
              id: userId,
              email: customerEmail,
              is_premium: true,
              subscription_tier: "Deluxe",
              payment_type: paymentType,
              stripe_customer_id: customerId,
              stripe_subscription_id: stripeSubscriptionId,
              subscription_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            });
          }
        }

        // Affiliate referral (best effort).
        const affiliateId = session.metadata?.affiliate_id || null;
        const affiliateCode = session.metadata?.affiliate_code || null;
        if (affiliateId && affiliateCode) {
          const { data: aff } = await db
            .from("affiliates")
            .select("id, name, commission_rate")
            .eq("id", affiliateId)
            .maybeSingle();
          if (aff) {
            const sale = session.amount_total || 0;
            const commission = Math.round(sale * Number(aff.commission_rate || 0));
            await db.from("affiliate_referrals").insert({
              affiliate_id: aff.id,
              referred_user_id: userId,
              sale_amount: sale,
              commission_amount: commission,
              stripe_session_id: session.id,
              payment_type: paymentType,
              product_id: productId,
              status: "pending",
            });
          }
        }

        await markEvent(db, event.id, "processed", { user_id: userId, product_id: productId });
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId = (invoice.subscription as string) || null;
        const isRenewal =
          !!stripeSubscriptionId &&
          (invoice.billing_reason === "subscription_cycle" ||
            invoice.billing_reason === "subscription_create" ||
            event.type === "invoice.paid");

        if (!isRenewal || !stripeSubscriptionId) {
          await markEvent(db, event.id, "skipped");
          break;
        }

        let subscriptionEndIso: string | null = null;
        try {
          const liveSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          subscriptionEndIso = new Date(liveSub.current_period_end * 1000).toISOString();
        } catch (err) {
          log("ERROR: retrieve live sub for renewal", { error: (err as Error).message });
        }

        let customerEmail = invoice.customer_email;
        if (!customerEmail && invoice.customer) {
          try {
            const customer = (await stripe.customers.retrieve(invoice.customer as string)) as Stripe.Customer;
            customerEmail = customer.email;
          } catch {}
        }

        if (subscriptionEndIso) {
          await db
            .from("user_subscriptions")
            .update({
              subscription_end: subscriptionEndIso,
              active: true,
              cancelled_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", stripeSubscriptionId);

          if (customerEmail) {
            await db
              .from("users")
              .update({
                is_premium: true,
                subscription_tier: "Deluxe",
                subscription_end: subscriptionEndIso,
                updated_at: new Date().toISOString(),
              })
              .eq("email", customerEmail);
          }
        }
        await markEvent(db, event.id, "processed");
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.cancel_at_period_end) {
          await db
            .from("user_subscriptions")
            .update({
              cancelled_at: new Date().toISOString(),
              subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
        } else if (sub.status === "active") {
          await db
            .from("user_subscriptions")
            .update({
              cancelled_at: null,
              active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
        }
        await markEvent(db, event.id, "processed");
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .from("user_subscriptions")
          .update({
            active: false,
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        if (sub.customer) {
          try {
            const customer = (await stripe.customers.retrieve(sub.customer as string)) as Stripe.Customer;
            if (customer.email) {
              await db
                .from("users")
                .update({
                  is_premium: false,
                  subscription_tier: null,
                  subscription_end: null,
                  stripe_subscription_id: null,
                  payment_type: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("email", customer.email)
                .eq("stripe_subscription_id", sub.id);
            }
          } catch {}
        }
        await markEvent(db, event.id, "processed");
        break;
      }

      case "invoice.payment_failed": {
        await markEvent(db, event.id, "processed");
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
        await markEvent(db, event.id, "skipped");
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    log("ERROR: unhandled webhook failure", { error: (err as Error).message, type: event?.type });
    await markEvent(db, event.id, "failed", { error_message: (err as Error).message });
    // Return 500 so Stripe retries.
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
