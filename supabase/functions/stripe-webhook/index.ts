import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🎣 Webhook received')

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ Missing signature')
      throw new Error('Missing signature')
    }

    console.log('🔐 Verifying webhook signature...')
    
    // Use the async version of constructEvent
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    console.log('✅ Webhook signature verified')
    console.log('📦 Event type:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('💳 Checkout session completed:', session.id)
      console.log('👤 Client reference ID:', session.client_reference_id)

      const userId = session.client_reference_id || session.metadata?.userId

      if (!userId) {
        console.error('❌ No user ID found in session')
        throw new Error('No user ID found in checkout session')
      }

      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      )

      console.log(`🔄 Updating user ${userId} to premium...`)

      // Update user to premium
      const { data, error } = await supabase
        .from('users')
        .update({ is_premium: true })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('❌ Database update error:', error)
        throw new Error(`Failed to update user: ${error.message}`)
      }

      console.log('✅ User updated to premium:', data)

      // Send welcome email
      try {
        console.log('📧 Sending welcome email...')
        const { error: emailError } = await supabase
          .from('welcome_emails')
          .insert({
            user_id: userId,
            email: session.customer_details?.email || '',
            status: 'sent'
          })

        if (emailError) {
          console.error('❌ Welcome email error:', emailError)
        } else {
          console.log('✅ Welcome email logged')
        }
      } catch (emailError) {
        console.error('❌ Welcome email failed:', emailError)
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})