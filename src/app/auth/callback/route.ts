import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/zepta/f16';

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${origin}/zepta/f16?error=auth_callback_error`);
      }

      if (data.session) {
        // Erfolgreiche Authentifizierung - weiterleiten zur F16 Seite
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    // Fehler oder kein Code - zur F16 Seite mit Fehler
    return NextResponse.redirect(`${origin}/zepta/f16?error=auth_failed`);
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${origin}/zepta/f16?error=unexpected_error`);
  }
}