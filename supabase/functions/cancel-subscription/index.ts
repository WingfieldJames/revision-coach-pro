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

    // First check user_subscriptions table (primary source)
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*, products(name, slug)')
      .eq('user_id', user.id)
      .eq('payment_type', 'monthly')
      .eq('active', true);

    if (subError) {
      console.error("Failed to fetch subscriptions:", subError);
    }

    // Find monthly subscription to cancel
    let subscriptionToCancel = subscriptions?.[0];
    
    // Fallback to legacy users table if no subscription found
    if (!subscriptionToCancel) {
      console.log("No subscription in user_subscriptions, checking legacy users table");
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('stripe_subscription_id, payment_type, email')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        console.error("Failed to fetch user data:", userError);
        throw new Error("Failed to fetch subscription information");
      }

      if (userData.payment_type !== 'monthly' || !userData.stripe_subscription_id) {
        console.log("No monthly subscription found in legacy table either");
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

      subscriptionToCancel = {
        stripe_subscription_id: userData.stripe_subscription_id,
        payment_type: userData.payment_type,
        id: null, // Legacy - no user_subscriptions record
      };
    }

    console.log("Subscription to cancel:", { 
      subscriptionId: subscriptionToCancel.stripe_subscription_id,
      paymentType: subscriptionToCancel.payment_type,
      productName: subscriptionToCancel.products?.name || 'Legacy subscription'
    });

    if (!subscriptionToCancel.stripe_subscription_id) {
      console.error("No Stripe subscription ID found");
      throw new Error("No active subscription found");
    }

    const stripeSubscriptionId = subscriptionToCancel.stripe_subscription_id;
    const userSubscriptionId = subscriptionToCancel.id;

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

    console.log("Cancelling subscription:", stripeSubscriptionId);
    console.log("Cancel at period end:", cancelAtPeriodEnd);

    if (cancelAtPeriodEnd) {
      // Cancel at end of billing period (user keeps access until then)
      const subscription = await stripe.subscriptions.update(
        stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
      
      console.log("Subscription will be cancelled at period end:", subscription.cancel_at);

      // Mark as cancelled in user_subscriptions if record exists
      if (userSubscriptionId) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ 
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userSubscriptionId);
        console.log("Marked user_subscriptions as cancelled");
      }
      
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
      await stripe.subscriptions.cancel(stripeSubscriptionId);
      
      console.log("Subscription cancelled immediately");
      
      // Update user_subscriptions table
      if (userSubscriptionId) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ 
            active: false,
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userSubscriptionId);
      }
      
      // Update legacy users table
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

