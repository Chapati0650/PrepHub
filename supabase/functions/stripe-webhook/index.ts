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

  try {
    const stripe = new Stripe(Deno.env.get('Stripe Key') || '', {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('Stripe Webhook Secret')

    if (!signature || !webhookSecret) {
      throw new Error('Missing signature or webhook secret')
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        
        if (userId) {
          // Update user to premium status
          const { error } = await supabase
            .from('users')
            .update({ is_premium: true })
            .eq('id', userId)

          if (error) {
            console.error('Error updating user premium status:', error)
            throw error
          }

          console.log(`User ${userId} upgraded to premium`)
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