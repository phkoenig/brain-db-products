import { NextRequest, NextResponse } from 'next/server';
import { NextcloudOptimizedService } from '@/lib/nextcloud-optimized';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    console.log(`🔍 API Optimized: Nextcloud folders request for path: ${path}`);
    
    // Initialize Nextcloud optimized service
    const nextcloudService = new NextcloudOptimizedService();
    
    // Get folder structure using optimized service
    const folders = await nextcloudService.getFolderStructure(path);
    
    console.log(`✅ API Optimized: Successfully fetched ${folders.length} folders from Nextcloud`);
    
    return NextResponse.json({
      success: true,
      data: folders,
      count: folders.length,
      path: path,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API Optimized: Nextcloud folders error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Nextcloud folders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 