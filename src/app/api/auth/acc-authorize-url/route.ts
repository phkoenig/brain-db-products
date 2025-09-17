import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC OAuth API: Generating authorization URL...");
    
    // Generate authorization URL on server side (static, no parameters needed)
    const authorizationUrl = ACCOAuthService.getAuthorizationUrl();
    
    console.log("🔍 ACC OAuth API: Authorization URL generated successfully");
    
    return NextResponse.json({
      success: true,
      authorizationUrl: authorizationUrl
    });

  } catch (error) {
    console.error("🔍 ACC OAuth API: Error generating authorization URL:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
