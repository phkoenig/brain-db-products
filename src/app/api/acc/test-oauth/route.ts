import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";
import { ACCService } from "@/lib/acc";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC OAuth Test: Starting OAuth test...");
    
    const results = {
      oauthStatus: 'unknown',
      tokenType: 'unknown',
      projectsAccess: false,
      contentsAccess: false,
      error: null as string | null
    };

    // Test 1: Try to get 3-legged OAuth token
    try {
      const token = await ACCOAuthService.getAccessToken();
      results.oauthStatus = 'success';
      results.tokenType = '3-legged';
      console.log("🔍 ACC OAuth Test: 3-legged OAuth successful");
    } catch (error) {
      results.oauthStatus = 'failed';
      results.error = error instanceof Error ? error.message : 'Unknown OAuth error';
      console.log("🔍 ACC OAuth Test: 3-legged OAuth failed, trying 2-legged fallback");
      
      // Test 2: Try 2-legged fallback
      try {
        const token = await ACCService.getToken();
        results.oauthStatus = 'fallback';
        results.tokenType = '2-legged';
        console.log("🔍 ACC OAuth Test: 2-legged fallback successful");
      } catch (fallbackError) {
        results.oauthStatus = 'complete_failure';
        results.error = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
        console.log("🔍 ACC OAuth Test: Both OAuth methods failed");
      }
    }

    // Test 3: Try to access projects (should work with both token types)
    if (results.oauthStatus !== 'complete_failure') {
      try {
        const projects = await ACCService.getProjects();
        results.projectsAccess = true;
        console.log("🔍 ACC OAuth Test: Projects access successful");
      } catch (error) {
        console.log("🔍 ACC OAuth Test: Projects access failed:", error);
      }
    }

    // Test 4: Try to access project contents (requires 3-legged OAuth)
    if (results.tokenType === '3-legged') {
      try {
        const projects = await ACCService.getProjects();
        if (projects.length > 0) {
          const contents = await ACCService.getProjectContents(projects[0].id);
          results.contentsAccess = true;
          console.log("🔍 ACC OAuth Test: Project contents access successful");
        }
      } catch (error) {
        console.log("🔍 ACC OAuth Test: Project contents access failed:", error);
      }
    }

    console.log("🔍 ACC OAuth Test: Test completed");

    return NextResponse.json({
      success: results.oauthStatus !== 'complete_failure',
      results,
      recommendations: generateRecommendations(results)
    });

  } catch (error) {
    console.error("🔍 ACC OAuth Test: Error during testing:", error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

function generateRecommendations(results: any): string[] {
  const recommendations = [];

  if (results.oauthStatus === 'complete_failure') {
    recommendations.push('❌ Keine OAuth-Methode funktioniert. Überprüfe die APS-Credentials.');
  }

  if (results.oauthStatus === 'failed' && results.tokenType === '2-legged') {
    recommendations.push('⚠️ Nur 2-legged OAuth verfügbar. 3-legged OAuth für Projekt-Inhalte erforderlich.');
    recommendations.push('🔐 Gehe zu /auth/acc-authorize für 3-legged OAuth-Autorisierung.');
  }

  if (results.tokenType === '3-legged' && !results.contentsAccess) {
    recommendations.push('⚠️ 3-legged OAuth funktioniert, aber Projekt-Inhalte nicht zugänglich.');
    recommendations.push('🔍 Überprüfe die ACC-Projektberechtigungen.');
  }

  if (results.tokenType === '3-legged' && results.contentsAccess) {
    recommendations.push('✅ 3-legged OAuth funktioniert perfekt! Alle ACC-Funktionen verfügbar.');
  }

  if (results.projectsAccess && !results.contentsAccess) {
    recommendations.push('ℹ️ Projekte sind zugänglich, aber Dateien erfordern 3-legged OAuth.');
  }

  return recommendations;
}
