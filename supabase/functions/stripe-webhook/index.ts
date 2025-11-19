import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
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
          paymentStatus: session.payment_status,
          metadata: session.metadata 
        });
        
        if (session.payment_status === "paid") {
          // Get customer email
          let customerEmail = session.customer_email;
          let customerId = session.customer as string;
          
          if (!customerEmail && customerId) {
            try {
              const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
              customerEmail = customer.email;
            } catch (err) {
              logStep("ERROR: Failed to retrieve customer", { customerId, error: err.message });
            }
          }

          if (customerEmail) {
            const paymentType = session.metadata?.payment_type || 'lifetime';
            const productId = session.metadata?.product_id;
            const userId = session.metadata?.user_id;
            
            logStep("Processing payment", { 
              email: customerEmail, 
              paymentType, 
              mode: session.mode,
              productId,
              userId 
            });
            
            let subscriptionEnd = null;
            let stripeSubscriptionId = null;
            
            if (session.mode === "subscription") {
              // Monthly subscription
              stripeSubscriptionId = session.subscription as string;
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + 1);
              subscriptionEnd = endDate.toISOString();
              
              logStep("Setting up monthly subscription", { 
                subscriptionId: stripeSubscriptionId, 
                subscriptionEnd 
              });
            } else {
              // Lifetime (one-time payment) - no expiration
              logStep("Setting up lifetime access", { paymentType });
            }
            
            // Create entry in new user_subscriptions table
            if (productId && userId) {
              const { error: subError } = await supabaseClient
                .from('user_subscriptions')
                .insert({
                  user_id: userId,
                  product_id: productId,
                  tier: 'deluxe',
                  payment_type: paymentType,
                  stripe_subscription_id: stripeSubscriptionId,
                  stripe_customer_id: customerId,
                  subscription_end: subscriptionEnd,
                  active: true
                });
                
              if (subError) {
                logStep("ERROR: Failed to create subscription", { userId, productId, error: subError });
              } else {
                logStep("Successfully created subscription", { userId, productId, paymentType });
              }
            }
            
            // Also update legacy users table for backward compatibility
            const updateData: any = {
              is_premium: true,
              subscription_tier: "Deluxe",
              payment_type: paymentType,
              stripe_customer_id: customerId,
              stripe_subscription_id: stripeSubscriptionId,
              subscription_end: subscriptionEnd,
              updated_at: new Date().toISOString()
            };
            
            const { error } = await supabaseClient
              .from('users')
              .update(updateData)
              .eq('email', customerEmail);

            if (error) {
              logStep("ERROR: Failed to update user", { email: customerEmail, error });
            } else {
              logStep("Successfully updated user to premium", { email: customerEmail, paymentType });
            }
          } else {
            logStep("WARNING: No customer email found", { sessionId: session.id });
          }
        } else {
          logStep("Ignoring checkout session - not paid", { 
            mode: session.mode, 
            paymentStatus: session.payment_status 
          });
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        // Handle subscription renewals (monthly payments)
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice payment", { 
          invoiceId: invoice.id, 
          subscriptionId: invoice.subscription 
        });
        
        // Only process recurring subscription invoices
        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          let customerEmail = invoice.customer_email;
          
          if (!customerEmail && invoice.customer) {
            try {
              const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
              customerEmail = customer.email;
            } catch (err) {
              logStep("ERROR: Failed to retrieve customer for renewal", { error: err.message });
            }
          }
          
          if (customerEmail) {
            // Extend subscription by one month
            const subscriptionEnd = new Date();
            subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
            
            const { error } = await supabaseClient
              .from('users')
              .update({ 
                is_premium: true,
                subscription_end: subscriptionEnd.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('email', customerEmail);

            if (error) {
              logStep("ERROR: Failed to renew subscription", { email: customerEmail, error });
            } else {
              logStep("Successfully renewed monthly subscription", { 
                email: customerEmail, 
                newEndDate: subscriptionEnd.toISOString() 
              });
            }
          }
        } else {
          logStep("Skipping invoice - not a subscription renewal", { 
            billingReason: invoice.billing_reason 
          });
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        // Handle subscription cancellations (monthly only)
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
                  stripe_subscription_id: null,
                  payment_type: null,
                  updated_at: new Date().toISOString()
                })
                .eq('email', customer.email)
                .eq('stripe_subscription_id', subscription.id); // Only cancel if IDs match

              if (error) {
                logStep("ERROR: Failed to cancel subscription", { email: customer.email, error });
              } else {
                logStep("Successfully cancelled monthly subscription", { 
                  email: customer.email,
                  subscriptionId: subscription.id 
                });
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