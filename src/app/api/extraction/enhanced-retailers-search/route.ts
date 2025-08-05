import { NextRequest, NextResponse } from 'next/server';
import { PerplexityAnalyzer } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, searchQueries = [] } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityApiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured. Please set PERPLEXITY_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Initialize analyzer
    const analyzer = new PerplexityAnalyzer(perplexityApiKey);
    
    // Build enhanced search prompt
    const prompt = `
Analysiere die folgende Händler-Website: ${url}

Dies ist eine Händler-Website. Fokussiere dich auf:
- Preise und Verfügbarkeit
- Händlerinformationen
- Produktdetails
- Lieferbedingungen

Zusätzliche Suchbegriffe: ${searchQueries.join(', ')}

Extrahiere alle verfügbaren Produktinformationen basierend auf den definierten Feldern.
    `;

    // Run enhanced search analysis
    const result = await analyzer.analyzeWithEnhancedSearch({
      url,
      prompt,
      searchQueries
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Enhanced Retailers Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze retailer website', details: error.message },
      { status: 500 }
    );
  }
} 