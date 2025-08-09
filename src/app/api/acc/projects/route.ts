import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Browser: Fetching projects...");
    
    const projects = await ACCService.getProjects();
    
    console.log("🔍 ACC Browser: Projects fetched successfully:", projects.length);
    
    return NextResponse.json({
      success: true,
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        projectType: project.type
      }))
    });
    
  } catch (error) {
    console.error("🔍 ACC Browser: Error fetching projects:", error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error"
      }
    }, { status: 500 });
  }
}
