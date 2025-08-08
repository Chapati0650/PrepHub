import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ehlklfopwpmgkthqmqgd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key exists:', !!supabaseKey);
console.log('🔑 Key length:', supabaseKey?.length || 0);

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL');
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable');
  console.error('💡 Please check your .env file and ensure VITE_SUPABASE_ANON_KEY is set');
  throw new Error('Missing Supabase anon key - check your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client created successfully');