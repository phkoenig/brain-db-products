import { NextRequest, NextResponse } from 'next/server';
import { NextcloudRestService } from '@/lib/nextcloud-rest';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    console.log(`🔍 API REST: Nextcloud folders request for path: ${path}`);
    
    // Initialize Nextcloud REST service
    const nextcloudService = new NextcloudRestService();
    
    // Get folder structure using REST API
    const folders = await nextcloudService.getFolderStructure(path);
    
    console.log(`✅ API REST: Successfully fetched ${folders.length} folders from Nextcloud`);
    
    return NextResponse.json({
      success: true,
      data: folders,
      count: folders.length,
      path: path,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API REST: Nextcloud folders error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Nextcloud folders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 