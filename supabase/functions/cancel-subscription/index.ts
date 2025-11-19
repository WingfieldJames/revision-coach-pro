import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Cancel-subscription function called");
  
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

    // Get user's subscription info from database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_subscription_id, payment_type, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error("Failed to fetch user data:", userError);
      throw new Error("Failed to fetch subscription information");
    }

    console.log("User data:", { 
      email: userData.email, 
      paymentType: userData.payment_type,
      hasSubscriptionId: !!userData.stripe_subscription_id 
    });

    // Check if user has a monthly subscription
    if (userData.payment_type !== 'monthly') {
      console.log("User does not have a monthly subscription");
      return new Response(
        JSON.stringify({ 
          error: "Only monthly subscriptions can be cancelled. Lifetime purchases are permanent." 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!userData.stripe_subscription_id) {
      console.error("No Stripe subscription ID found");
      throw new Error("No active subscription found");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret key not found");
      throw new Error("Stripe configuration missing");
    }

    console.log("Initializing Stripe");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get cancellation preference from request body
    const { cancelAtPeriodEnd = true } = await req.json().catch(() => ({ cancelAtPeriodEnd: true }));

    console.log("Cancelling subscription:", userData.stripe_subscription_id);
    console.log("Cancel at period end:", cancelAtPeriodEnd);

    if (cancelAtPeriodEnd) {
      // Cancel at end of billing period (user keeps access until then)
      const subscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        { cancel_at_period_end: true }
      );
      
      console.log("Subscription will be cancelled at period end:", subscription.cancel_at);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Subscription will be cancelled at the end of the current billing period",
          cancelAt: subscription.cancel_at,
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Cancel immediately
      await stripe.subscriptions.cancel(userData.stripe_subscription_id);
      
      console.log("Subscription cancelled immediately");
      
      // Update database immediately
      await supabaseAdmin
        .from('users')
        .update({ 
          is_premium: false,
          subscription_tier: null,
          subscription_end: null,
          stripe_subscription_id: null,
          payment_type: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Subscription cancelled immediately",
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error in cancel-subscription:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Check the function logs for more information"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

