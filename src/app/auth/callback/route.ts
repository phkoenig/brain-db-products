import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Extract origin from request headers
    const origin = request.headers.get('origin') || request.headers.get('referer');
    
    console.log("🔍 ACC OAuth Callback: Received callback");
    console.log("🔍 ACC OAuth Callback: URL:", request.url);
    console.log("🔍 ACC OAuth Callback: Origin:", origin);
    console.log("🔍 ACC OAuth Callback: Code present:", !!code);
    console.log("🔍 ACC OAuth Callback: State present:", !!state);
    console.log("🔍 ACC OAuth Callback: Error present:", !!error);
    console.log("🔍 ACC OAuth Callback: Code length:", code?.length || 0);

    // Check for OAuth errors
    if (error) {
      console.error("🔍 ACC OAuth Callback: OAuth error:", error);
      const errorUrl = origin?.includes('localhost:3000') 
        ? 'http://localhost:3000/auth/error?error=' + error
        : 'https://megabrain.cloud/auth/error?error=' + error;
      return NextResponse.redirect(errorUrl);
    }

    // Check for authorization code
    if (!code) {
      console.error("🔍 ACC OAuth Callback: No authorization code received");
      console.error("🔍 ACC OAuth Callback: All search params:", Object.fromEntries(searchParams.entries()));
      const errorUrl = origin?.includes('localhost:3000') 
        ? 'http://localhost:3000/auth/error?error=no_code'
        : 'https://megabrain.cloud/auth/error?error=no_code';
      return NextResponse.redirect(errorUrl);
    }

    console.log("🔍 ACC OAuth Callback: Exchanging code for tokens...");

    // Exchange authorization code for tokens with origin
    const tokens = await ACCOAuthService.exchangeCodeForTokens(code, origin || undefined);
    
    console.log("🔍 ACC OAuth Callback: Tokens received successfully");

    // Determine success URL based on origin
    const baseUrl = origin?.includes('localhost:3000') 
      ? 'http://localhost:3000/auth/success'
      : 'https://megabrain.cloud/auth/success';
    
    const successUrl = new URL(baseUrl);
    successUrl.searchParams.set('access_token', tokens.access_token);
    successUrl.searchParams.set('expires_in', tokens.expires_in.toString());
    
    console.log("🔍 ACC OAuth Callback: Redirecting to:", successUrl.toString());
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error("🔍 ACC OAuth Callback: Error during token exchange:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const origin = request.headers.get('origin') || request.headers.get('referer');
    const errorUrl = origin?.includes('localhost:3000') 
      ? `http://localhost:3000/auth/error?error=${encodeURIComponent(errorMessage)}`
      : `https://megabrain.cloud/auth/error?error=${encodeURIComponent(errorMessage)}`;
    
    return NextResponse.redirect(errorUrl);
  }
}
