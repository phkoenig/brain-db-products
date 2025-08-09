import { NextRequest, NextResponse } from "next/server";
import { APSService } from "@/lib/aps";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 ACM Session: Creating ACM session...");
    console.log("🔍 ACM Session: Request URL:", request.url);
    console.log("🔍 ACM Session: Request method:", request.method);
    
    // Get a real token from APS for ACM session
    const token = await APSService.getAccessToken();
    
    console.log("🔍 ACM Session: ACM session created successfully");
    
    // Return ACM session data in the format the viewer expects
    return NextResponse.json({ 
      sessionId: `session_${Date.now()}`,
      access_token: token,
      expires_in: 3600, // 1 hour
      token_type: "Bearer"
    });

  } catch (error: any) {
    console.error("🔍 ACM Session: Error:", error);
    return NextResponse.json({ 
      error: "Failed to create ACM session",
      details: error.message
    }, { status: 500 });
  }
}
