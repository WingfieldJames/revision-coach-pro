import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Decode JWT directly instead of validating with Supabase
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decodedString = atob(base64);
    const payload = JSON.parse(decodedString);

    const userEmail = payload.email || payload.user_metadata?.email;
    const userId = payload.sub;
    
    if (!userEmail || !userId) {
      throw new Error("User not authenticated");
    }

    // For now, we'll just check the database and return the current status
    // In a production app, you'd also verify with Stripe here
    const { data: userData, error } = await supabaseClient
      .from('users')
      .select('is_premium, subscription_tier, subscription_end')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
      throw error;
    }

    // If user doesn't exist, create them
    if (!userData) {
      const { data: newUser } = await supabaseClient
        .from('users')
        .insert([
          {
            id: userId,
            email: userEmail,
            is_premium: false
          }
        ])
        .select()
        .single();

      return new Response(JSON.stringify({ 
        is_premium: false,
        subscription_tier: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      is_premium: userData.is_premium,
      subscription_tier: userData.subscription_tier,
      subscription_end: userData.subscription_end
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});