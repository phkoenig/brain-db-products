import { NextRequest, NextResponse } from 'next/server';
import { ACCOAuthService } from '@/lib/acc-oauth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('🔍 ACC OAuth Callback: Processing callback...');
    console.log('🔍 ACC OAuth Callback: Code:', code ? 'present' : 'missing');
    console.log('🔍 ACC OAuth Callback: State:', state);
    console.log('🔍 ACC OAuth Callback: Origin:', origin);

            if (code) {
              try {
                // Exchange authorization code for tokens
                const tokens = await ACCOAuthService.exchangeCodeForTokens(code);
                
                console.log('🔍 ACC OAuth Callback: Tokens received successfully');
                console.log('🔍 ACC OAuth Callback: Access token length:', tokens.access_token?.length || 0);
                console.log('🔍 ACC OAuth Callback: Refresh token length:', tokens.refresh_token?.length || 0);
                
                // Store shared token in database for all users
                try {
                  const { ACCService } = await import('@/lib/acc');
                  await ACCService.storeSharedToken(tokens);
                  console.log('🔍 ACC OAuth Callback: Shared token stored in database');
                } catch (storeError) {
                  console.error('🔍 ACC OAuth Callback: Failed to store shared token:', storeError);
                  // Continue anyway - token is still valid in memory
                }
                
                // Erfolgreiche Authentifizierung - weiterleiten zur Settings-Seite
                return NextResponse.redirect(`${origin}/zepta/f16/settings?auth=success`);
              } catch (error) {
                console.error('🔍 ACC OAuth Callback: Token exchange failed:', error);
                return NextResponse.redirect(`${origin}/zepta/f16/settings?error=auth_callback_error`);
              }
            }

    // Fehler oder kein Code - zur Settings-Seite mit Fehler
    console.log('🔍 ACC OAuth Callback: No code provided');
    return NextResponse.redirect(`${origin}/zepta/f16/settings?error=auth_failed`);
  } catch (error) {
    console.error('🔍 ACC OAuth Callback: Unexpected error:', error);
    return NextResponse.redirect(`${origin}/zepta/f16/settings?error=unexpected_error`);
  }
}