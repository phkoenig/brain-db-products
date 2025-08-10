import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    console.log(`🔍 ACC API: Getting contents for project ${projectId}`);
    
    const topFolders = await ACCService.getProjectTopFolders(projectId);
    
    console.log(`🔍 ACC API: Found ${topFolders.length} top-level folders`);
    
    return NextResponse.json({ data: topFolders });
  } catch (error) {
    console.error('🔍 ACC API: Error getting project contents:', error);
    return NextResponse.json(
      { error: 'Failed to get project contents' },
      { status: 500 }
    );
  }
}
