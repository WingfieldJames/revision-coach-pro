import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[TEST-AFFILIATE] Function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "No affiliate code provided" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("[TEST-AFFILIATE] Testing code:", code);

    // Use service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: affiliate, error } = await supabaseClient
      .from('affiliates')
      .select('id, name, code, commission_rate, active')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error("[TEST-AFFILIATE] Database error:", error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Database error", 
          details: error.message 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!affiliate) {
      console.log("[TEST-AFFILIATE] Code not found:", code);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Affiliate code not found" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (!affiliate.active) {
      console.log("[TEST-AFFILIATE] Code inactive:", code);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Affiliate code is inactive",
          affiliate: { name: affiliate.name, code: affiliate.code }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("[TEST-AFFILIATE] ✅ Valid affiliate:", affiliate.name);
    return new Response(
      JSON.stringify({ 
        valid: true,
        affiliate: {
          id: affiliate.id,
          name: affiliate.name,
          code: affiliate.code,
          commission_rate: affiliate.commission_rate,
          commission_percentage: (affiliate.commission_rate * 100) + '%',
          active: affiliate.active
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("[TEST-AFFILIATE] Error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
