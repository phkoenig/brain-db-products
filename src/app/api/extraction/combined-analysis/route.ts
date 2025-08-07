import { NextRequest, NextResponse } from 'next/server';
import { AIAnalyzer } from '@/lib/extraction/aiAnalyzer';
import { PerplexityAnalyzer } from '@/lib/extraction/perplexityAnalyzer';
import { fuseAIData } from '@/lib/extraction/dataFusion';

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

    // Get API keys from environment (moved inside function to avoid build-time errors)
    const openaiApiKey = process.env.OPENAI_KEY;
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_KEY in environment variables.' },
        { status: 500 }
      );
    }

    if (!perplexityApiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured. Please set PERPLEXITY_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Initialize analyzers
    const openaiAnalyzer = new AIAnalyzer(openaiApiKey);
    const perplexityAnalyzer = new PerplexityAnalyzer(perplexityApiKey);
    
    // Build context-aware prompts based on source type
    let openaiPrompt: string | undefined;
    let perplexityPrompt: string | undefined;
    
    if (sourceType === 'manufacturer') {
      openaiPrompt = `
Analysiere das Screenshot der folgenden Hersteller-Website: ${url}

Dies ist eine offizielle Hersteller-Website. Fokussiere dich auf:
- Produktdetails und technische Spezifikationen
- Produktbeschreibungen und Features
- Herstellerinformationen
- Preise sind möglicherweise nicht verfügbar oder nur als Richtwerte

Extrahiere alle verfügbaren Produktinformationen basierend auf den definierten Feldern.
      `;
      
      perplexityPrompt = `
Analysiere die folgende Hersteller-Website: ${url}

Dies ist eine offizielle Hersteller-Website. Fokussiere dich auf:
- Produktdetails und technische Spezifikationen
- Produktbeschreibungen und Features
- Herstellerinformationen
- Preise sind möglicherweise nicht verfügbar oder nur als Richtwerte

Extrahiere alle verfügbaren Produktinformationen basierend auf den definierten Feldern.
      `;
    } else if (sourceType === 'reseller') {
      openaiPrompt = `
Analysiere das Screenshot der folgenden Händler-Website: ${url}

Dies ist eine Händler-Website. Fokussiere dich auf:
- Preise und Verfügbarkeit
- Händlerinformationen
- Produktdetails
- Lieferbedingungen

Extrahiere alle verfügbaren Produktinformationen basierend auf den definierten Feldern.
      `;
      
      perplexityPrompt = `
Analysiere die folgende Händler-Website: ${url}

Dies ist eine Händler-Website. Fokussiere dich auf:
- Preise und Verfügbarkeit
- Händlerinformationen
- Produktdetails
- Lieferbedingungen

Extrahiere alle verfügbaren Produktinformationen basierend auf den definierten Feldern.
      `;
    }
    
    // Run both analyses in parallel
    console.log('Starting parallel AI analysis...');
    const [openaiResult, perplexityResult] = await Promise.allSettled([
      openaiAnalyzer.analyzeScreenshot(screenshotBase64, url, openaiPrompt),
      perplexityAnalyzer.analyzeUrl(url, perplexityPrompt)
    ]);

    // Handle results
    const openaiData = openaiResult.status === 'fulfilled' ? openaiResult.value : {};
    const perplexityData = perplexityResult.status === 'fulfilled' ? perplexityResult.value : {};

    // Log detailed results
    console.log('=== AI ANALYSIS RESULTS ===');
    console.log('OpenAI Status:', openaiResult.status);
    if (openaiResult.status === 'fulfilled') {
      console.log('OpenAI Data Keys:', Object.keys(openaiData));
      console.log('OpenAI Sample Data:', Object.entries(openaiData).slice(0, 3));
    } else {
      console.error('OpenAI analysis failed:', openaiResult.reason);
    }
    
    console.log('Perplexity Status:', perplexityResult.status);
    if (perplexityResult.status === 'fulfilled') {
      console.log('Perplexity Data Keys:', Object.keys(perplexityData));
      console.log('Perplexity Sample Data:', Object.entries(perplexityData).slice(0, 3));
    } else {
      console.error('Perplexity analysis failed:', perplexityResult.reason);
    }

    // Fuse the results
    const fusedData = fuseAIData(openaiData, perplexityData);
    console.log('Fused Data Keys:', Object.keys(fusedData));
    console.log('Fused Sample Data:', Object.entries(fusedData).slice(0, 3));
    console.log('=== END AI ANALYSIS RESULTS ===');

    return NextResponse.json({
      success: true,
      data: {
        openai: openaiData,
        perplexity: perplexityData,
        fused: fusedData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Combined analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Combined analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 