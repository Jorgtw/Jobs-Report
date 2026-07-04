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
    // 1. Verify the user is authenticated
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

    const { company_id } = await req.json();

    if (!company_id) {
      return new Response(JSON.stringify({ error: "Missing company_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Derive Authority from Server-Side Mapping (JWT -> Companies)
    // NEVER trust the client's company_id as the primary authorization vector.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all companies where the user is an admin or owner
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('user_companies')
      .select('company_id, role')
      .eq('auth_id', user.id)
      .in('role', ['admin', 'owner']);

    if (membershipError || !memberships || memberships.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: User has no administrative rights" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the requested company_id is strictly within the user's authorized scope
    const authorizedCompanyIds = memberships.map(m => m.company_id);
    if (!authorizedCompanyIds.includes(company_id)) {
      return new Response(JSON.stringify({ error: "Forbidden: User is not an admin of the requested company" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch Stripe Customer ID and verify company hasn't been soft-deleted
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: billing, error: billingError } = await supabaseAdmin
      .from('company_billing')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('company_id', company_id)
      .single();

    if (billingError || !billing) {
       return new Response(JSON.stringify({ error: "No billing record found for this company" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerId = billing.stripe_customer_id;

    // AUTO-HEALING: If customer ID is missing but we have a subscription ID (from legacy migration)
    if (!customerId && billing.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(billing.stripe_subscription_id);
        if (subscription && subscription.customer) {
          customerId = subscription.customer as string;
          // Heal the database
          await supabaseAdmin
            .from('company_billing')
            .update({ stripe_customer_id: customerId })
            .eq('company_id', company_id);
        }
      } catch (err) {
        console.error("Failed to auto-heal Stripe Customer ID:", err);
      }
    }

    if (!customerId) {
       return new Response(JSON.stringify({ error: "No active Stripe customer found for this company. Please create a new subscription." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create Stripe Billing Portal Session
    const appUrl = Deno.env.get("APP_URL") || "https://jobs-report.vercel.app";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/companies`, // Return user to the companies dashboard
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Portal session error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
