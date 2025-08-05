import { NextRequest, NextResponse } from 'next/server';
import { NextcloudOptimizedService } from '@/lib/nextcloud-optimized';

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
    
    console.log(`🔍 API Optimized: Nextcloud subfolders request for path: ${path}`);
    
    // Initialize Nextcloud optimized service
    const nextcloudService = new NextcloudOptimizedService();
    
    // Get subfolders using optimized service
    const subfolders = await nextcloudService.getSubfolders(path);
    
    console.log(`✅ API Optimized: Successfully fetched ${subfolders.length} subfolders from Nextcloud`);
    
    return NextResponse.json({
      success: true,
      data: subfolders,
      count: subfolders.length,
      path: path,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API Optimized: Nextcloud subfolders error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Nextcloud subfolders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 