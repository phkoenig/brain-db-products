import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function POST(_request: NextRequest) {
  try {
    console.log("🔍 ACC Token Renew API: Clearing cached OAuth tokens...");
    ACCOAuthService.clearTokens();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔍 ACC Token Renew API: Error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Support GET for convenience; delegate to POST handler
  return POST(request);
}
