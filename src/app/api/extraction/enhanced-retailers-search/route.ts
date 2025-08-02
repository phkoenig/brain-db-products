import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicPrompt } from '@/lib/extraction/dynamicPrompts';
import { perplexityAnalyzer } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, manufacturer, productName, productCode, buttonType } = await request.json();
    
    console.log('Enhanced Retailers Search Request:', { url, manufacturer, productName, productCode, buttonType });
    
    // Generiere erweiterten Prompt mit Produkt-Kontext und Button-Typ
    const enhancedPrompt = await generateDynamicPrompt({ 
      spalte: 'haendler', 
      url, 
      buttonType,
      manufacturer,
      productName,
      productCode
    });
    
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
    
    console.log('🔍 DEBUG: result.data type =', typeof result.data);
    console.log('🔍 DEBUG: result.data =', JSON.stringify(result.data, null, 2));
    
    if (result.data) {
      // Prüfe ob result.data ein Array ist (neues vereinfachtes Format)
      if (Array.isArray(result.data)) {
        console.log('Converting simplified array format to field format');
        console.log('🔍 DEBUG: Array length =', result.data.length);
        
        // Nehme den ersten Händler mit Preis als Haupt-Händler
        const retailerWithPrice = result.data.find(r => r.price && r.price !== null && r.price !== 'null');
        const firstRetailer = result.data[0];
        const mainRetailer = retailerWithPrice || firstRetailer;
        
        console.log('🔍 DEBUG: mainRetailer =', mainRetailer);
        console.log('🔍 DEBUG: buttonType =', buttonType);
        
        // Hilfsfunktion für bessere Preis-Extraktion
        const extractPrice = (priceStr) => {
          if (!priceStr || priceStr === 'null') return '';
          
          // Wenn "Preis auf Anfrage" oder ähnlich -> leer lassen
          if (priceStr.toLowerCase().includes('anfrage') || 
              priceStr.toLowerCase().includes('request') ||
              priceStr.toLowerCase().includes('kontakt')) {
            return '';
          }
          
          // Extrahiere erste Zahl mit Komma/Punkt
          const priceMatch = priceStr.match(/(\d+[.,]\d+|\d+)/);
          return priceMatch ? priceMatch[1].replace(',', '.') : '';
        };
        
        if (mainRetailer) {
          let price = extractPrice(mainRetailer.price);
          
          // UNTERSCHEIDE zwischen buttonType Modi:
          if (buttonType === 'hersteller') {
            // HERSTELLER-Modus: Setze Primärhändler-Felder
            convertedData = {
              haendler_haendlername: { value: mainRetailer.name || '' },
              haendler_haendler_webseite: { value: mainRetailer.url ? new URL(mainRetailer.url).hostname : '' },
              haendler_haendler_produkt_url: { value: mainRetailer.url || '' },
              haendler_preis: { value: price || '' },
              haendler_einheit: { value: 'm²' },
              haendler_preis_pro_einheit: { value: price || '' }
            };
            
            // Sammle alle anderen Händler als "weitere Händler"
            const additionalRetailers = result.data
              .filter(r => r.name !== mainRetailer.name)
              .map(r => ({
                name: r.name,
                website: r.url ? new URL(r.url).hostname : '',
                productUrl: r.url,
                price: extractPrice(r.price),
                unit: 'm²'
              }));
              
            if (additionalRetailers.length > 0) {
              convertedData.haendler_weitere_haendler_und_preise = { value: additionalRetailers };
            }
            
                    } else {
            // HÄNDLER-Modus: Setze den ERSTEN Händler als Primärhändler, REST als weitere Händler
            convertedData = {
              haendler_haendlername: { value: mainRetailer.name || '' },
              haendler_haendler_webseite: { value: mainRetailer.url ? new URL(mainRetailer.url).hostname : '' },
              haendler_haendler_produkt_url: { value: mainRetailer.url || '' },
              haendler_preis: { value: price || '' },
              haendler_einheit: { value: 'm²' },
              haendler_preis_pro_einheit: { value: price || '' }
            };
            
            // Alle ANDEREN Händler als "weitere Händler" hinzufügen
            const additionalRetailers = result.data
              .filter(r => r.name !== mainRetailer.name)
              .map(r => ({
                name: r.name,
                website: r.url ? new URL(r.url).hostname : '',
                productUrl: r.url,
                price: extractPrice(r.price),
                unit: 'm²'
              }));
            
            console.log('🔍 DEBUG: additionalRetailers (HÄNDLER-Modus) =', additionalRetailers);
            
            if (additionalRetailers.length > 0) {
              convertedData.haendler_weitere_haendler_und_preise = { value: additionalRetailers };
              console.log('🔍 DEBUG: Set haendler_weitere_haendler_und_preise (HÄNDLER-Modus) =', additionalRetailers);
            }
          }
        }
      } else {
        // Fallback: Verwende result.data direkt (falls es bereits im richtigen Format ist)
        convertedData = result.data;
        console.log('🔍 DEBUG: Using result.data directly');
      }
    }
    
    console.log('Converted data:', convertedData);
    console.log('🔍 DEBUG: Final convertedData =', JSON.stringify(convertedData, null, 2));
    
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