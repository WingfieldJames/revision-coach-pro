import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Webhook received", { method: req.method, url: req.url });
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    logStep("ERROR: Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { 
      status: 400, 
      headers: corsHeaders 
    });
  }
  
  const body = await req.text();
  logStep("Received webhook body", { bodyLength: body.length });
  
  let event;
  
  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { 
        status: 500, 
        headers: corsHeaders 
      });
    }
    
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook signature verified", { eventType: event.type });
  } catch (err) {
    logStep("ERROR: Webhook signature verification failed", { error: err.message });
    return new Response("Invalid signature", { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Processing webhook event", { eventType: event.type, eventId: event.id });
    
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout session", { 
          sessionId: session.id, 
          mode: session.mode, 
          paymentStatus: session.payment_status 
        });
        
        if (session.mode === "payment" && session.payment_status === "paid") {
          // Get customer email
          let customerEmail = session.customer_email;
          
          if (!customerEmail && session.customer) {
            try {
              const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
              customerEmail = customer.email;
            } catch (err) {
              logStep("ERROR: Failed to retrieve customer", { customerId: session.customer, error: err.message });
            }
          }

          if (customerEmail) {
            logStep("Updating user to premium", { email: customerEmail });
            
            // Calculate subscription end date (30 days from now for one-time payment)
            const subscriptionEnd = new Date();
            subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);
            
            const { error } = await supabaseClient
              .from('users')
              .update({ 
                is_premium: true,
                subscription_tier: "Deluxe",
                subscription_end: subscriptionEnd.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('email', customerEmail);

            if (error) {
              logStep("ERROR: Failed to update user", { email: customerEmail, error });
              // Still return 200 to acknowledge receipt of webhook
            } else {
              logStep("Successfully updated user to premium", { email: customerEmail });
            }
          } else {
            logStep("WARNING: No customer email found", { sessionId: session.id });
          }
        } else {
          logStep("Ignoring checkout session", { 
            mode: session.mode, 
            paymentStatus: session.payment_status 
          });
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        // Handle subscription renewals
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice payment", { invoiceId: invoice.id });
        
        if (invoice.customer_email) {
          // Update subscription end date for recurring payments
          const subscriptionEnd = new Date();
          subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
          
          const { error } = await supabaseClient
            .from('users')
            .update({ 
              is_premium: true,
              subscription_end: subscriptionEnd.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('email', invoice.customer_email);

          if (error) {
            logStep("ERROR: Failed to update subscription", { email: invoice.customer_email, error });
          } else {
            logStep("Successfully renewed subscription", { email: invoice.customer_email });
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        // Handle subscription cancellations
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription cancellation", { subscriptionId: subscription.id });
        
        if (subscription.customer) {
          try {
            const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
            if (customer.email) {
              const { error } = await supabaseClient
                .from('users')
                .update({ 
                  is_premium: false,
                  subscription_tier: null,
                  subscription_end: null,
                  updated_at: new Date().toISOString()
                })
                .eq('email', customer.email);

              if (error) {
                logStep("ERROR: Failed to cancel subscription", { email: customer.email, error });
              } else {
                logStep("Successfully cancelled subscription", { email: customer.email });
              }
            }
          } catch (err) {
            logStep("ERROR: Failed to retrieve customer for cancellation", { error: err.message });
          }
        }
        break;
      }
      
      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    // Always return 200 to acknowledge receipt
    logStep("Webhook processed successfully", { eventType: event.type });
    return new Response("OK", { 
      status: 200, 
      headers: corsHeaders 
    });
    
  } catch (error) {
    logStep("ERROR: Webhook processing failed", { 
      error: error.message, 
      eventType: event?.type 
    });
    
    // Return 200 even on error to prevent Stripe from retrying
    // Log the error but don't fail the webhook
    return new Response("Error logged", { 
      status: 200, 
      headers: corsHeaders 
    });
  }
});