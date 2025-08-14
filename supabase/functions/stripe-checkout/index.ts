import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('💳 Stripe checkout function called')
  console.log('📍 Request method:', req.method)

  try {
    const { userId } = await req.json()
    console.log('👤 User ID received:', userId)

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Check environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔧 Environment check:')
    console.log('🔑 STRIPE_SECRET_KEY exists:', !!stripeSecretKey)
    console.log('📍 SUPABASE_URL exists:', !!supabaseUrl)
    console.log('🔑 SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user details
    console.log(`🔍 Fetching user details for ${userId}...`)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Error fetching user:', userError)
      throw new Error(`User not found: ${userError.message}`)
    }

    console.log('👤 Found user:', user.email)

    // Create Stripe checkout session
    console.log('💳 Creating Stripe checkout session...')
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PrepHub Premium',
              description: 'One-time access to 300+ premium SAT Math questions',
            },
            unit_amount: 2499, // $24.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard?payment=success`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:5173'}/upgrade?payment=cancelled`,
      client_reference_id: userId,
      customer_email: user.email,
      metadata: {
        userId: userId,
        userEmail: user.email,
      },
    })

    console.log('✅ Checkout session created:', session.id)
    console.log('🔗 Checkout URL:', session.url)

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Stripe checkout error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})