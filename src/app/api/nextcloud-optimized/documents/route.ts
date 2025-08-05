import { NextRequest, NextResponse } from 'next/server';
import { NextcloudOptimizedService } from '@/lib/nextcloud-optimized';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    console.log(`🔍 API Documents: Nextcloud documents request for path: ${path}`);
    
    // Initialize Nextcloud optimized service
    const nextcloudService = new NextcloudOptimizedService();
    
    // Get documents (files and folders) for the specified path
    const documents = await nextcloudService.getFolderStructure(path);
    
    console.log(`✅ API Documents: Successfully fetched ${documents.length} documents from Nextcloud`);
    
    return NextResponse.json({
      success: true,
      data: documents,
      count: documents.length,
      path: path,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API Documents: Nextcloud documents error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Nextcloud documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 