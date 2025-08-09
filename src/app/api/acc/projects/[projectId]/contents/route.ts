import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    console.log("🔍 ACC Browser: Fetching project contents for:", projectId);
    
    const contents = await ACCService.getProjectContents(projectId);
    
    console.log("🔍 ACC Browser: Project contents fetched successfully");
    
    return NextResponse.json({
      success: true,
      folders: contents.folders || [],
      items: contents.items || []
    });
    
  } catch (error) {
    console.error("🔍 ACC Browser: Error fetching project contents:", error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error"
      }
    }, { status: 500 });
  }
}
