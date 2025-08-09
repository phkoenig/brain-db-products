import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log("🔍 ACC OAuth Callback: Received callback");
    console.log("🔍 ACC OAuth Callback: URL:", request.url);
    console.log("🔍 ACC OAuth Callback: Code present:", !!code);
    console.log("🔍 ACC OAuth Callback: State present:", !!state);
    console.log("🔍 ACC OAuth Callback: Error present:", !!error);
    console.log("🔍 ACC OAuth Callback: Code length:", code?.length || 0);

    // Check for OAuth errors
    if (error) {
      console.error("🔍 ACC OAuth Callback: OAuth error:", error);
      return NextResponse.redirect(new URL('/auth/error?error=' + error, request.url));
    }

    // Check for authorization code
    if (!code) {
      console.error("🔍 ACC OAuth Callback: No authorization code received");
      console.error("🔍 ACC OAuth Callback: All search params:", Object.fromEntries(searchParams.entries()));
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }

    console.log("🔍 ACC OAuth Callback: Exchanging code for tokens...");

    // Exchange authorization code for tokens
    const tokens = await ACCOAuthService.exchangeCodeForTokens(code);
    
    console.log("🔍 ACC OAuth Callback: Tokens received successfully");

    // Redirect to success page with token info
    const successUrl = new URL('/auth/success', request.url);
    successUrl.searchParams.set('access_token', tokens.access_token);
    successUrl.searchParams.set('expires_in', tokens.expires_in.toString());
    
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error("🔍 ACC OAuth Callback: Error during token exchange:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
