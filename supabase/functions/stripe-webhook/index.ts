import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🎣 Webhook received')
  console.log('📍 Method:', req.method)
  console.log('📍 URL:', req.url)

  try {
    // Check environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔧 Environment check:')
    console.log('🔑 STRIPE_SECRET_KEY exists:', !!stripeSecretKey)
    console.log('🔐 STRIPE_WEBHOOK_SECRET exists:', !!webhookSecret)
    console.log('📍 SUPABASE_URL exists:', !!supabaseUrl)
    console.log('🔑 SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }

    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('📦 Body length:', body.length)
    console.log('🔐 Signature exists:', !!signature)

    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      throw new Error('Missing stripe-signature header')
    }

    console.log('🔐 Verifying webhook signature...')
    
    let event: Stripe.Event
    try {
      // Use the synchronous version of constructEvent
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
      console.log('✅ Webhook signature verified')
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      throw new Error(`Webhook signature verification failed: ${err.message}`)
    }

    console.log('📦 Event type:', event.type)
    console.log('📦 Event ID:', event.id)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('💳 Processing checkout session:', session.id)
      console.log('💳 Payment status:', session.payment_status)
      console.log('👤 Client reference ID:', session.client_reference_id)
      console.log('👤 Customer email:', session.customer_details?.email)
      console.log('📋 Metadata:', session.metadata)

      // Get user ID from client_reference_id or metadata
      const userId = session.client_reference_id || session.metadata?.userId

      if (!userId) {
        console.error('❌ No user ID found in checkout session')
        console.log('📋 Available data:', {
          client_reference_id: session.client_reference_id,
          metadata: session.metadata,
          customer: session.customer,
          customer_details: session.customer_details
        })
        throw new Error('No user ID found in checkout session')
      }

      console.log(`👤 Found user ID: ${userId}`)

      // Only proceed if payment was successful
      if (session.payment_status !== 'paid') {
        console.log('⚠️ Payment not completed, status:', session.payment_status)
        return new Response(
          JSON.stringify({ received: true, message: 'Payment not completed yet' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      // Initialize Supabase client
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration')
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('✅ Supabase client initialized')

      console.log(`🔄 Updating user ${userId} to premium...`)

      // Update user to premium
      const { data, error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', userId)
        .select('id, email, is_premium')

      if (error) {
        console.error('❌ Database update error:', error)
        throw new Error(`Failed to update user: ${error.message}`)
      }

      console.log('✅ User updated to premium:', data)

      // Send welcome email record
      try {
        console.log('📧 Recording welcome email...')
        const { error: emailError } = await supabase
          .from('welcome_emails')
          .insert({
            user_id: userId,
            email: session.customer_details?.email || '',
            status: 'sent'
          })

        if (emailError) {
          console.error('❌ Welcome email record error:', emailError)
          // Don't fail the webhook for email logging errors
        } else {
          console.log('✅ Welcome email recorded')
        }
      } catch (emailError) {
        console.error('❌ Welcome email failed:', emailError)
        // Don't fail the webhook for email logging errors
      }

      console.log('✅ Checkout session processed successfully')
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true, event_type: event.type }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Webhook error:', error)
    
    // Return more detailed error information for debugging
    const errorResponse = {
      error: error.message,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID()
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})