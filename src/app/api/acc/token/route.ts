import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Token API: Getting access token...");
    
    // Get access token from ACCService
    const token = await ACCService.getToken();
    
    console.log("🔍 ACC Token API: Token obtained successfully, length:", token?.length);
    
    return NextResponse.json({
      success: true,
      token: token
    });

  } catch (error) {
    console.error("🔍 ACC Token API: Error getting token:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
