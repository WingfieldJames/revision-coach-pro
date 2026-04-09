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

// Per-seat pricing tiers (in pence)
// 1-10 seats: £5.99/seat/month
// 11-30 seats: £4.99/seat/month
// 31+ seats: £3.99/seat/month
function getPricePerSeat(seatCount: number): number {
  if (seatCount >= 31) return 399;
  if (seatCount >= 11) return 499;
  return 599;
}

function getPriceTierLabel(seatCount: number): string {
  if (seatCount >= 31) return "31+ seats — £3.99/seat/month";
  if (seatCount >= 11) return "11-30 seats — £4.99/seat/month";
  return "1-10 seats — £5.99/seat/month";
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

    const pricePerSeat = getPricePerSeat(seats);
    const totalMonthly = pricePerSeat * seats;

    logStep("Creating school checkout", {
      seats,
      schoolName,
      pricePerSeat,
      totalMonthly,
      planType,
      tier: getPriceTierLabel(seats),
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
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `A* AI School License — ${seats} seats`,
              description: `${getPriceTierLabel(seats)}. Premium access for ${seats} students.`,
            },
            unit_amount: pricePerSeat,
            recurring: { interval: "month" },
          },
          quantity: seats,
        },
      ],
      success_url: `${origin}/school/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/progress`,
      metadata: {
        checkout_type: "school_license",
        user_id: user.id,
        school_name: schoolName,
        contact_email: contactEmail || user.email,
        seats: String(seats),
        plan_type: planType,
        price_per_seat: String(pricePerSeat),
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
