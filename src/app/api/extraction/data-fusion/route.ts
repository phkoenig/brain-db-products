import { NextRequest, NextResponse } from 'next/server';
import { DataFusionEngine } from '@/lib/extraction/dataFusion';
import { WebScrapingResult, AIAnalysisResult } from '@/lib/types/extraction';

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

    // Initialize data fusion engine
    const fusionEngine = new DataFusionEngine();
    
    // Fuse the data
    const fusedResult = fusionEngine.fuseData(webData, aiData);
    
    // Get additional metadata
    const fieldsNeedingReview = fusionEngine.getFieldsNeedingReview(fusedResult);
    const overallConfidence = fusionEngine.getOverallConfidence(fusedResult);

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