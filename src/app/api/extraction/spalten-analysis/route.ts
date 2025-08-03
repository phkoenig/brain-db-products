import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithPerplexity } from '@/lib/extraction/perplexityAnalyzer';
import { generateDynamicPrompt } from '@/lib/extraction/dynamicPrompts';

export async function POST(request: NextRequest) {
  try {
    const { url, spalte, felder, productId } = await request.json();

    console.log(`Spalten-Analyse: Starte ${spalte}-Analyse für URL:`, url);
    console.log(`Spalten-Analyse: Felder:`, felder);

    // Generiere dynamischen Prompt basierend auf Datenbank-Felddefinitionen
    console.log(`Spalten-Analyse: Generiere dynamischen Prompt für Spalte: ${spalte}`);
    const prompt = await generateDynamicPrompt({ url, spalte });
    
    if (!prompt) {
      throw new Error(`Fehler beim Generieren des dynamischen Prompts für Spalte: ${spalte}`);
    }
    
    console.log(`Spalten-Analyse: Dynamischer Prompt generiert (${prompt.length} Zeichen)`);

    // Führe Perplexity-Analyse durch
    const result = await analyzeWithPerplexity(url, { fields: felder }, prompt);

    console.log(`Spalten-Analyse: ${spalte}-Analyse abgeschlossen`);

    // 🔄 DATEN WERDEN NICHT MEHR AUTOMATISCH GESPEICHERT
    // Speicherung erfolgt erst am Ende über /api/products/save-all
    console.log('📋 Spalten-Analyse-Daten extrahiert, warte auf Speicherung am Ende der Analyse');

    return NextResponse.json({
      success: true,
      data: result,
      spalte: spalte,
      generatedPrompt: prompt // Füge den generierten Prompt zur Antwort hinzu
    });

  } catch (error) {
    console.error('Spalten-Analyse: Fehler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}