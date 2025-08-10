import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Browser: Fetching projects via Data Management API...");
    
    const projects = await ACCService.getProjectsDataManagement();
    
    console.log("🔍 ACC Browser: Projects fetched successfully:", projects.length);
    
    return NextResponse.json({
      data: projects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        projectType: project.projectType
      }))
    });
    
  } catch (error) {
    console.error("🔍 ACC Browser: Error fetching projects:", error);
    
    return NextResponse.json({
      error: {
        message: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
