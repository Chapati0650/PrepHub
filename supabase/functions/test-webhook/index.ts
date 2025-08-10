import { createClient } from 'npm:@supabase/supabase-js@2'

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

  console.log('🧪 Test webhook function called')
  console.log('📍 Request method:', req.method)

  try {
    const { userId } = await req.json()
    console.log('👤 User ID received:', userId)

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔧 Environment check:')
    console.log('📍 SUPABASE_URL exists:', !!supabaseUrl)
    console.log('🔑 SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client created')

    // Check if user exists
    console.log(`🔍 Checking if user ${userId} exists...`)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, is_premium')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError)
      throw new Error(`User not found: ${fetchError.message}`)
    }

    console.log('👤 Found user:', existingUser)
    console.log('💎 Current premium status:', existingUser.is_premium)

    // Update user to premium status (simulating successful payment)
    console.log(`🔄 Updating user ${userId} to premium status...`)
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('id', userId)
      .select('id, email, is_premium')
      .single()

    if (updateError) {
      console.error('❌ Error updating user premium status:', updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log('✅ User updated successfully:', updateData)

    // Verify the update worked
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('is_premium')
      .eq('id', userId)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying user update:', verifyError)
      throw new Error(`Verification failed: ${verifyError.message}`)
    }

    console.log(`✅ User ${userId} premium status verified:`, verifyUser.is_premium)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `User ${userId} successfully upgraded to premium!`,
        before: existingUser.is_premium,
        after: verifyUser.is_premium
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Test webhook error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
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