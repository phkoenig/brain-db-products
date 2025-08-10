import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';
import { ACCOAuthService } from '@/lib/acc-oauth';
import { TranslationChecker } from '@/lib/translation-checker';
import { ACCDerivativeFinder } from '@/lib/acc-derivative-finder';

export async function POST(request: NextRequest) {
  try {
    const { fileId, projectId } = await request.json();
    
    console.log(`🔍 APS Viewer: Generating token for file ${fileId} in project ${projectId}`);
    
    // Get 3-legged OAuth token for ACC files
    const token = await getACCToken();
    
    // Step 1: Use ACCDerivativeFinder to find derivatives using the correct workflow
    console.log(`🔍 APS Viewer: Using ACCDerivativeFinder to find derivatives...`);
    const derivativeFinder = new ACCDerivativeFinder(token);
    const manifestInfo = await derivativeFinder.findDerivatives(projectId, fileId);
    
    console.log(`🔍 APS Viewer: Manifest info:`, manifestInfo);
    
    if (manifestInfo.isTranslated && manifestInfo.bestViewingDerivative) {
      // File is already translated and ready
      console.log(`🔍 APS Viewer: File is translated and ready for viewing`);
      // The APS Viewer expects the URN in format "urn:base64Urn"
      const viewerUrn = `urn:${manifestInfo.bestViewingDerivative.urn}`;
      
      return NextResponse.json({
        access_token: token,
        urn: viewerUrn,
        manifest_exists: true,
        manifest_status: 'success',
        derivative_urn: manifestInfo.bestViewingDerivative.urn,
        original_urn: manifestInfo.originalUrn,
        derivative_type: manifestInfo.bestViewingDerivative.type,
        acc_derivative_finder_used: true,
        message: `File is ready for viewing. Type: ${manifestInfo.bestViewingDerivative.type}`
      });
    }
    
    if (manifestInfo.status === 'pending') {
      // File is being translated
      console.log(`🔍 APS Viewer: File is being translated`);
      return NextResponse.json({
        access_token: token,
        urn: manifestInfo.originalUrn,
        manifest_exists: true,
        manifest_status: 'pending',
        derivative_urn: null,
        original_urn: manifestInfo.originalUrn,
        acc_derivative_finder_used: true,
        message: `File is being processed. Status: ${manifestInfo.status}`
      });
    }
    
    // Step 2: No translation found, start translation job
    console.log(`🔍 APS Viewer: No translation found, starting translation job...`);
    
    // Use the version URN for translation job (not the Base64-encoded one)
    // The manifestInfo.originalUrn is already Base64-encoded, so we need to decode it first
    const versionUrn = Buffer.from(manifestInfo.originalUrn, 'base64').toString('utf-8');
    console.log(`🔍 APS Viewer: Using version URN for translation: ${versionUrn}`);
    
    // Convert to Base64 for translation job
    const base64Urn = Buffer.from(versionUrn).toString('base64');
    const translationJob = await TranslationChecker.startTranslationJob(base64Urn, token);
    
    if (translationJob.success) {
      console.log(`🔍 APS Viewer: Translation job started successfully:`, translationJob);
      return NextResponse.json({
        access_token: token,
        urn: base64Urn,
        manifest_exists: false,
        translation_job: { urn: translationJob.jobUrn },
        derivative_urn: null,
        original_urn: base64Urn,
        message: 'Translation job started. Please wait and try again in a few minutes.',
        translation_checker_used: true
      });
    } else {
      // Check if it's a specific error we can handle
      if (translationJob.error?.includes('The input urn is not supported')) {
        return NextResponse.json({
          error: 'File format not supported for translation',
          details: 'This file type cannot be translated for the APS Viewer',
          derivative_urn: null,
          base64_urn: base64Urn,
          original_urn: base64Urn,
          translation_checker_used: true
        }, { status: 400 });
      }
      
      throw new Error(`APS Viewer translation job failed: ${translationJob.error}`);
    }
    
  } catch (error) {
    console.error('🔍 APS Viewer: Error generating viewer token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get 3-legged OAuth token for ACC files
async function getACCToken(): Promise<string> {
  try {
    console.log('🔍 APS Viewer: Getting 3-legged OAuth token for ACC files...');
    const token = await ACCOAuthService.getAccessToken();
    console.log('🔍 APS Viewer: 3-legged token received successfully');
    return token;
  } catch (error) {
    console.log('🔍 APS Viewer: 3-legged OAuth failed, falling back to 2-legged:', error);
    
    // Fallback to 2-legged OAuth
    const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.APS_WEB_APP_CLIENT_ID!,
        client_secret: process.env.APS_WEB_APP_CLIENT_SECRET!,
        grant_type: 'client_credentials',
        scope: 'viewables:read data:read data:write data:create bucket:create bucket:read bucket:delete'
      })
    });

    if (!response.ok) {
      throw new Error(`2-legged OAuth failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 APS Viewer: 2-legged token received successfully (fallback)');
    return data.access_token;
  }
}
