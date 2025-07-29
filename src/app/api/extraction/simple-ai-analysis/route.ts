import { NextRequest, NextResponse } from 'next/server';
import { AIAnalyzer } from '@/lib/extraction/aiAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, screenshotBase64, sourceType } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!screenshotBase64) {
      return NextResponse.json(
        { error: 'Screenshot base64 data is required' },
        { status: 400 }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Initialize AI analyzer
    const analyzer = new AIAnalyzer(openaiApiKey);
    
    console.log('Starting simple OpenAI analysis...');
    
    // Analyze screenshot
    const result = await analyzer.analyzeScreenshot(screenshotBase64, url);

    console.log('=== SIMPLE AI ANALYSIS RESULTS ===');
    console.log('Result Keys:', Object.keys(result));
    console.log('Sample Data:', Object.entries(result).slice(0, 3));
    console.log('=== END SIMPLE AI ANALYSIS RESULTS ===');

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Simple AI analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Simple AI analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 