import { NextRequest, NextResponse } from "next/server";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Contents Test: Starting project contents test...");
    
    // Test 1: Token abrufen
    console.log("🔍 ACC Contents Test: Testing token retrieval...");
    const token = await ACCService.getToken();
    console.log("🔍 ACC Contents Test: Token received successfully");
    
    // Test 2: Projekte abrufen
    console.log("🔍 ACC Contents Test: Testing projects retrieval...");
    const projects = await ACCService.getProjects();
    console.log("🔍 ACC Contents Test: Projects retrieved successfully:", projects.length);
    
    // Test 3: Projekt-Inhalte für das erste aktive Projekt abrufen
    let projectContents = null;
    let testProject = null;
    
    if (projects.length > 0) {
      // Suche nach einem aktiven Projekt
      testProject = projects.find(p => p.status === 'active') || projects[0];
      console.log("🔍 ACC Contents Test: Testing project contents for:", testProject.name);
      
      try {
        projectContents = await ACCService.getProjectContents(testProject.id);
        console.log("🔍 ACC Contents Test: Project contents retrieved successfully");
      } catch (error) {
        console.error("🔍 ACC Contents Test: Project contents failed:", error);
        projectContents = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        token: "✅ Success",
        projects: projects.length,
        projectContents: projectContents && !projectContents.error ? "✅ Success" : "❌ Failed"
      },
      details: {
        token: {
          status: "✅ Success",
          message: "OAuth2 token retrieved successfully"
        },
        projects: {
          status: "✅ Success",
          count: projects.length,
          data: projects.slice(0, 5) // Nur erste 5 Projekte anzeigen
        },
        projectContents: projectContents ? {
          status: projectContents.error ? "❌ Failed" : "✅ Success",
          projectName: testProject?.name,
          projectId: testProject?.id,
          folders: projectContents.folders?.length || 0,
          items: projectContents.items?.length || 0,
          data: projectContents.error ? null : projectContents,
          error: projectContents.error || null
        } : {
          status: "⚠️ Skipped",
          message: "No projects available for testing"
        }
      },
      recommendations: [
        "✅ ACC Integration funktioniert für Projekte",
        `📊 ${projects.length} Projekte gefunden`,
        projectContents && !projectContents.error 
          ? `📁 ${projectContents.folders?.length || 0} Ordner, ${projectContents.items?.length || 0} Dateien verfügbar`
          : "📁 Projekt-Inhalte konnten nicht abgerufen werden"
      ]
    };
    
    console.log("🔍 ACC Contents Test: All tests completed");
    return NextResponse.json(testResults);
    
  } catch (error) {
    console.error("🔍 ACC Contents Test: Error during testing:", error);
    
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
