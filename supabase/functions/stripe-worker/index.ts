import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const BATCH_SIZE = 50;

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const workerId = crypto.randomUUID()
    console.log(`Starting Stripe Worker Cron [${workerId}]...`)

    // 1. ATOMIC CLAIMING (SKIP LOCKED + LEASE)
    const { data: events, error: fetchError } = await supabaseAdmin
      .rpc('claim_billing_events', {
        p_worker_id: workerId,
        p_batch_size: BATCH_SIZE
      })

    if (fetchError) throw fetchError

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: "No events to process" }), { status: 200 })
    }

    const allowedEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ]

    for (const event of events) {
      try {
        if (!allowedEvents.includes(event.type)) {
          await markProcessed(supabaseAdmin, event.id);
          continue;
        }

        const stripeSubscription = event.payload.data.object
        const companyId = stripeSubscription.metadata?.company_id

        if (!companyId) {
          console.warn(`Event ${event.stripe_event_id}: No company_id found.`);
          await markProcessed(supabaseAdmin, event.id);
          continue;
        }

        // 2. PURE REDUCER (Idempotent Projection Without Judgment)
        let planCode = 'free';
        let isBillingActive = false;

        // Estrazione dati dal payload (unica fonte di verità per questo snapshot temporale)
        if (event.type !== 'customer.subscription.deleted') {
          const priceId = stripeSubscription.items?.data[0]?.price?.id
          if (!priceId) {
            throw new Error("Missing price in payload")
          }

          const { data: planMapping } = await supabaseAdmin
            .from('plan_mapping')
            .select('plan_code')
            .eq('stripe_price_id', priceId)
            .single()

          planCode = planMapping?.plan_code || 'free'
          isBillingActive = ['active', 'trialing'].includes(stripeSubscription.status)
        } else {
          // Deletion mapping
          planCode = 'free'
          isBillingActive = false
        }

        let gracePeriodUntil = null;
        if (stripeSubscription.status === 'past_due' || stripeSubscription.status === 'incomplete') {
          // Grant 7 days of grace period
          const graceDate = new Date();
          graceDate.setDate(graceDate.getDate() + 7);
          gracePeriodUntil = graceDate.toISOString();
        }

        const priceId = stripeSubscription.items?.data[0]?.price?.id || null;

        // 3. UPSERT via Stored Procedure (with Audit Logging)
        const { error: upsertError } = await supabaseAdmin.rpc('set_company_billing_state', {
            p_company_id: companyId,
            p_stripe_customer_id: stripeSubscription.customer,
            p_stripe_subscription_id: stripeSubscription.id,
            p_stripe_price_id: priceId,
            p_billing_status: stripeSubscription.status,
            p_is_billing_active: isBillingActive,
            p_plan_code: planCode,
            p_current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            p_cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
            p_grace_period_until: gracePeriodUntil,
            p_triggered_by: 'system_webhook',
            p_reason: `Stripe webhook event: ${event.type}`
        });

        if (upsertError) throw upsertError;

        // Commit dell'evento
        await markProcessed(supabaseAdmin, event.id);
        console.log(`Processed event ${event.stripe_event_id} for company ${companyId}`);

      } catch (err: any) {
        console.error(`Failed processing event ${event.stripe_event_id}: ${err.message}`)
        await markError(supabaseAdmin, event.id, err.message, event.retry_count);
      }
    }

    return new Response(JSON.stringify({ processed: events.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err: any) {
    console.error(`Worker failed: ${err.message}`)
    return new Response(`Worker Error: ${err.message}`, { status: 500 })
  }
})

async function markProcessed(supabase: any, internalId: string) {
  await supabase
    .from('billing_events')
    .update({ 
      processed: true, 
      processing: false, 
      processing_lease_expires_at: null,
      last_error: null 
    })
    .eq('id', internalId)
}

async function markError(supabase: any, internalId: string, errorMsg: string, currentRetries: number) {
  await supabase
    .from('billing_events')
    .update({ 
      processing: false,
      processing_lease_expires_at: null,
      last_error: errorMsg,
      retry_count: currentRetries + 1
    })
    .eq('id', internalId)
}
