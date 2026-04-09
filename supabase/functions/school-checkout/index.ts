import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SCHOOL-CHECKOUT] ${step}${detailsStr}`);
};

// Graduated pricing (in pence):
// First 10 seats: £8.99/seat/month
// Seats 11-30: £5.99/seat/month
// Seats 31+: £3.99/seat/month
interface TierLine { name: string; unitAmount: number; quantity: number }

function buildTierLineItems(seats: number): TierLine[] {
  const lines: TierLine[] = [];
  const tier1 = Math.min(seats, 10);
  const tier2 = Math.min(Math.max(seats - 10, 0), 20);
  const tier3 = Math.max(seats - 30, 0);

  if (tier1 > 0) lines.push({ name: `Seats 1–${tier1} @ £8.99/month`, unitAmount: 899, quantity: tier1 });
  if (tier2 > 0) lines.push({ name: `Seats 11–${10 + tier2} @ £5.99/month`, unitAmount: 599, quantity: tier2 });
  if (tier3 > 0) lines.push({ name: `Seats 31–${30 + tier3} @ £3.99/month`, unitAmount: 399, quantity: tier3 });

  return lines;
}

function calculateTotal(seats: number): number {
  const tier1 = Math.min(seats, 10);
  const tier2 = Math.min(Math.max(seats - 10, 0), 20);
  const tier3 = Math.max(seats - 30, 0);
  return tier1 * 899 + tier2 * 599 + tier3 * 399;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
        auth: { persistSession: false },
      }
    );

    // Authenticate user
    const { data, error: authError } = await supabaseClient.auth.getUser();
    const user = data?.user;

    if (authError || !user?.email) {
      logStep("User not authenticated");
      return new Response(
        JSON.stringify({ error: "not_authenticated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    logStep("User authenticated", { email: user.email });

    const { seats, schoolName, contactEmail, planType = "annual" } = await req.json();

    if (!seats || seats < 1) {
      return new Response(
        JSON.stringify({ error: "Please select at least 1 seat" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!schoolName?.trim()) {
      return new Response(
        JSON.stringify({ error: "School name is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const tierLines = buildTierLineItems(seats);
    const totalMonthly = calculateTotal(seats);

    logStep("Creating school checkout", {
      seats,
      schoolName,
      totalMonthly,
      planType,
      tiers: tierLines,
    });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe configuration missing");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const origin = req.headers.get("origin") || "https://astarai.co.uk";

    const sessionConfig: any = {
      customer_email: contactEmail || user.email,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: tierLines.map((tier) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: `A* AI School License — ${tier.name}`,
            description: `Premium access for students`,
          },
          unit_amount: tier.unitAmount,
          recurring: { interval: "month" },
        },
        quantity: tier.quantity,
      })),
      success_url: `${origin}/school/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/progress`,
      metadata: {
        checkout_type: "school_license",
        user_id: user.id,
        school_name: schoolName,
        contact_email: contactEmail || user.email,
        seats: String(seats),
        plan_type: planType,
        total_monthly: String(totalMonthly),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    logStep("ERROR", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
