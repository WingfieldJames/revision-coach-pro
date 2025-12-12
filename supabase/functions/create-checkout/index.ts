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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
        auth: { persistSession: false },
      }
    );

    console.log("Getting user from auth context");
    const { data, error: authError } = await supabaseClient.auth.getUser();
    const user = data?.user;

    if (authError || !user?.email) {
      console.log("User not authenticated in create-checkout", authError || null);
      return new Response(
        JSON.stringify({ error: "not_authenticated" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    console.log("User authenticated:", user.email);

    const { paymentType = 'lifetime', productId, affiliateCode } = await req.json().catch(() => ({ paymentType: 'lifetime' }));
    console.log("Payment type:", paymentType);
    console.log("Product ID:", productId);
    console.log("Affiliate code:", affiliateCode || 'none');

    // Validate affiliate code if provided
    let validatedAffiliateId = null;
    if (affiliateCode) {
      const { data: affiliate, error: affiliateError } = await supabaseClient
        .from('affiliates')
        .select('id, name, commission_rate')
        .eq('code', affiliateCode)
        .eq('active', true)
        .maybeSingle();
      
      if (!affiliateError && affiliate) {
        validatedAffiliateId = affiliate.id;
        console.log('Valid affiliate found:', affiliate.name, 'with', affiliate.commission_rate * 100 + '% commission');
      } else {
        console.log('Affiliate code not found or inactive:', affiliateCode);
      }
    }

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

    console.log("Initializing Stripe with Fetch HTTP client");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Simplified: Let Stripe handle customer creation per session
    console.log("Using customer_email for checkout:", user.email);

    console.log("Creating checkout session for payment type:", paymentType);
    
    // Configure session based on payment type
    let sessionConfig: any = {
      customer_email: user.email,
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin")}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/compare`,
      metadata: {
        user_id: user.id,
        payment_type: paymentType,
        product_id: product?.id || '',
        affiliate_code: affiliateCode || '',
        affiliate_id: validatedAffiliateId || '',
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
            unit_amount: product?.monthly_price || 699, // £6.99 in pence
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
              name: `${productName} (Lifetime)`,
              description: "Premium AI-powered academic assistance - Lifetime access"
            },
            unit_amount: product?.lifetime_price || 3499, // £34.99 in pence
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