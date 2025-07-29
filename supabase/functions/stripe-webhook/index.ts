import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "payment" && session.payment_status === "paid") {
          // Get customer email
          const customerEmail = session.customer_email || 
            (session.customer ? (await stripe.customers.retrieve(session.customer as string) as Stripe.Customer).email : null);

          if (customerEmail) {
            // Update user to premium
            const { error } = await supabaseClient
              .from('users')
              .update({ 
                is_premium: true,
                subscription_tier: "Deluxe",
                updated_at: new Date().toISOString()
              })
              .eq('email', customerEmail);

            if (error) {
              console.error("Error updating user:", error);
            } else {
              console.log(`Updated user ${customerEmail} to premium`);
            }
          }
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
});