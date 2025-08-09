import { NextRequest, NextResponse } from "next/server";
import { APSService } from "@/lib/aps";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 APS Viewer Token: Getting viewer token...");
    
    // Get a real token from APS for viewer access
    const token = await APSService.getToken();
    
    console.log("🔍 APS Viewer Token: Token received successfully");
    
    return NextResponse.json({ 
      access_token: token,
      expires_in: 3600 // 1 hour
    });

  } catch (error: any) {
    console.error("🔍 APS Viewer Token: Error:", error);
    return NextResponse.json({ 
      error: "Failed to get viewer token",
      details: error.message
    }, { status: 500 });
  }
}
