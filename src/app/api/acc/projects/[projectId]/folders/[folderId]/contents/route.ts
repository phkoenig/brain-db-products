import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; folderId: string }> }
) {
  try {
    const { projectId, folderId } = await params;
    console.log(`🔍 ACC API: Getting contents for folder ${folderId} in project ${projectId}`);
    
    const folderContents = await ACCService.getFolderContents(projectId, folderId);
    
    console.log(`🔍 ACC API: Found ${folderContents.length} items in folder`);
    
    return NextResponse.json({ data: folderContents });
  } catch (error) {
    console.error('🔍 ACC API: Error getting folder contents:', error);
    return NextResponse.json(
      { error: 'Failed to get folder contents' },
      { status: 500 }
    );
  }
}
