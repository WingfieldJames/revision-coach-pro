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

// Returns Stripe session status only — does NOT grant access.
// Subscription writes are owned by the stripe-webhook function (idempotent + verified).
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId) return json(400, { error: "session_id_required" });

    // Identify caller
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
        auth: { persistSession: false },
      }
    );
    const { data: authData } = await authClient.auth.getUser();
    const callerEmail = authData?.user?.email?.toLowerCase() || null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    let sessionEmail = session.customer_email;
    if (!sessionEmail && session.customer) {
      try {
        const customer = (await stripe.customers.retrieve(session.customer as string)) as Stripe.Customer;
        sessionEmail = customer.email;
      } catch {}
    }
    const sessionEmailLower = sessionEmail?.toLowerCase() || null;

    const isPaid = session.payment_status === "paid";
    const ownsSession = !!callerEmail && !!sessionEmailLower && callerEmail === sessionEmailLower;

    return json(200, {
      success: true,
      paid: isPaid,
      owns_session: ownsSession,
      mode: session.mode,
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    return json(500, { error: (error as Error).message });
  }
});
