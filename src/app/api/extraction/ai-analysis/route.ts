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
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Initialize AI analyzer
    const analyzer = new AIAnalyzer(openaiApiKey);
    
    // Build context-aware prompt based on source type
    let customPrompt: string | undefined;
    if (sourceType === 'manufacturer') {
      customPrompt = `
Analysiere das Screenshot der folgenden Hersteller-Website: ${url}

Dies ist eine offizielle Hersteller-Website. Fokussiere dich auf:
- Produktdetails und technische Spezifikationen
- Produktbeschreibungen und Features
- Herstellerinformationen
- Preise sind möglicherweise nicht verfügbar oder nur als Richtwerte

Extrahiere die folgenden Produktinformationen und gib sie als JSON zurück:

{
  "product_name": {
    "value": "Produktname",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "manufacturer": {
    "value": "Hersteller",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "price": {
    "value": "Preis als Zahl (falls verfügbar)",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "description": {
    "value": "Produktbeschreibung",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "specifications": {
    "value": "Technische Spezifikationen",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  }
}
      `;
    } else if (sourceType === 'reseller') {
      customPrompt = `
Analysiere das Screenshot der folgenden Händler-Website: ${url}

Dies ist eine Händler-Website. Fokussiere dich auf:
- Preise und Verfügbarkeit
- Händlerinformationen
- Produktdetails
- Lieferbedingungen

Extrahiere die folgenden Produktinformationen und gib sie als JSON zurück:

{
  "product_name": {
    "value": "Produktname",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "manufacturer": {
    "value": "Hersteller",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "price": {
    "value": "Preis als Zahl",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "description": {
    "value": "Produktbeschreibung",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  },
  "specifications": {
    "value": "Technische Spezifikationen",
    "confidence": 0.0-1.0,
    "reasoning": "Begründung für die Extraktion"
  }
}
      `;
    }
    
    // Analyze screenshot
    const result = await analyzer.analyzeScreenshot(screenshotBase64, url, customPrompt);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'AI analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 