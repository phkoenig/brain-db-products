import { NextRequest, NextResponse } from 'next/server';
import { NextcloudRestService } from '@/lib/nextcloud-rest';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 API REST: Nextcloud subfolders request for path: ${path}`);
    
    // Initialize Nextcloud REST service
    const nextcloudService = new NextcloudRestService();
    
    // Get subfolders using REST API
    const subfolders = await nextcloudService.getSubfolders(path);
    
    console.log(`✅ API REST: Successfully fetched ${subfolders.length} subfolders from Nextcloud`);
    
    return NextResponse.json({
      success: true,
      data: subfolders,
      count: subfolders.length,
      path: path,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API REST: Nextcloud subfolders error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Nextcloud subfolders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 