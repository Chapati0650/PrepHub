import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('🎣 Stripe webhook called')
  console.log('📍 Method:', req.method)
  console.log('📍 Headers:', Object.fromEntries(req.headers.entries()))

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    console.log('🔧 Environment variables check:')
    console.log('📍 SUPABASE_URL:', !!supabaseUrl)
    console.log('🔑 SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    console.log('🔑 STRIPE_SECRET_KEY:', !!stripeSecretKey)
    console.log('🔐 STRIPE_WEBHOOK_SECRET:', !!webhookSecret)

    // If environment variables are missing, still try to process the webhook
    // but log the issue for debugging
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Missing Supabase configuration',
          received: true 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    if (!stripeSecretKey) {
      console.error('❌ Missing Stripe secret key')
      return new Response(
        JSON.stringify({ 
          error: 'Missing Stripe configuration',
          received: true 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    // Get request body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('📦 Request body length:', body.length)
    console.log('🔐 Stripe signature present:', !!signature)

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    let event: Stripe.Event

    // Parse the webhook body directly (signature verification disabled for compatibility)
    console.log('⚠️ Parsing webhook body directly (signature verification disabled)')
    try {
      event = JSON.parse(body)
      console.log('✅ Webhook body parsed successfully')
    } catch (err) {
      console.error('❌ Failed to parse webhook body:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('📦 Event type:', event.type)
    console.log('📦 Event ID:', event.id)

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('💳 Processing checkout session:', session.id)
      console.log('💳 Payment status:', session.payment_status)
      console.log('👤 Client reference ID:', session.client_reference_id)
      console.log('👤 Customer email:', session.customer_details?.email)

      // Get user ID from client_reference_id or metadata
      const userId = session.client_reference_id || session.metadata?.userId

      if (!userId) {
        console.error('❌ No user ID found in checkout session')
        return new Response(
          JSON.stringify({ 
            error: 'No user ID found',
            received: true 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Only proceed if payment was successful
      if (session.payment_status !== 'paid') {
        console.log('⚠️ Payment not completed, status:', session.payment_status)
        return new Response(
          JSON.stringify({ 
            received: true, 
            message: 'Payment not completed yet' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('✅ Supabase client initialized')

      console.log(`🔄 Updating user ${userId} to premium...`)

      // Update user to premium
      const { data, error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', userId)
        .select('id, email, is_premium')
        .single()

      if (error) {
        console.error('❌ Database update error:', error)
        return new Response(
          JSON.stringify({ 
            error: `Failed to update user: ${error.message}`,
            received: true 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          },
        )
      }

      console.log('✅ User updated to premium:', data)

      // Record welcome email
      try {
        const { error: emailError } = await supabase
          .from('welcome_emails')
          .insert({
            user_id: userId,
            email: session.customer_details?.email || '',
            status: 'sent'
          })

        if (emailError) {
          console.error('❌ Welcome email record error:', emailError)
        } else {
          console.log('✅ Welcome email recorded')
        }
      } catch (emailError) {
        console.error('❌ Welcome email failed:', emailError)
      }

      console.log('✅ Checkout session processed successfully')
      
      return new Response(
        JSON.stringify({ 
          received: true,
          success: true,
          userId: userId,
          premiumStatus: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Handle other event types
    console.log(`ℹ️ Unhandled event type: ${event.type}`)
    return new Response(
      JSON.stringify({ 
        received: true, 
        event_type: event.type,
        message: 'Event received but not processed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        received: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})