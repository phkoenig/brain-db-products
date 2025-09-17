import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Token Status: Checking token status...");
    
    // Check if we have tokens in memory
    const memoryCache = (ACCOAuthService as any).tokenCache;
    console.log("🔍 ACC Token Status: Memory cache:", memoryCache ? 'exists' : 'null');
    
    // Check if we have tokens in global storage
    const globalTokens = (global as any).accOAuthTokens;
    console.log("🔍 ACC Token Status: Global storage:", globalTokens ? 'exists' : 'null');
    
    // Try to get access token
    let tokenStatus = 'not_found';
    let tokenLength = 0;
    let expiresAt = null;
    let error = null;
    
    try {
      const token = await ACCOAuthService.getAccessToken();
      tokenStatus = 'valid';
      tokenLength = token.length;
      
      // Get expiry info
      const cached = (ACCOAuthService as any).loadTokens();
      if (cached) {
        expiresAt = new Date(cached.expiresAt).toISOString();
      }
    } catch (err) {
      tokenStatus = 'invalid';
      error = err instanceof Error ? err.message : 'Unknown error';
    }
    
    return NextResponse.json({
      success: true,
      tokenStatus,
      tokenLength,
      expiresAt,
      error,
      memoryCache: memoryCache ? {
        hasTokens: !!memoryCache.tokens,
        expiresAt: new Date(memoryCache.expiresAt).toISOString(),
        accessTokenLength: memoryCache.tokens?.access_token?.length || 0,
        refreshTokenLength: memoryCache.tokens?.refresh_token?.length || 0
      } : null,
      globalStorage: globalTokens ? {
        hasTokens: !!globalTokens.tokens,
        expiresAt: new Date(globalTokens.expiresAt).toISOString(),
        accessTokenLength: globalTokens.tokens?.access_token?.length || 0,
        refreshTokenLength: globalTokens.tokens?.refresh_token?.length || 0
      } : null
    });

  } catch (error) {
    console.error("🔍 ACC Token Status: Error checking token status:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
