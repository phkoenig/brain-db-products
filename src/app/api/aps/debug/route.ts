import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 APS Debug: Starting credential check...");
    
    const APS_CLIENT_ID = process.env.APS_CLIENT_ID;
    const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET;
    
    // Check if credentials are set
    const credentialsCheck = {
      APS_CLIENT_ID: APS_CLIENT_ID ? `${APS_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
      APS_CLIENT_SECRET: APS_CLIENT_SECRET ? `${APS_CLIENT_SECRET.substring(0, 10)}...` : 'NOT SET',
      both_set: !!(APS_CLIENT_ID && APS_CLIENT_SECRET)
    };

    console.log("🔍 APS Debug: Credentials check:", credentialsCheck);

    if (!credentialsCheck.both_set) {
      return NextResponse.json({ 
        error: "APS credentials not properly configured",
        credentials: credentialsCheck
      }, { status: 500 });
    }

    // Test the token endpoint with detailed logging
    console.log("🔍 APS Debug: Testing token endpoint...");
    
    const tokenResponse = await fetch('https://developer.api.autodesk.com/authentication/v1/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: APS_CLIENT_ID!,
        client_secret: APS_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'data:write data:create bucket:create bucket:read'
      })
    });

    console.log("🔍 APS Debug: Token response status:", tokenResponse.status);
    console.log("🔍 APS Debug: Token response headers:", Object.fromEntries(tokenResponse.headers.entries()));

    const responseText = await tokenResponse.text();
    console.log("🔍 APS Debug: Token response body:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw_text: responseText };
    }

    if (!tokenResponse.ok) {
      return NextResponse.json({ 
        error: "APS token request failed",
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        response: responseData,
        credentials: credentialsCheck,
        note: "Check if APS_CLIENT_ID and APS_CLIENT_SECRET are correct in .env.local"
      }, { status: tokenResponse.status });
    }

    return NextResponse.json({ 
      success: true,
      message: "APS credentials are working!",
      token_info: {
        access_token: responseData.access_token ? `${responseData.access_token.substring(0, 20)}...` : 'NOT FOUND',
        expires_in: responseData.expires_in,
        token_type: responseData.token_type
      },
      credentials: credentialsCheck
    });

  } catch (error: any) {
    console.error("🔍 APS Debug: Error:", error);
    return NextResponse.json({ 
      error: "APS debug failed",
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
