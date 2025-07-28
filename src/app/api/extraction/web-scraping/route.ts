import { NextRequest, NextResponse } from 'next/server';
import { WebScraper } from '@/lib/extraction/webScraper';

export async function POST(request: NextRequest) {
  try {
    const { url, sourceType } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Initialize web scraper
    const scraper = new WebScraper();
    
    // Extract data from URL with source type context
    const result = await scraper.extractFromUrl(url, sourceType);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Web scraping error:', error);
    
    return NextResponse.json(
      { 
        error: 'Web scraping failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 