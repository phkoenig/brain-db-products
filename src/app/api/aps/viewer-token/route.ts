import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 APS Viewer Token API: Getting viewer token...");
    
    const { fileId, projectId } = await request.json();
    
    if (!fileId || !projectId) {
      return NextResponse.json({
        error: "fileId and projectId are required"
      }, { status: 400 });
    }
    
    console.log("🔍 APS Viewer Token API: File ID:", fileId);
    console.log("🔍 APS Viewer Token API: Project ID:", projectId);
    
    // Get access token
    const accessToken = await ACCService.getToken();
    console.log("🔍 APS Viewer Token API: Access token obtained");
    
    // Get URN for the file
    const urn = await ACCService.getModelURN(fileId, projectId);
    console.log("🔍 APS Viewer Token API: URN obtained:", urn);
    
    return NextResponse.json({
      access_token: accessToken,
      urn: urn
    });
    
  } catch (error) {
    console.error("🔍 APS Viewer Token API: Error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}