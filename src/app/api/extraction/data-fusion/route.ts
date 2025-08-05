import { NextRequest, NextResponse } from 'next/server';
import { fuseAIData } from '@/lib/extraction/dataFusion';
import { AIAnalysisResult } from '@/lib/types/extraction';

export async function POST(request: NextRequest) {
  try {
    const { webData, aiData } = await request.json();

    if (!webData) {
      return NextResponse.json(
        { error: 'Web scraping data is required' },
        { status: 400 }
      );
    }

    if (!aiData) {
      return NextResponse.json(
        { error: 'AI analysis data is required' },
        { status: 400 }
      );
    }

    // Fuse the data using the available function
    const fusedResult = fuseAIData(aiData, webData);
    
    // Calculate overall confidence
    const overallConfidence = Object.values(fusedResult).reduce((acc: number, field: any) => {
      return acc + (field.confidence || 0);
    }, 0) / Object.keys(fusedResult).length;

    // Find fields needing review (low confidence)
    const fieldsNeedingReview = Object.entries(fusedResult)
      .filter(([_, field]: [string, any]) => (field.confidence || 0) < 0.5)
      .map(([fieldName, _]: [string, any]) => fieldName);

    return NextResponse.json({
      success: true,
      results: fusedResult,
      fieldsNeedingReview,
      overallConfidence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data fusion error:', error);
    
    return NextResponse.json(
      { 
        error: 'Data fusion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 