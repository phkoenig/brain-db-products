import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicPrompt } from '@/lib/extraction/dynamicPrompts';
import { perplexityAnalyzer } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, manufacturer, productName, productCode, buttonType, productId } = await request.json();
    
    // 🆕 Automatische productId-Generierung falls nicht vorhanden
    const finalProductId = productId || crypto.randomUUID();
    
    console.log('Enhanced Retailers Search Request:', { url, manufacturer, productName, productCode, buttonType, productId: finalProductId });
    
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
    
    console.log('🔍 DEBUG: result.data type =', typeof (result as any).data);
    console.log('🔍 DEBUG: result.data =', JSON.stringify((result as any).data, null, 2));
    
    if ((result as any).data) {
      // Prüfe ob result.data ein Array ist (neues vereinfachtes Format)
      if (Array.isArray((result as any).data)) {
        console.log('Converting simplified array format to field format');
        console.log('🔍 DEBUG: Array length =', (result as any).data.length);
        
        // WICHTIG: Im HÄNDLER-Modus ist die ursprüngliche URL der Primärhändler!
        let mainRetailer;
        
        if (buttonType === 'haendler') {
          // Händler-Modus: Der erste KI-Eintrag sollte die ursprüngliche URL + Preis sein
          // Falls nicht gefunden, fallback zur URL-basierten Logik
          const urlHostname = new URL(url).hostname;
          const originalRetailerName = urlHostname.replace('www.', '').split('.')[0];
          
          // Suche nach KI-Eintrag mit der ursprünglichen URL
          const originalUrlEntry = (result as any).data.find((r: any) => 
            r.url && (r.url === url || r.url.includes(urlHostname))
          );
          
          if (originalUrlEntry) {
            // Verwende KI-Eintrag mit Preis von der ursprünglichen URL
            mainRetailer = {
              name: originalUrlEntry.name || originalRetailerName,
              url: url,
              price: originalUrlEntry.price || ''
            };
            console.log('🎯 PRIMÄRHÄNDLER mit KI-Preis gefunden:', mainRetailer);
          } else {
            // Fallback: URL-basierte Logik ohne Preis
            mainRetailer = {
              name: originalRetailerName,
              url: url,
              price: ''
            };
            console.log('⚠️ PRIMÄRHÄNDLER ohne KI-Preis (Fallback):', mainRetailer);
          }
        } else {
          // Hersteller-Modus: Nehme besten gefundenen Händler als Primärhändler
          const retailerWithPrice = (result as any).data.find((r: any) => r.price && r.price !== null && r.price !== 'null');
          const firstRetailer = (result as any).data[0];
          mainRetailer = retailerWithPrice || firstRetailer;
        }
        
        console.log('🔍 DEBUG: mainRetailer =', mainRetailer);
        console.log('🔍 DEBUG: buttonType =', buttonType);
        
        // Hilfsfunktion für bessere Preis-Extraktion
        const extractPrice = (priceStr: any) => {
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
              haendler_haendlername: mainRetailer.name || '',
              haendler_haendler_webseite: mainRetailer.url ? new URL(mainRetailer.url).hostname : '',
              haendler_haendler_produkt_url: mainRetailer.url || '',
              haendler_preis: price || '',
              haendler_einheit: 'Stück',
              haendler_preis_pro_einheit: price || ''
            };
            
            // Sammle alle anderen Händler als "weitere Händler"
            const additionalRetailers = (result as any).data
              .filter((r: any) => r.name !== mainRetailer.name)
              .map((r: any) => ({
                name: r.name,
                website: r.url ? new URL(r.url).hostname : '',
                productUrl: r.url,
                price: extractPrice(r.price),
                unit: 'Stück'
              }));
              
            if (additionalRetailers.length > 0) {
              (convertedData as any).haendler_weitere_haendler_und_preise = additionalRetailers;
              console.log('🔍 DEBUG: Set haendler_weitere_haendler_und_preise (HERSTELLER-Modus) =', additionalRetailers.length, 'Händler');
            }
            
          } else {
            // HÄNDLER-Modus: Setze den ERSTEN Händler als Primärhändler, REST als weitere Händler
            convertedData = {
              haendler_haendlername: mainRetailer.name || '',
              haendler_haendler_webseite: mainRetailer.url ? new URL(mainRetailer.url).hostname : '',
              haendler_haendler_produkt_url: mainRetailer.url || '',
              haendler_preis: price || '',
              haendler_einheit: 'Stück',
              haendler_preis_pro_einheit: price || ''
            };
            
            // Alle KI-gefundenen Händler sind alternative Händler (da mainRetailer = ursprüngliche URL)
            const additionalRetailers = (result as any).data
              .filter((r: any) => r.name !== mainRetailer.name)  // Entferne Duplikate des Primärhändlers
              .map((r: any) => ({
                name: r.name,
                website: r.url ? new URL(r.url).hostname : '',
                productUrl: r.url,
                price: extractPrice(r.price),
                unit: 'Stück'
              }));
            
            console.log('🔍 DEBUG: additionalRetailers (HÄNDLER-Modus) =', additionalRetailers);
            
            if (additionalRetailers.length > 0) {
              (convertedData as any).haendler_weitere_haendler_und_preise = additionalRetailers;
              console.log('🔍 DEBUG: Set haendler_weitere_haendler_und_preise (HÄNDLER-Modus) =', additionalRetailers.length, 'Händler');
            }
          }
        }
      } else {
        // Fallback: Verwende result.data direkt (falls es bereits im richtigen Format ist)
        convertedData = (result as any).data;
        console.log('🔍 DEBUG: Using result.data directly');
      }
    }
    
    console.log('Converted data:', convertedData);
    console.log('🔍 DEBUG: Final convertedData =', JSON.stringify(convertedData, null, 2));
    
    // 🔄 DATEN WERDEN NICHT MEHR AUTOMATISCH GESPEICHERT
    // Speicherung erfolgt erst am Ende über /api/products/save-all
    console.log('📋 Händler-Daten extrahiert, warte auf Speicherung am Ende der Analyse');
    
    return NextResponse.json({ 
      success: true, 
      data: convertedData, 
      searchQueries: (result as any).searchQueries, 
      sources: (result as any).sources 
    });
    
  } catch (error) {
    console.error('Enhanced Retailers Search Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
} 