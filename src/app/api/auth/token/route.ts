import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 APS Auth: Generating viewer token...');
    
    // 2-legged OAuth token für Viewer (nur ViewablesRead Scope)
    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.APS_WEB_APP_CLIENT_ID!,
        client_secret: process.env.APS_WEB_APP_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'viewables:read' // Nur das Minimum für Viewer
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 APS Auth: Token request failed:', errorText);
      throw new Error(`APS token request failed: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    
    console.log('🔍 APS Auth: Viewer token generated successfully');
    
    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    });
    
  } catch (error) {
    console.error('🔍 APS Auth: Error generating viewer token:', error);
    return NextResponse.json(
      { error: 'Failed to generate APS viewer token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
