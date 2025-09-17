import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 F16 BIM Model API: Starting...');
    
    const bimModel = await ACCService.getF16BIMModel();
    
    if (!bimModel) {
      return NextResponse.json({ 
        error: 'F16 BIM model not found',
        message: 'Could not locate the BIM model in the specified path'
      }, { status: 404 });
    }
    
    console.log('🔍 F16 BIM Model API: Successfully retrieved BIM model');
    
    return NextResponse.json({
      success: true,
      file: {
        id: bimModel.file.id,
        name: bimModel.file.attributes.name,
        displayName: bimModel.file.attributes.displayName,
        lastModifiedTime: bimModel.file.attributes.lastModifiedTime,
        size: bimModel.file.attributes.size,
        extension: bimModel.file.attributes.extension
      },
      urn: bimModel.urn,
      token: bimModel.token
    });
    
  } catch (error) {
    console.error('🔍 F16 BIM Model API: Error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve F16 BIM model',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
