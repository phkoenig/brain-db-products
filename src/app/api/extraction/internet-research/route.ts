import { NextRequest, NextResponse } from 'next/server';
import { AIAnalyzer } from '@/lib/extraction/aiAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, screenshotBase64, productName, resellerName } = await request.json();

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
    
    // Create a specialized prompt for manufacturer research
    const researchPrompt = `
      Du bist ein Experte für Produktrecherche. Analysiere das Screenshot und die URL einer Händler-Website.
      
      Ziel: Finde den Hersteller des Produkts und dessen offizielle Website.
      
      Kontext:
      - URL: ${url}
      - Produktname: ${productName || 'Nicht angegeben'}
      - Händler: ${resellerName || 'Nicht angegeben'}
      
      Aufgaben:
      1. Identifiziere den Hersteller/Brand des Produkts
      2. Finde die offizielle Website des Herstellers
      3. Sammle relevante Informationen über den Hersteller
      4. Bewerte die Zuverlässigkeit der gefundenen Informationen
      
      Antworte im folgenden JSON-Format:
      {
        "manufacturer": {
          "name": "Name des Herstellers",
          "website": "https://www.hersteller-website.com",
          "confidence": 0.85
        },
        "research_notes": "Zusätzliche Notizen zur Recherche",
        "recommended_next_steps": "Empfohlene nächste Schritte"
      }
    `;
    
    // Perform the research analysis
    const result = await analyzer.analyzeScreenshot(screenshotBase64, url, researchPrompt);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Internet research error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internet research failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 