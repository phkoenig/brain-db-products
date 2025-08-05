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
Analysiere die folgende Website nach Dokumenten: ${url}

Suche nach:
- Technische Datenblätter
- Produktdokumentation
- Installationsanleitungen
- Sicherheitsdatenblätter
- Zertifikate und Prüfberichte
- Kataloge und Broschüren

Zusätzliche Suchbegriffe: ${searchQueries.join(', ')}

Extrahiere alle verfügbaren Dokumenten-Informationen.
    `;

    // Run enhanced search analysis
    const result = await analyzer.analyzeWithEnhancedSearch({
      url,
      prompt,
      searchQueries
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Enhanced Documents Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search for documents', details: error.message },
      { status: 500 }
    );
  }
} 