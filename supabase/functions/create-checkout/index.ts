import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Create-checkout function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Initializing Supabase client");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log("Checking authorization header");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header found");
      throw new Error("Authorization header missing");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Getting user with token");
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      console.error("No user or email found");
      throw new Error("User not authenticated or email missing");
    }

    console.log("User authenticated:", user.email);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret key not found");
      throw new Error("Stripe configuration missing");
    }

    console.log("Initializing Stripe");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    console.log("Checking for existing customer:", user.email);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found");
    }

    console.log("Creating checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: "A* AI Deluxe Plan" },
            unit_amount: 1999, // £19.99 in pence
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/compare`,
    });

    console.log("Checkout session created successfully:", session.id);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-checkout:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check the function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});