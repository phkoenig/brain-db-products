import { NextRequest, NextResponse } from 'next/server';
import { NextcloudService } from '@/lib/nextcloud';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    console.log(`🔍 API: Nextcloud folders request for path: ${path}`);
    
    // Initialize Nextcloud service
    const nextcloudService = new NextcloudService();
    
    // Get folder structure
    const folders = await nextcloudService.getFolderStructure(path);
    
    console.log(`✅ API: Successfully fetched ${folders.length} folders from Nextcloud`);
    
    return NextResponse.json({
      success: true,
      data: folders,
      count: folders.length,
      path: path,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Nextcloud folders error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Nextcloud folders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 