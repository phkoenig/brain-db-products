import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Test: Starting ACC authentication test...");
    
    // Test 1: Token abrufen
    console.log("🔍 ACC Test: Testing token retrieval...");
    const token = await ACCService.getToken();
    console.log("🔍 ACC Test: Token received successfully");
    
         // Test 2: ACC-Services prüfen
     console.log("🔍 ACC Test: Testing ACC service availability...");
     
     // Zuerst prüfen, ob ACC überhaupt verfügbar ist
     const accTestResponse = await fetch('https://developer.api.autodesk.com/acc/v1', {
       headers: {
         'Authorization': `Bearer ${token}`,
         'x-ads-region': 'EMEA'
       }
     });
     
     console.log("🔍 ACC Test: ACC service status:", accTestResponse.status);
     
     // Test 3: Projekte abrufen
     console.log("🔍 ACC Test: Testing projects retrieval...");
     const projects = await ACCService.getProjects();
     console.log("🔍 ACC Test: Projects retrieved successfully:", projects.length, "projects");
    
    // Test 3: Erste Projekt-Details abrufen (falls vorhanden)
    let firstProjectDetails = null;
    if (projects.length > 0) {
      console.log("🔍 ACC Test: Testing project details retrieval...");
      firstProjectDetails = await ACCService.getProject(projects[0].id);
      console.log("🔍 ACC Test: Project details retrieved successfully");
    }
    
    // Test 4: Projekt-Inhalte abrufen (falls vorhanden)
    let projectContents = null;
    if (projects.length > 0) {
      console.log("🔍 ACC Test: Testing project contents retrieval...");
      projectContents = await ACCService.getProjectContents(projects[0].id);
      console.log("🔍 ACC Test: Project contents retrieved successfully");
    }
    
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        token: {
          status: "✅ Success",
          message: "Token retrieved successfully"
        },
        projects: {
          status: "✅ Success",
          count: projects.length,
          message: `${projects.length} projects found`
        },
        projectDetails: {
          status: projects.length > 0 ? "✅ Success" : "⚠️ Skipped",
          message: projects.length > 0 ? "Project details retrieved" : "No projects available"
        },
        projectContents: {
          status: projects.length > 0 ? "✅ Success" : "⚠️ Skipped",
          message: projects.length > 0 ? "Project contents retrieved" : "No projects available"
        }
      },
      data: {
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          projectType: p.projectType
        })),
        firstProject: firstProjectDetails ? {
          id: firstProjectDetails.id,
          name: firstProjectDetails.name,
          status: firstProjectDetails.status,
          projectType: firstProjectDetails.projectType,
          value: firstProjectDetails.value,
          currency: firstProjectDetails.currency
        } : null,
        projectContents: projectContents ? {
          files: projectContents.items.length,
          folders: projectContents.folders.length,
          sampleFiles: projectContents.items.slice(0, 3).map(item => ({
            id: item.id,
            name: item.displayName,
            type: item.extension?.data?.extension,
            size: item.size,
            status: ACCService.getFileStatus(item)
          }))
        } : null
      }
    };
    
    console.log("🔍 ACC Test: All tests completed successfully");
    return NextResponse.json(testResults);
    
  } catch (error) {
    console.error("🔍 ACC Test: Error during testing:", error);
    
    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      tests: {
        token: {
          status: "❌ Failed",
          message: "Token retrieval failed"
        },
        projects: {
          status: "❌ Failed",
          message: "Projects retrieval failed"
        },
        projectDetails: {
          status: "❌ Failed",
          message: "Project details retrieval failed"
        },
        projectContents: {
          status: "❌ Failed",
          message: "Project contents retrieval failed"
        }
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
