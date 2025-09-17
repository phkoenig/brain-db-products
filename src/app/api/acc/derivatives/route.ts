import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";
import { ACCDerivativeFinder } from "@/lib/acc-derivative-finder";

export async function POST(request: NextRequest) {
  try {
    const { fileId, projectId } = await request.json();
    
    console.log("🔍 ACC Derivatives API: Getting derivatives for file:", fileId, "project:", projectId);
    
    if (!fileId || !projectId) {
      return NextResponse.json({
        success: false,
        error: "Missing fileId or projectId parameter"
      }, { status: 400 });
    }

    // Get access token
    const token = await ACCService.getToken();
    console.log("🔍 ACC Derivatives API: Token obtained, length:", token?.length);
    
    // Use ACCDerivativeFinder to find derivatives
    const derivativeFinder = new ACCDerivativeFinder(token);
    const manifestInfo = await derivativeFinder.findDerivatives(projectId, fileId);
    
    console.log("🔍 ACC Derivatives API: Manifest info:", manifestInfo);
    
    if (manifestInfo.isTranslated) {
      // File is ready for viewing
      return NextResponse.json({
        success: true,
        urn: manifestInfo.bestViewingDerivative?.urn || manifestInfo.originalUrn,
        status: manifestInfo.status,
        isTranslated: true,
        message: `File is ready for viewing. Type: ${manifestInfo.bestViewingDerivative?.type || 'derivatives'}`
      });
    } else {
      // File is not translated or not found
      return NextResponse.json({
        success: false,
        error: manifestInfo.error || 'File not translated or derivatives not found',
        status: manifestInfo.status,
        isTranslated: false
      }, { status: 404 });
    }

  } catch (error) {
    console.error("🔍 ACC Derivatives API: Error getting derivatives:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
