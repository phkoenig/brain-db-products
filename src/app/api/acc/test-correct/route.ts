import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Correct Test: Starting test with correct endpoints...");
    
    // Test 1: Token abrufen
    console.log("🔍 ACC Correct Test: Testing token retrieval...");
    const token = await ACCService.getToken();
    console.log("🔍 ACC Correct Test: Token received successfully");
    
    // Test 2: Projekte mit korrektem Endpoint abrufen
    console.log("🔍 ACC Correct Test: Testing projects with correct endpoint...");
    const projects = await ACCService.getProjects();
    console.log("🔍 ACC Correct Test: Projects retrieved successfully:", projects.length);
    
    // Test 3: Erste Projekt-Details abrufen (falls Projekte vorhanden)
    let projectDetails = null;
    if (projects.length > 0) {
      console.log("🔍 ACC Correct Test: Testing project details...");
      const firstProject = projects[0];
      projectDetails = await ACCService.getProject(firstProject.id);
      console.log("🔍 ACC Correct Test: Project details retrieved successfully");
    }
    
    // Test 4: Projekt-Inhalte abrufen (falls Projekte vorhanden)
    let projectContents = null;
    if (projects.length > 0) {
      console.log("🔍 ACC Correct Test: Testing project contents...");
      const firstProject = projects[0];
      projectContents = await ACCService.getProjectContents(firstProject.id);
      console.log("🔍 ACC Correct Test: Project contents retrieved successfully");
    }
    
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        token: "✅ Success",
        projects: projects.length,
        projectDetails: projectDetails ? "✅ Success" : "⚠️ No projects available",
        projectContents: projectContents ? "✅ Success" : "⚠️ No projects available"
      },
      details: {
        token: {
          status: "✅ Success",
          message: "OAuth2 token retrieved successfully"
        },
        projects: {
          status: "✅ Success",
          count: projects.length,
          data: projects
        },
        projectDetails: projectDetails ? {
          status: "✅ Success",
          data: projectDetails
        } : {
          status: "⚠️ Skipped",
          message: "No projects available for testing"
        },
        projectContents: projectContents ? {
          status: "✅ Success",
          folders: projectContents.folders.length,
          items: projectContents.items.length,
          data: projectContents
        } : {
          status: "⚠️ Skipped", 
          message: "No projects available for testing"
        }
      },
      recommendations: [
        "✅ ACC Integration funktioniert mit korrekten Endpoints",
        `📊 ${projects.length} Projekte gefunden`,
        projectContents ? `📁 ${projectContents.folders.length} Ordner, ${projectContents.items.length} Dateien verfügbar` : "📁 Keine Projekt-Inhalte verfügbar"
      ]
    };
    
    console.log("🔍 ACC Correct Test: All tests completed successfully");
    return NextResponse.json(testResults);
    
  } catch (error) {
    console.error("🔍 ACC Correct Test: Error during testing:", error);
    
    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      summary: {
        token: "❌ Failed",
        projects: "❌ Failed",
        projectDetails: "❌ Failed",
        projectContents: "❌ Failed"
      },
      recommendations: [
        "❌ ACC Integration fehlgeschlagen",
        "🔍 Prüfe Custom Integration Status in ACC",
        "🔍 Prüfe Account ID und API-Endpoints",
        "🔍 Prüfe OAuth2 Scopes im Developer Portal"
      ]
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
