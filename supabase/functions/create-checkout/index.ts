import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
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
    console.log("Decoding JWT to get user info from token");

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decodedString = atob(base64);
    const payload = JSON.parse(decodedString);

    const userEmail: string | undefined = payload.email || payload.user_metadata?.email;
    const userId: string | undefined = payload.sub;

    if (!userEmail || !userId) {
      console.error("No user email or ID found in token");
      throw new Error("User not authenticated or email missing");
    }

    console.log("User authenticated:", userEmail);

    const { paymentType = 'lifetime', productId } = await req.json().catch(() => ({ paymentType: 'lifetime' }));
    console.log("Payment type:", paymentType);
    console.log("Product ID:", productId);

    // Get product details from database
    let product = null;
    let productName = "A* AI Deluxe Plan";
    
    if (productId) {
      console.log("Fetching product details");
      const { data: productData, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (productError) {
        console.error("Error fetching product:", productError);
      } else {
        product = productData;
        productName = productData.name;
        console.log("Product found:", productName);
      }
    } else {
      console.log("No product ID provided, using default Edexcel Economics");
      // Default to Edexcel Economics for backward compatibility
      const { data: productData } = await supabaseClient
        .from('products')
        .select('*')
        .eq('slug', 'edexcel-economics')
        .single();
      
      if (productData) {
        product = productData;
        productName = productData.name;
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret key not found");
      throw new Error("Stripe configuration missing");
    }

    // Debug: Check if we're using live or test key
    const keyType = stripeKey.startsWith("sk_live_") ? "LIVE" : "TEST";
    console.log("Stripe key type:", keyType);
    console.log("Stripe key prefix:", stripeKey.substring(0, 12) + "...");

    console.log("Initializing Stripe");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    console.log("Checking for existing customer:", userEmail);
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found, will create new one");
    }

    console.log("Creating checkout session for payment type:", paymentType);
    
    // Configure session based on payment type
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin")}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/compare`,
      metadata: {
        user_id: userId,
        payment_type: paymentType,
        product_id: product?.id || '',
      },
    };

    if (paymentType === 'monthly') {
      // Monthly subscription
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: `${productName} (Monthly)`,
              description: "Premium AI-powered academic assistance - Monthly subscription"
            },
            unit_amount: product?.monthly_price || 499,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ];
    } else {
      // Lifetime (one-time payment)
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: "A* AI Deluxe Plan (Lifetime)",
              description: "Premium AI-powered academic assistance - Lifetime access"
            },
            unit_amount: 1999, // £19.99 in pence
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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