import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicPrompt } from '@/lib/extraction/dynamicPrompts';
import { perplexityAnalyzer } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, manufacturer, productName, productCode, buttonType } = await request.json();
    
    console.log('Enhanced Retailers Search Request:', { url, manufacturer, productName, productCode, buttonType });
    
    // Generiere erweiterten Prompt mit Produkt-Kontext und Button-Typ
    const enhancedPrompt = await generateDynamicPrompt({ spalte: 'haendler', url, buttonType });
    
    // Erstelle spezifische Suchbegriffe für Händler-Suche
    const searchQueries = [
      `${manufacturer} ${productName} online kaufen`,
      `${productName} ${manufacturer} Händler`,
      `${manufacturer} ${productCode} bestellen`,
      `${productName} Preisvergleich`,
      `${manufacturer} ${productName} Lieferanten`
    ].filter(query => query && !query.includes('Unbekannt'));
    
    console.log('Enhanced Retailers Search Queries:', searchQueries);
    
    // Führe erweiterte Händler-Analyse durch
    const result = await perplexityAnalyzer.analyzeWithEnhancedSearch({
      url,
      prompt: enhancedPrompt,
      searchQueries
    });
    
    console.log('Enhanced Retailers Search Result:', result);
    
    // Konvertiere Perplexity-Antwort in unser erwartetes Format
    let convertedData = {};
    
    if (result.data) {
      // Prüfe ob result.data ein Array ist (neues vereinfachtes Format)
      if (Array.isArray(result.data)) {
        console.log('Converting simplified array format to field format');
        
        // Nehme den ersten Händler mit Preis als Haupt-Händler
        const retailerWithPrice = result.data.find(r => r.price && r.price !== null && r.price !== 'null');
        const firstRetailer = result.data[0];
        const mainRetailer = retailerWithPrice || firstRetailer;
        
        if (mainRetailer) {
          // Extrahiere Preis (nur Zahlen)
          let price = mainRetailer.price;
          if (price && typeof price === 'string' && price !== 'null') {
            // Entferne Währungssymbole und Text, behalte nur Zahlen
            const priceMatch = price.match(/(\d+[.,]\d+|\d+)/);
            if (priceMatch) {
              price = priceMatch[1].replace(',', '.');
            }
          }
          
          convertedData = {
            haendler_haendlername: { value: mainRetailer.name || '' },
            haendler_haendler_webseite: { value: mainRetailer.url ? new URL(mainRetailer.url).hostname : '' },
            haendler_haendler_produkt_url: { value: mainRetailer.url || '' },
            haendler_preis: { value: price || '' },
            haendler_einheit: { value: 'm²' }, // Standard für Mosaik
            haendler_preis_pro_einheit: { value: price || '' }
          };
          
          // Sammle alle anderen Händler als "weitere Händler"
          const additionalRetailers = result.data
            .filter(r => r.name !== mainRetailer.name)
            .map(r => ({
              name: r.name,
              website: r.url ? new URL(r.url).hostname : '',
              productUrl: r.url,
              price: r.price && r.price !== 'null' ? r.price.replace(/[^\d,.]/g, '').replace(',', '.') : '',
              unit: 'm²'
            }));
          
          if (additionalRetailers.length > 0) {
            convertedData.haendler_weitere_haendler_und_preise = { value: additionalRetailers };
          }
        }
      } else {
        // Fallback: Verwende result.data direkt (falls es bereits im richtigen Format ist)
        convertedData = result.data;
      }
    }
    
    console.log('Converted data:', convertedData);
    
    return NextResponse.json({ 
      success: true, 
      data: convertedData, 
      searchQueries: result.searchQueries, 
      sources: result.sources 
    });
    
  } catch (error) {
    console.error('Enhanced Retailers Search Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 