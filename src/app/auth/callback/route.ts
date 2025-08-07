import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/capture'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}&description=${error_description}`)
  }

  if (!code) {
    console.error('No code provided in OAuth callback')
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed&description=${exchangeError.message}`)
    }

    if (!data.session) {
      console.error('No session returned from code exchange')
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_session`)
    }

    // Successful authentication, redirect to the main app
    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected&description=${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
