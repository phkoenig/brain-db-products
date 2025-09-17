import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urn = searchParams.get('urn');

    console.log("🔍 ACC Translate API: Starting translation for URN:", urn);

    if (!urn) {
      return NextResponse.json({
        success: false,
        error: "Missing URN parameter"
      }, { status: 400 });
    }

    // Normalize/trim URN
    const urnTrimmed = urn.trim();

    // Get access token
    const token = await ACCOAuthService.getAccessToken();
    console.log("🔍 ACC Translate API: Token obtained, length:", token?.length);

    // Translation job URL
    const translateUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/job`;
    console.log("🔍 ACC Translate API: Translation URL:", translateUrl);

    // Translation job payload for SVF2
    const jobPayload = {
      input: {
        urn: urnTrimmed
      },
      output: {
        destination: {
          region: "EMEA"
        },
        formats: [
          {
            type: "svf2",
            views: ["3d", "2d"]
          }
        ]
      }
    };

    console.log("🔍 ACC Translate API: Job payload:", JSON.stringify(jobPayload, null, 2));

    const translateResponse = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-region': 'EMEA'
      },
      body: JSON.stringify(jobPayload)
    });

    if (!translateResponse.ok) {
      const errorText = await translateResponse.text();
      const wwwAuthenticate = translateResponse.headers.get('WWW-Authenticate') || translateResponse.headers.get('www-authenticate');
      console.error("🔍 ACC Translate API: Translation request failed:", translateResponse.status, errorText, "WWW-Authenticate:", wwwAuthenticate || "<none>");
      
      return NextResponse.json({
        success: false,
        error: `Translation request failed: ${translateResponse.status} - ${errorText}`,
        status: translateResponse.status,
        wwwAuthenticate: wwwAuthenticate || undefined
      }, { status: translateResponse.status });
    }

    const translateData = await translateResponse.json();
    console.log("🔍 ACC Translate API: Translation job started:", translateData);

    return NextResponse.json({
      success: true,
      job: translateData,
      urn: urnTrimmed,
      message: "Translation job started successfully"
    });

  } catch (error) {
    console.error("🔍 ACC Translate API: Error starting translation:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
