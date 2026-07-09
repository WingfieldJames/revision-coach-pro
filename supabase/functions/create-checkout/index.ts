import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: any) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth client uses caller JWT; admin client uses service role for table reads.
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
        auth: { persistSession: false },
      }
    );
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: authData, error: authError } = await authClient.auth.getUser();
    const user = authData?.user;
    if (authError || !user?.email) {
      return json(401, { error: "not_authenticated" });
    }

    const body = await req.json().catch(() => ({}));
    const paymentType: "monthly" | "lifetime" =
      body?.paymentType === "monthly" ? "monthly" : "lifetime";
    const productId: string | undefined = body?.productId || undefined;
    const productSlug: string | undefined = body?.productSlug || undefined;
    const affiliateCode: string | undefined = body?.affiliateCode || undefined;

    // Resolve product via service role (immune to RLS / table grant changes).
    let product: any = null;
    if (productId) {
      const { data } = await adminClient.from("products").select("*").eq("id", productId).maybeSingle();
      product = data;
    } else if (productSlug) {
      const { data } = await adminClient.from("products").select("*").eq("slug", productSlug).maybeSingle();
      product = data;
    } else {
      console.error("create-checkout: missing product context", { productId, productSlug });
      return json(400, { error: "product_required" });
    }

    if (!product) {
      console.error("create-checkout: product not resolved", { productId, productSlug });
      return json(400, { error: "product_not_found" });
    }
    if (product.active === false) {
      return json(400, { error: "product_inactive" });
    }

    // Validate / resolve affiliate.
    let validatedAffiliateId: string | null = null;
    if (affiliateCode) {
      const { data: affiliate } = await adminClient
        .from("affiliates")
        .select("id, name")
        .eq("code", affiliateCode)
        .eq("active", true)
        .maybeSingle();
      if (affiliate) validatedAffiliateId = affiliate.id;
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("create-checkout: STRIPE_SECRET_KEY missing");
      return json(500, { error: "stripe_not_configured" });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const origin = req.headers.get("origin") || "https://astarai.co.uk";
    const productName: string = product.name || "A* AI Deluxe Plan";

    // Choose post-checkout return route based on qualification, defaulting to /compare.
    const returnRoot = product.qualification_type === "GCSE" ? "/gcse" : "/compare";

    const sessionConfig: any = {
      customer_email: user.email,
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      success_url: `${origin}${returnRoot}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${returnRoot}`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        payment_type: paymentType,
        product_id: product.id,
        product_slug: product.slug,
        qualification_type: product.qualification_type || "A Level",
        affiliate_code: affiliateCode || "",
        affiliate_id: validatedAffiliateId || "",
      },
    };

    // CLAUDE.md P2-1: never hardcode prices. Require the DB price and fail loudly if
    // it's missing, rather than silently charging a stale hardcoded amount. Use `== null`
    // (not `||`) so a legitimate 0 isn't mistaken for "missing".
    const priceForType = paymentType === "monthly" ? product.monthly_price : product.lifetime_price;
    if (priceForType == null) {
      console.error("create-checkout: price missing on product", { productSlug: product.slug, paymentType });
      return json(400, { error: "price_missing" });
    }

    if (paymentType === "monthly") {
      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${productName} (Monthly)`,
              description: "Premium AI-powered academic assistance - Monthly subscription",
            },
            unit_amount: priceForType,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ];
      sessionConfig.subscription_data = {
        metadata: {
          user_id: user.id,
          user_email: user.email,
          product_id: product.id,
          product_slug: product.slug,
        },
      };
    } else {
      sessionConfig.mode = "payment";
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${productName} (Exam Season Pass)`,
              description: "Premium AI-powered academic assistance - Access until June 30, 2026",
            },
            unit_amount: priceForType,
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("create-checkout: session created", { sessionId: session.id, productSlug: product.slug, paymentType });
    return json(200, { url: session.url });
  } catch (error) {
    console.error("create-checkout: unhandled error", error);
    return json(500, { error: (error as Error)?.message || "unknown_error" });
  }
});
