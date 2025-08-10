import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 APS Internal: Generating internal token...');
    
    // 2-legged OAuth token für interne Operationen (erweiterte Scopes)
    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.APS_WEB_APP_CLIENT_ID!,
        client_secret: process.env.APS_WEB_APP_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'data:read data:write data:create bucket:create bucket:read bucket:delete viewables:read'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 APS Internal: Token request failed:', errorText);
      throw new Error(`APS internal token request failed: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    
    console.log('🔍 APS Internal: Internal token generated successfully');
    
    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    });
    
  } catch (error) {
    console.error('🔍 APS Internal: Error generating internal token:', error);
    return NextResponse.json(
      { error: 'Failed to generate APS internal token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
