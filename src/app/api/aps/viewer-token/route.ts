import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function POST(request: NextRequest) {
  try {
    const { fileId, projectId } = await request.json();
    
    console.log(`🔍 APS Viewer: Generating token for file ${fileId} in project ${projectId}`);
    
    // Get 2-legged OAuth token directly (like in successful tests)
    const token = await get2LeggedToken();
    
    // Get the correct version URN for ACC files (for viewer loading)
    const viewerUrn = await ACCService.getVersionURN(fileId, projectId);
    
    // Get the correct translation URN for ACC files (for translation jobs)
    const translationUrn = await ACCService.getTranslationURN(fileId, projectId);
    
    console.log(`🔍 APS Viewer: Viewer URN: ${viewerUrn}`);
    console.log(`🔍 APS Viewer: Translation URN: ${translationUrn}`);
    
    // Convert URN to base64-url format for APS API calls
    const base64TranslationUrn = ACCService.urnToBase64(translationUrn);
    console.log(`🔍 APS Viewer: Base64 Translation URN: ${base64TranslationUrn}`);
    
    // First, check if the file is already translated
    const manifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${base64TranslationUrn}/manifest`;
    
    console.log(`🔍 APS Viewer: Checking manifest: ${manifestUrl}`);
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      console.log('🔍 APS Viewer: Manifest found:', manifest);
      
      // Check if translation is complete
      if (manifest.status === 'success') {
        console.log('🔍 APS Viewer: File already translated, returning token');
        return NextResponse.json({
          urn: viewerUrn,
          base64Urn: ACCService.urnToBase64(viewerUrn),
          token: token,
          status: 'ready'
        });
      }
    }
    
    // If not translated, start translation
    console.log('🔍 APS Viewer: Starting translation job...');
    
    const response = await fetch('https://developer.api.autodesk.com/modelderivative/v2/designdata/job', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-force': 'true'
      },
      body: JSON.stringify({
        input: {
          urn: base64TranslationUrn
        },
        output: {
          formats: [
            {
              type: 'svf',
              views: ['2d', '3d']
            }
          ]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 APS Viewer: Token generation failed:', errorText);
      throw new Error(`APS Viewer token generation failed: ${response.status} - ${errorText}`);
    }

    const jobData = await response.json();
    console.log('🔍 APS Viewer: Job created successfully:', jobData);
    
    return NextResponse.json({
      urn: viewerUrn,
      base64Urn: ACCService.urnToBase64(viewerUrn),
      jobId: jobData.result,
      token: token,
      status: 'translating'
    });
    
  } catch (error) {
    console.error('🔍 APS Viewer: Error generating viewer token:', error);
    return NextResponse.json(
      { error: 'Failed to generate APS viewer token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 2-legged OAuth function (like in successful tests)
async function get2LeggedToken(): Promise<string> {
  console.log('🔍 APS Viewer: Getting 2-legged OAuth token...');
  
  const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.APS_WEB_APP_CLIENT_ID!,
      client_secret: process.env.APS_WEB_APP_CLIENT_SECRET!,
      grant_type: 'client_credentials',
      scope: 'viewables:read data:read'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🔍 APS Viewer: 2-legged token request failed:', errorText);
    throw new Error(`APS 2-legged token request failed: ${response.status} - ${errorText}`);
  }

  const tokenData = await response.json();
  const token = tokenData.access_token;
  
  console.log('🔍 APS Viewer: 2-legged token received successfully');
  return token;
}
