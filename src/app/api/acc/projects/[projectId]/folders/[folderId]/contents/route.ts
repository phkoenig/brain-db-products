import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; folderId: string } }
) {
  try {
    const { projectId, folderId } = params;
    console.log("🔍 ACC Browser: Fetching folder contents for:", projectId, folderId);
    
    const contents = await ACCService.getProjectContents(projectId, folderId);
    
    console.log("🔍 ACC Browser: Folder contents fetched successfully");
    
    return NextResponse.json({
      success: true,
      folders: contents.folders || [],
      items: contents.items || []
    });
    
  } catch (error) {
    console.error("🔍 ACC Browser: Error fetching folder contents:", error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error"
      }
    }, { status: 500 });
  }
}
