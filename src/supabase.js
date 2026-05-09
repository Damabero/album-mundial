import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log('[v0] Supabase URL configured:', supabaseUrl ? 'Yes' : 'No')
console.log('[v0] Supabase Anon Key configured:', supabaseAnonKey ? 'Yes' : 'No')

let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('[v0] Supabase client created successfully')
} else {
  console.error('[v0] Supabase environment variables not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export { supabase }
