import { NextRequest, NextResponse } from "next/server";
import { ACCOAuthService } from "@/lib/acc-oauth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urn = searchParams.get('urn');

    console.log("🔍 ACC Manifest API: Checking manifest for URN:", urn);

    if (!urn) {
      return NextResponse.json({
        success: false,
        error: "Missing URN parameter"
      }, { status: 400 });
    }

    // Normalize/trim URN in case of accidental whitespace
    const urnTrimmed = urn.trim();

    // Get access token
    const token = await ACCOAuthService.getAccessToken();
    console.log("🔍 ACC Manifest API: Token obtained, length:", token?.length);

    // Use global host with regional header
    const manifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urnTrimmed}/manifest`;
    console.log("🔍 ACC Manifest API: Manifest URL:", manifestUrl);

    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-ads-region': 'EMEA'
      }
    });

    if (!manifestResponse.ok) {
      const errorText = await manifestResponse.text();
      const wwwAuthenticate = manifestResponse.headers.get('WWW-Authenticate') || manifestResponse.headers.get('www-authenticate');
      console.error("🔍 ACC Manifest API: Manifest request failed:", manifestResponse.status, errorText, "WWW-Authenticate:", wwwAuthenticate || "<none>");
      
      return NextResponse.json({
        success: false,
        error: `Manifest request failed: ${manifestResponse.status} - ${errorText}`,
        status: manifestResponse.status,
        wwwAuthenticate: wwwAuthenticate || undefined
      }, { status: manifestResponse.status });
    }

    const manifestData = await manifestResponse.json();
    console.log("🔍 ACC Manifest API: Manifest received:", manifestData);

    // Check if manifest has successful derivatives
    const hasSuccessfulDerivatives = manifestData.derivatives?.some((derivative: any) => 
      derivative.status === 'success' && 
      (derivative.outputType === 'svf' || derivative.outputType === 'svf2')
    );

    const svf2Derivatives = manifestData.derivatives?.filter((derivative: any) => 
      derivative.status === 'success' && derivative.outputType === 'svf2'
    );

    console.log("🔍 ACC Manifest API: Has successful derivatives:", hasSuccessfulDerivatives);
    console.log("🔍 ACC Manifest API: SVF2 derivatives:", svf2Derivatives?.length || 0);

    return NextResponse.json({
      success: true,
      manifest: manifestData,
      hasSuccessfulDerivatives,
      svf2Derivatives: svf2Derivatives || [],
      isReady: hasSuccessfulDerivatives
    });

  } catch (error) {
    console.error("🔍 ACC Manifest API: Error checking manifest:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
