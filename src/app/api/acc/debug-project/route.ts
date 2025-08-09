import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Debug: Starting project debug...");
    
    // Test 1: Get projects list
    const projects = await ACCService.getProjects();
    console.log("🔍 ACC Debug: Projects retrieved:", projects.length);
    
    if (projects.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No projects found"
      });
    }
    
    const testProject = projects[0];
    console.log("🔍 ACC Debug: Testing with project:", testProject.name, testProject.id);
    
    // Test 2: Try different project ID formats
    const projectIdVariants = [
      testProject.id, // Original ID
      `b.${testProject.id}`, // With b. prefix
      testProject.id.replace(/^b\./, ''), // Without b. prefix
    ];
    
    const results = [];
    
    for (const projectId of projectIdVariants) {
      console.log("🔍 ACC Debug: Testing project ID:", projectId);
      
      // Test Data Management API v1
      try {
        const v1Url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/root/contents`;
        const token = await ACCService.getToken();
        
        const v1Response = await fetch(v1Url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        results.push({
          projectId,
          api: 'data/v1',
          url: v1Url,
          status: v1Response.status,
          success: v1Response.ok,
          error: v1Response.ok ? null : await v1Response.text()
        });
      } catch (error) {
        results.push({
          projectId,
          api: 'data/v1',
          url: `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/root/contents`,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Test Data Management API v2
      try {
        const v2Url = `https://developer.api.autodesk.com/data/v2/projects/${projectId}/folders/root/contents`;
        const token = await ACCService.getToken();
        
        const v2Response = await fetch(v2Url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        results.push({
          projectId,
          api: 'data/v2',
          url: v2Url,
          status: v2Response.status,
          success: v2Response.ok,
          error: v2Response.ok ? null : await v2Response.text()
        });
      } catch (error) {
        results.push({
          projectId,
          api: 'data/v2',
          url: `https://developer.api.autodesk.com/data/v2/projects/${projectId}/folders/root/contents`,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log("🔍 ACC Debug: All tests completed");
    
    return NextResponse.json({
      success: true,
      testProject: {
        name: testProject.name,
        id: testProject.id,
        status: testProject.status
      },
      results
    });
    
  } catch (error) {
    console.error("🔍 ACC Debug: Error during testing:", error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
