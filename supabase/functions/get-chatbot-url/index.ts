import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chatbot URL mappings - stored securely in edge function, not in public database
const CHATBOT_URLS: Record<string, { free: string; premium: string }> = {
  'edexcel-economics': {
    free: 'https://www.chatbase.co/chatbot-iframe/rdUsQQiBG6DHV2jFtXzn5',
    premium: 'https://www.chatbase.co/chatbot-iframe/1l2aTsS1zKI3FgVTquzOu'
  },
  'aqa-economics': {
    free: 'https://www.chatbase.co/chatbot-iframe/rRsRPPSXyI-f4kL8JHcyz',
    premium: 'https://www.chatbase.co/chatbot-iframe/kkZTJB7EYleMIFmsFEEJ0'
  },
  'cie-economics': {
    free: 'https://www.chatbase.co/chatbot-iframe/UuE_HD759RpXk9-xsbZa7',
    premium: 'https://www.chatbase.co/chatbot-iframe/qZY8ajOntZ2Tem3CqdOr0'
  },
  'ocr-computer-science': {
    free: 'https://www.chatbase.co/chatbot-iframe/t9DaRQyfRFdgqWKI2fOnq',
    premium: 'https://www.chatbase.co/chatbot-iframe/g-4moPbIfo-Q36Db_c6TJ'
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productSlug, tier } = await req.json();

    if (!productSlug) {
      return new Response(
        JSON.stringify({ error: 'Product slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if product exists in our URL mappings
    const productUrls = CHATBOT_URLS[productSlug];
    if (!productUrls) {
      return new Response(
        JSON.stringify({ error: 'Unknown product' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If requesting free tier, return free URL without auth check
    if (tier === 'free') {
      console.log(`Returning free URL for ${productSlug}`);
      return new Response(
        JSON.stringify({ url: productUrls.free, tier: 'free' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For premium tier, require authentication
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.log("Authentication failed for premium request:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Authentication required for premium access' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking premium access for user ${user.id}, product ${productSlug}`);

    // Get product ID from slug
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .eq('active', true)
      .maybeSingle();

    if (productError || !product) {
      console.error('Product lookup error:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to check subscription (bypasses RLS for server-side check)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check user_subscriptions table for active subscription
    const { data: subscription, error: subError } = await serviceClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .eq('active', true)
      .maybeSingle();

    if (subError) {
      console.error('Subscription lookup error:', subError);
    }

    let hasAccess = false;

    if (subscription) {
      // Check if subscription is still valid (not expired)
      if (subscription.subscription_end) {
        const endDate = new Date(subscription.subscription_end);
        hasAccess = endDate >= new Date();
      } else {
        // Lifetime subscription (no end date)
        hasAccess = true;
      }
    }

    // Fallback: Check legacy users table for edexcel-economics backwards compatibility
    if (!hasAccess && productSlug === 'edexcel-economics') {
      const { data: legacyUser } = await serviceClient
        .from('users')
        .select('is_premium, subscription_end')
        .eq('id', user.id)
        .maybeSingle();

      if (legacyUser?.is_premium) {
        // Check if legacy subscription is still valid
        if (legacyUser.subscription_end) {
          const endDate = new Date(legacyUser.subscription_end);
          hasAccess = endDate >= new Date();
        } else {
          hasAccess = true;
        }
      }
    }

    if (hasAccess) {
      console.log(`Premium access granted for user ${user.id}, product ${productSlug}`);
      return new Response(
        JSON.stringify({ url: productUrls.premium, tier: 'premium' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log(`Premium access denied for user ${user.id}, product ${productSlug}`);
      return new Response(
        JSON.stringify({ error: 'Premium subscription required', hasAccess: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in get-chatbot-url function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
