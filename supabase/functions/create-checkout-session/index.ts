import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_id, price_id } = await req.json();

    if (!company_id || !price_id) {
      return new Response(JSON.stringify({ error: "Missing company_id or price_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe Checkout Session
    // company_id is set in THREE places for maximum robustness:
    //   1. subscription_data.metadata → our trigger reads this (source of truth)
    //   2. session metadata → fallback for webhook events
    //   3. client_reference_id → UI/debug only
    //
    // Payment methods strategy: automatic_payment_methods (Stripe-recommended for production)
    //   Stripe automatically shows all methods enabled in Dashboard → Settings → Payment methods.
    //   This includes Card (+ Apple Pay / Google Pay on supported devices), SEPA Direct Debit,
    //   MobilePay (if enabled for DK market), and any future methods — without code changes.
    //   Stripe also filters out methods incompatible with subscription mode automatically.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "sepa_debit", "amazon_pay", "revolut_pay", "link"],
      line_items: [{ price: price_id, quantity: 1 }],
      metadata: {
        company_id: company_id,
      },
      subscription_data: {
        metadata: {
          company_id: company_id,
        },
      },
      client_reference_id: company_id,
      customer_email: user.email,
      success_url: `${Deno.env.get("APP_URL") || "https://jobs-report.vercel.app"}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("APP_URL") || "https://jobs-report.vercel.app"}/billing/cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Checkout error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
