import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const projectId = searchParams.get('projectId');

    console.log("🔍 ACC URN API: Getting URN for item:", itemId, "project:", projectId);

    if (!itemId || !projectId) {
      return NextResponse.json({
        success: false,
        error: "Missing itemId or projectId parameter"
      }, { status: 400 });
    }

    console.log("🔍 ACC URN API: itemId type:", typeof itemId);
    console.log("🔍 ACC URN API: itemId value:", itemId);
    console.log("🔍 ACC URN API: itemId length:", itemId?.length);
    console.log("🔍 ACC URN API: itemId starts with 'urn:':", itemId?.startsWith('urn:'));
    
    // Check if itemId is already a URN
    if (itemId && itemId.startsWith('urn:')) {
      console.log("🔍 ACC URN API: itemId is already a URN, using directly");
      const urn = itemId;
      console.log("🔍 ACC URN API: URN obtained successfully:", urn);
      
      return NextResponse.json({
        success: true,
        urn: urn
      });
    }
    
    // Get URN from ACCService using getVersionURN (like in Urprojekt)
    console.log("🔍 ACC URN API: Calling getVersionURN...");
    const urn = await ACCService.getVersionURN(itemId, projectId);
    
    console.log("🔍 ACC URN API: URN obtained successfully:", urn);
    
    return NextResponse.json({
      success: true,
      urn: urn
    });

  } catch (error) {
    console.error("🔍 ACC URN API: Error getting URN:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
