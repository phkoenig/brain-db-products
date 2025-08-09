import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC OAuth API: Generating authorization URL...");
    
    // Extract origin from request headers
    const origin = request.headers.get('origin') || request.headers.get('referer');
    console.log("🔍 ACC OAuth API: Request origin:", origin);
    
    // Generate authorization URL on server side with origin
    const authorizationUrl = ACCOAuthService.getAuthorizationUrl(origin || undefined);
    
    console.log("🔍 ACC OAuth API: Authorization URL generated successfully");
    
    return NextResponse.json({
      success: true,
      authorizationUrl: authorizationUrl,
      origin: origin
    });

  } catch (error) {
    console.error("🔍 ACC OAuth API: Error generating authorization URL:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
