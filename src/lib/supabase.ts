import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Create Supabase client with fallback handling
function createSupabaseClient(): SupabaseClient | null {
  try {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      console.log('Not in browser environment')
      return null
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0
    })
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return null
    }
    
    const client = createClient(supabaseUrl, supabaseAnonKey)
    console.log('Supabase client created successfully')
    return client
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

// Export the client
export const supabase = createSupabaseClient() 