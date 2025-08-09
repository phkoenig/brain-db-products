import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 ACC Simple Test: Starting basic ACC test...");
    
    // Test 1: Token abrufen (gleiche Methode wie APS)
    console.log("🔍 ACC Simple Test: Testing token retrieval...");
    
    const tokenResponse = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-ads-region': 'EMEA'
      },
      body: new URLSearchParams({
        client_id: process.env.APS_WEB_APP_CLIENT_ID!,
        client_secret: process.env.APS_WEB_APP_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'data:read data:write bucket:create bucket:read bucket:delete'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('🔍 ACC Simple Test: Token request failed:', errorText);
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;
    console.log("🔍 ACC Simple Test: Token received successfully");
    
    // Test 2: Verschiedene ACC-Endpoints testen
    const endpoints = [
      { name: 'ACC v1 Root', url: 'https://developer.api.autodesk.com/acc/v1' },
      { name: 'ACC v1 Projects', url: 'https://developer.api.autodesk.com/acc/v1/projects' },
      { name: 'ACC v2 Root', url: 'https://developer.api.autodesk.com/acc/v2' },
      { name: 'ACC v2 Projects', url: 'https://developer.api.autodesk.com/acc/v2/projects' },
      { name: 'BIM 360 Projects', url: 'https://developer.api.autodesk.com/bim360/v1/projects' },
      { name: 'BIM 360 v2 Projects', url: 'https://developer.api.autodesk.com/bim360/v2/projects' }
    ];
    
    const endpointResults = [];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 ACC Simple Test: Testing ${endpoint.name}...`);
        
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-ads-region': 'EMEA'
          }
        });
        
        const result = {
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          data: null
        };
        
        if (response.ok) {
          try {
            const data = await response.json();
            result.data = data;
            console.log(`🔍 ACC Simple Test: ${endpoint.name} - SUCCESS`);
          } catch (parseError) {
            console.log(`🔍 ACC Simple Test: ${endpoint.name} - SUCCESS (no JSON)`);
          }
        } else {
          console.log(`🔍 ACC Simple Test: ${endpoint.name} - FAILED (${response.status})`);
        }
        
        endpointResults.push(result);
        
      } catch (error) {
        console.error(`🔍 ACC Simple Test: ${endpoint.name} - ERROR:`, error);
        endpointResults.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          statusText: error instanceof Error ? error.message : 'Unknown error',
          success: false,
          data: null
        });
      }
    }
    
    // Test 3: Verfügbare Services analysieren
    const availableServices = endpointResults.filter(r => r.success);
    const workingEndpoints = availableServices.map(s => s.name);
    
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        token: "✅ Success",
        availableServices: workingEndpoints,
        totalEndpoints: endpoints.length,
        workingEndpoints: availableServices.length
      },
      details: {
        token: {
          status: "✅ Success",
          message: "OAuth2 token retrieved successfully"
        },
        endpoints: endpointResults
      },
      recommendations: []
    };
    
    // Empfehlungen basierend auf den Ergebnissen
    if (availableServices.length === 0) {
      testResults.recommendations.push("Keine ACC-Endpoints verfügbar. Mögliche Ursachen:");
      testResults.recommendations.push("- ACC-Abonnement nicht aktiv");
      testResults.recommendations.push("- Falsche API-Credentials");
      testResults.recommendations.push("- Region-Einstellung falsch");
    } else {
      testResults.recommendations.push(`Verfügbare Services: ${workingEndpoints.join(', ')}`);
      
      if (workingEndpoints.includes('ACC v1 Projects')) {
        testResults.recommendations.push("✅ ACC v1 API funktioniert - verwende diese");
      } else if (workingEndpoints.includes('ACC v2 Projects')) {
        testResults.recommendations.push("✅ ACC v2 API funktioniert - verwende diese");
      } else if (workingEndpoints.includes('BIM 360 Projects')) {
        testResults.recommendations.push("✅ BIM 360 API funktioniert - verwende diese");
      }
    }
    
    console.log("🔍 ACC Simple Test: All tests completed");
    return NextResponse.json(testResults);
    
  } catch (error) {
    console.error("🔍 ACC Simple Test: Error during testing:", error);
    
    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      summary: {
        token: "❌ Failed",
        availableServices: [],
        totalEndpoints: 0,
        workingEndpoints: 0
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
