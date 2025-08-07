import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
}

export class AuthService {
  // Google OAuth Sign In
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Google sign in error:', error)
      throw error
    }
    
    return data
  }

  // Email/Password Sign In
  static async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Email sign in error:', error)
      throw error
    }
    
    return data
  }

  // Email Sign Up
  static async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Email sign up error:', error)
      throw error
    }
    
    return data
  }

  // Check if user is in allowlist
  static async checkAllowlist(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('auth_allowlist')
      .select('email, is_active')
      .eq('email', email)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Allowlist check error:', error)
      return false
    }
    
    return !!data
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user details from allowlist
    const { data: allowlistData } = await supabase
      .from('auth_allowlist')
      .select('name, role')
      .eq('email', user.email)
      .single()

    return {
      id: user.id,
      email: user.email!,
      name: allowlistData?.name || user.user_metadata?.full_name,
      role: allowlistData?.role || 'user'
    }
  }

  // Sign Out
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Listen to auth changes
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })
  }
}
