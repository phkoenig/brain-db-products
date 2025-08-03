import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicPrompt } from '@/lib/extraction/dynamicPrompts';
import { perplexityAnalyzer } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, manufacturer, productName, productCode, productId } = await request.json();
    
    console.log('Enhanced Documents Search:', { url, manufacturer, productName, productCode, productId });
    
    // Erstelle erweiterten Prompt mit Hersteller-Kontext
    const basePrompt = await generateDynamicPrompt({ url, spalte: 'dokumente' });
    
    const enhancedPrompt = `${basePrompt}

ERWEITERTE DOKUMENTE-SUCHE:
- Hersteller: ${manufacturer || 'Unbekannt'}
- Produktname: ${productName || 'Unbekannt'}
- Produktcode: ${productCode || 'Unbekannt'}

SUCHE-STRATEGIE:
1. Analysiere die aktuelle Webseite nach Dokumenten-Links
2. Suche auf der Hersteller-Website nach zusätzlichen Dokumenten
3. Suche nach PDFs, Datenblättern, technischen Merkblättern
4. Prüfe Download-Bereiche und Dokumentations-Sektionen
5. Verwende den Produktnamen für gezielte Suche

Zusätzliche Suchbegriffe: "${productName} Datenblatt", "${productCode} technisches Merkblatt", "${manufacturer} ${productName} PDF"
`;

    // Führe erweiterte Perplexity-Analyse durch
    const result = await perplexityAnalyzer.analyzeWithEnhancedSearch({
      url,
      prompt: enhancedPrompt,
      searchQueries: [
        `${manufacturer} ${productName} Datenblatt`,
        `${manufacturer} ${productCode} technisches Merkblatt`,
        `${productName} PDF Download`,
        `${manufacturer} Produktdokumentation ${productName}`
      ].filter(query => query && !query.includes('Unbekannt'))
    });

    // 🔄 DATEN WERDEN NICHT MEHR AUTOMATISCH GESPEICHERT
    // Speicherung erfolgt erst am Ende über /api/products/save-all
    console.log('📋 Dokumente-Daten extrahiert, warte auf Speicherung am Ende der Analyse');

    return NextResponse.json({
      success: true,
      data: result.data,
      searchQueries: result.searchQueries,
      sources: result.sources
    });

  } catch (error) {
    console.error('Enhanced Documents Search Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 