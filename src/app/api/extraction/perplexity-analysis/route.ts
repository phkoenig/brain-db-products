import { NextRequest, NextResponse } from 'next/server';
import { PerplexityAnalyzer } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, sourceType } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Get Perplexity API key from environment
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityApiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured. Please set PERPLEXITY_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Initialize Perplexity analyzer
    const analyzer = new PerplexityAnalyzer(perplexityApiKey);
    
    // Build context-aware prompt based on source type
    let customPrompt: string | undefined;
    if (sourceType === 'manufacturer') {
      customPrompt = `
Analysiere die folgende Hersteller-Website: ${url}

Dies ist eine offizielle Hersteller-Website. Fokussiere dich auf:
- Produktdetails und technische Spezifikationen
- Produktbeschreibungen und Features
- Herstellerinformationen
- Preise sind möglicherweise nicht verfügbar oder nur als Richtwerte

Extrahiere alle verfügbaren Produktinformationen basierend auf den definierten Feldern.
      `;
    } else if (sourceType === 'reseller') {
      customPrompt = `
Analysiere die folgende Händler-Website: ${url}

Dies ist eine Händler-Website. Fokussiere dich auf:
- Preise und Verfügbarkeit
- Händlerinformationen
- Produktdetails
- Lieferbedingungen

Extrahiere alle verfügbaren Produktinformationen basierend auf den definierten Feldern.
      `;
    }
    
    // Analyze URL
    const result = await analyzer.analyzeUrl(url, customPrompt);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Perplexity analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Perplexity analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 