import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    // AUTH: admin only. Closes the hole where any anonymous caller could
    // cancel any customer's subscription by supplying a sub_… id.
    const { admin } = await requireAdmin(req);

    let body: { subscriptionRowId?: string; stripeSubId?: string };
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }
    const { subscriptionRowId, stripeSubId } = body;
    if (!subscriptionRowId || !stripeSubId) {
      return err("subscriptionRowId and stripeSubId are required", 400);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const cancelled = await stripe.subscriptions.cancel(stripeSubId);

    await admin
      .from("user_subscriptions")
      .update({
        active: false,
        cancelled_at: new Date().toISOString(),
        subscription_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionRowId);

    return json({ success: true, stripeStatus: cancelled.status });
  } catch (e) {
    return toResponse(e);
  }
});
