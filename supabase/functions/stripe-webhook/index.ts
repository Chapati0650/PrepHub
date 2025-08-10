import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🎯 Webhook received request')
  console.log('📍 Request URL:', req.url)
  console.log('🌐 Request headers:', Object.fromEntries(req.headers.entries()))

  try {
    const stripe = new Stripe(Deno.env.get('Stripe Key') || '', {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('Stripe Webhook Secret')

    console.log('🔐 Webhook secret exists:', !!webhookSecret)
    console.log('✍️ Signature exists:', !!signature)
    console.log('📄 Body length:', body.length)

    if (!signature || !webhookSecret) {
      console.error('❌ Missing signature or webhook secret')
      throw new Error('Missing signature or webhook secret')
    }

    console.log('🔍 Constructing Stripe event...')
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('✅ Event constructed successfully:', event.type)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    console.log('🗄️ Supabase client created')

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        
        console.log('=== CHECKOUT SESSION COMPLETED ===')
        console.log('Session object:', JSON.stringify(session, null, 2))
        console.log('User ID from client_reference_id:', userId)
        console.log('Payment status:', session.payment_status)
        console.log('Session mode:', session.mode)
        
        if (userId) {
          // Update user to premium status
          console.log(`Updating user ${userId} to premium status`)
          const { error } = await supabase
            .from('users')
            .update({ is_premium: true })
            .eq('id', userId)

          if (error) {
            console.error('Error updating user premium status:', error)
            throw error
          } else {
            console.log(`Successfully updated user ${userId} to premium`)
            
            // Verify the update worked
            const { data: updatedUser, error: fetchError } = await supabase
              .from('users')
              .select('is_premium')
              .eq('id', userId)
              .single()
            
            if (fetchError) {
              console.error('Error verifying user update:', fetchError)
            } else {
              console.log(`User ${userId} premium status verified:`, updatedUser.is_premium)
            }
          }

          console.log(`User ${userId} upgraded to premium`)
        } else {
          console.error('No user ID found in checkout session')
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Find user by customer ID and downgrade to free
        const { data: sessions } = await supabase
          .from('checkout_sessions')
          .select('user_id')
          .eq('customer_id', customerId)
          .limit(1)
        
        if (sessions && sessions.length > 0) {
          const { error } = await supabase
            .from('users')
            .update({ is_premium: false })
            .eq('id', sessions[0].user_id)

          if (error) {
            console.error('Error downgrading user:', error)
            throw error
          }

          console.log(`User ${sessions[0].user_id} downgraded from premium`)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Handle failed payment - could send email notification
        console.log(`Payment failed for customer ${customerId}`)
        break
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
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})