import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🎯 Webhook received request')
  console.log('📍 Request method:', req.method)
  console.log('📍 Request URL:', req.url)
  console.log('🌐 Request headers:', Object.fromEntries(req.headers.entries()))

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method)
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('Stripe Key') || '', {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || Deno.env.get('Stripe Webhook Secret')

    console.log('🔐 Webhook secret exists:', !!webhookSecret)
    console.log('✍️ Signature exists:', !!signature)
    console.log('📄 Body length:', body.length)
    console.log('📄 Body preview:', body.substring(0, 200) + '...')

    if (!signature) {
      console.error('❌ Missing Stripe signature header')
      return new Response('Missing signature', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    if (!webhookSecret) {
      console.error('❌ Missing webhook secret environment variable')
      return new Response('Webhook secret not configured', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    console.log('🔍 Constructing Stripe event...')
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Event constructed successfully:', event.type)
      console.log('📋 Event ID:', event.id)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400, 
        headers: corsHeaders 
      })
    }

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
        console.log('📋 Session ID:', session.id)
        console.log('👤 User ID from client_reference_id:', userId)
        console.log('💳 Payment status:', session.payment_status)
        console.log('🔄 Session mode:', session.mode)
        console.log('💰 Amount total:', session.amount_total)
        console.log('💱 Currency:', session.currency)
        console.log('📧 Customer email:', session.customer_details?.email)
        
        if (!userId) {
          console.error('❌ No user ID found in checkout session')
          return new Response('No user ID in session', { 
            status: 400, 
            headers: corsHeaders 
          })
        }

        if (session.payment_status !== 'paid') {
          console.log('⚠️ Payment not completed yet, status:', session.payment_status)
          return new Response('Payment not completed', { 
            status: 200, 
            headers: corsHeaders 
          })
        }

        // Check if user exists first
        console.log(`🔍 Checking if user ${userId} exists...`)
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, email, is_premium')
          .eq('id', userId)
          .single()

        if (fetchError) {
          console.error('❌ Error fetching user:', fetchError)
          return new Response(`User not found: ${fetchError.message}`, { 
            status: 400, 
            headers: corsHeaders 
          })
        }

        console.log('👤 Found user:', existingUser)

        // Update user to premium status
        console.log(`🔄 Updating user ${userId} to premium status...`)
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ is_premium: true })
          .eq('id', userId)
          .select('id, email, is_premium')
          .single()

        if (updateError) {
          console.error('❌ Error updating user premium status:', updateError)
          return new Response(`Database update failed: ${updateError.message}`, { 
            status: 500, 
            headers: corsHeaders 
          })
        }

        console.log('✅ User updated successfully:', updateData)

        // Double-check the update worked
        const { data: verifyUser, error: verifyError } = await supabase
          .from('users')
          .select('is_premium')
          .eq('id', userId)
          .single()
        
        if (verifyError) {
          console.error('❌ Error verifying user update:', verifyError)
        } else {
          console.log(`✅ User ${userId} premium status verified:`, verifyUser.is_premium)
        }

        console.log(`🎉 User ${userId} successfully upgraded to premium!`)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        console.log('=== SUBSCRIPTION DELETED ===')
        console.log('👤 Customer ID:', customerId)
        
        // For now, we don't have a way to map customer ID back to user ID
        // This would require storing the customer ID when creating the checkout session
        console.log('⚠️ Subscription cancellation handling not implemented yet')
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        console.log('=== PAYMENT FAILED ===')
        console.log('👤 Customer ID:', customerId)
        console.log('💰 Amount due:', invoice.amount_due)
        
        // Handle failed payment - could send email notification
        console.log(`💸 Payment failed for customer ${customerId}`)
        break
      }
      
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ 
        received: true, 
        event_type: event.type,
        event_id: event.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})