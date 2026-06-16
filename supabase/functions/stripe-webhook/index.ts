import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.16.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature provided', { status: 400 })
  }

  try {
    const body = await req.text()
    
    // 1. Verify Signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Append-Only Event Log (Dumb Ingest)
    const { error: insertError } = await supabaseAdmin
      .from('billing_events')
      .insert({
        stripe_event_id: event.id,
        type: event.type,
        stripe_created_at: event.created, // timestamp numerico nativo
        payload: event
      })

    if (insertError) {
      if (insertError.code === '23505') { 
        console.log(`Event ${event.id} already processed. Ignoring.`)
        return new Response('Event already processed', { status: 200 })
      }
      throw insertError
    }

    console.log(`Event ${event.id} successfully ingested.`)
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err: any) {
    console.error(`Error ingesting webhook: ${err.message}`)
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 })
  }
})
