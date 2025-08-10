import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function POST(request: NextRequest) {
  try {
    const { fileId, projectId } = await request.json();
    
    console.log(`🔍 ACC Viewer: Generating token for file ${fileId} in project ${projectId}`);
    
    // Generate URN for the file - use the correct version URN
    const urn = await ACCService.getVersionURN(fileId);
    console.log(`🔍 ACC Viewer: Generated URN: ${urn}`);
    
    // Get access token
    const token = await ACCService.getToken();
    
    // First, check if the file is already translated
    const manifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`;
    
    console.log(`🔍 ACC Viewer: Checking manifest: ${manifestUrl}`);
    
    const manifestResponse = await fetch(manifestUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      console.log('🔍 ACC Viewer: Manifest found:', manifest);
      
      // Check if translation is complete
      if (manifest.status === 'success') {
        console.log('🔍 ACC Viewer: File already translated, returning token');
        return NextResponse.json({
          urn: urn,
          token: token,
          status: 'ready'
        });
      }
    }
    
    // If not translated, start translation
    console.log('🔍 ACC Viewer: Starting translation job...');
    
    const response = await fetch('https://developer.api.autodesk.com/modelderivative/v2/designdata/job', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-force': 'true'
      },
      body: JSON.stringify({
        input: {
          urn: urn
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
      console.error('🔍 ACC Viewer: Token generation failed:', errorText);
      throw new Error(`Viewer token generation failed: ${response.status} - ${errorText}`);
    }

    const jobData = await response.json();
    console.log('🔍 ACC Viewer: Job created successfully:', jobData);
    
    return NextResponse.json({
      urn: urn,
      jobId: jobData.result,
      token: token,
      status: 'translating'
    });
    
  } catch (error) {
    console.error('🔍 ACC Viewer: Error generating viewer token:', error);
    return NextResponse.json(
      { error: 'Failed to generate viewer token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
