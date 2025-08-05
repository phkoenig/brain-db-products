import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PerplexityService } from '@/lib/extraction/perplexityService';

// Supabase-Konfiguration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting price update for product: ${productId}`);

    // Perplexity Service - moved inside function to avoid build-time instantiation
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityApiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      );
    }
    const perplexityService = new PerplexityService(perplexityApiKey);

    // 1. Lade Produktdaten aus der Datenbank
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        produkt_name_modell,
        produkt_hersteller,
        haendler_haendler_produkt_url,
        haendler_haendler_webseite,
        erfassung_quell_url,
        alternative_retailer_url,
        produkt_hersteller_produkt_url,
        produkt_hersteller_webseite,
        haendler_preis,
        haendler_einheit,
        haendler_preis_pro_einheit
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('❌ Error loading product:', productError);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // 2. Prüfe ob Primär-URL vorhanden ist (Priorität: haendler_haendler_produkt_url > erfassung_quell_url)
    const primaryUrl = product.haendler_haendler_produkt_url || product.erfassung_quell_url;
    
    if (!primaryUrl) {
      console.log('⚠️ No primary URL found for product');
      return NextResponse.json(
        { error: 'No primary URL found for this product' },
        { status: 400 }
      );
    }

    // Log welche URL verwendet wird
    if (product.haendler_haendler_produkt_url) {
      console.log(`🔗 Using haendler_haendler_produkt_url: ${primaryUrl}`);
    } else if (product.erfassung_quell_url) {
      console.log(`🔗 Using erfassung_quell_url (fallback): ${primaryUrl}`);
    } else {
      console.log(`🔗 No URL available for price update`);
    }

    // 3. Erstelle spezialisierten Prompt für Preis-Extraktion
    const pricePrompt = generatePriceExtractionPrompt({
      url: primaryUrl,
      productName: product.produkt_name_modell,
      manufacturer: product.produkt_hersteller,
      currentPrice: product.haendler_preis,
      currentUnit: product.haendler_einheit
    });

    // 4. Führe Perplexity-Analyse durch
    console.log('🤖 Starting Perplexity price analysis...');
    console.log('📝 Prompt:', pricePrompt);
    console.log('🔗 URL:', primaryUrl);
    
    // Echte Perplexity API aufrufen
    const analysisResult = await perplexityService.analyzeWithPerplexity(pricePrompt, primaryUrl);

    if (!analysisResult.success) {
      console.error('❌ Perplexity analysis failed:', analysisResult.error);
      return NextResponse.json(
        { error: 'Price analysis failed', details: analysisResult.error },
        { status: 500 }
      );
    }

    // 5. Parse die Preis-Daten aus der Antwort
    const extractedPriceData = parsePriceFromResponse(analysisResult.data);

    if (!extractedPriceData) {
      console.log('⚠️ No valid price data extracted');
      return NextResponse.json(
        { error: 'No valid price data found' },
        { status: 400 }
      );
    }

    // 6. Konvertiere Preise zu Zahlen
    const processedPriceData = convertPriceFields(extractedPriceData);

    // 7. Update Produkt in der Datenbank
    const updateData = {
      haendler_preis: processedPriceData.haendler_preis,
      haendler_einheit: processedPriceData.haendler_einheit,
      haendler_preis_pro_einheit: processedPriceData.haendler_preis_pro_einheit,
      updated_at: new Date().toISOString(),
      erfassung_extraktions_log: `Preis-Update via Perplexity API - ${new Date().toISOString()} - ${analysisResult.data.substring(0, 200)}...`
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating product:', updateError);
      return NextResponse.json(
        { error: 'Failed to update product', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Price update completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Price updated successfully',
      data: {
        productId,
        oldPrice: product.haendler_preis,
        newPrice: processedPriceData.haendler_preis,
        oldUnit: product.haendler_einheit,
        newUnit: processedPriceData.haendler_einheit,
        analysisResult: analysisResult.data.substring(0, 500) + '...'
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in price update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Hilfsfunktion zum Generieren des Preis-Extraktions-Prompts
function generatePriceExtractionPrompt({
  url,
  productName,
  manufacturer,
  currentPrice,
  currentUnit
}: {
  url: string;
  productName?: string;
  manufacturer?: string;
  currentPrice?: number;
  currentUnit?: string;
}): string {
  return `
Du bist ein Experte für die Extraktion von Produktpreisen aus Webseiten.

AUFGABE:
Analysiere die folgende Webseite und extrahiere den aktuellen Preis für das Produkt.

PRODUKT-INFORMATIONEN:
- Produktname: ${productName || 'Unbekannt'}
- Hersteller: ${manufacturer || 'Unbekannt'}
- URL: ${url}
${currentPrice ? `- Aktueller Preis in DB: ${currentPrice} ${currentUnit || '€'}` : ''}

ANWEISUNGEN:
1. Besuche die angegebene URL
2. Suche nach dem aktuellen Preis für das spezifische Produkt
3. Identifiziere die Preiseinheit (€, Stück, m², etc.)
4. Berechne den Preis pro Einheit falls relevant
5. Prüfe ob es Rabatte oder Sonderangebote gibt
6. Stelle sicher, dass der Preis aktuell und verfügbar ist

AUSGABE-FORMAT:
Antworte NUR mit einem JSON-Objekt in folgendem Format:
{
  "haendler_preis": "1234.56",
  "haendler_einheit": "Stück",
  "haendler_preis_pro_einheit": "1234.56",
  "price_confidence": "high|medium|low",
  "price_notes": "Kurze Notizen zum Preis (optional)"
}

WICHTIG:
- Gib Preise als Zahlen ohne Währungssymbol an
- Verwende Punkt als Dezimaltrennzeichen (1234.56)
- Falls kein Preis gefunden wird, setze haendler_preis auf null
- Falls mehrere Preise vorhanden sind, wähle den relevantesten aus
- Prüfe die Verfügbarkeit des Produkts

URL ZUR ANALYSE: ${url}
`;
}

// Hilfsfunktion zum Parsen der Preis-Daten aus der Perplexity-Antwort
function parsePriceFromResponse(response: string): any {
  try {
    // Suche nach JSON in der Antwort
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('No JSON found in response');
      return null;
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validiere die erforderlichen Felder
    if (parsedData.haendler_preis === undefined) {
      console.log('No price found in parsed data');
      return null;
    }

    return {
      haendler_preis: parsedData.haendler_preis,
      haendler_einheit: parsedData.haendler_einheit || 'Stück',
      haendler_preis_pro_einheit: parsedData.haendler_preis_pro_einheit || parsedData.haendler_preis
    };

  } catch (error) {
    console.error('Error parsing price data:', error);
    return null;
  }
}

// Hilfsfunktion zum Konvertieren von Preis-Strings zu Zahlen
function convertPriceFields(data: any) {
  const convertedData = { ...data };

  if (convertedData.haendler_preis !== undefined && convertedData.haendler_preis !== null && convertedData.haendler_preis !== '') {
    // Entferne Euro-Symbol und Leerzeichen, konvertiere zu Zahl
    const priceString = String(convertedData.haendler_preis)
      .replace(/[€\s]/g, '')
      .replace(',', '.');
    
    const priceNumber = parseFloat(priceString);
    convertedData.haendler_preis = isNaN(priceNumber) ? null : priceNumber;
  } else {
    convertedData.haendler_preis = null;
  }

  if (convertedData.haendler_preis_pro_einheit !== undefined && convertedData.haendler_preis_pro_einheit !== null && convertedData.haendler_preis_pro_einheit !== '') {
    const pricePerUnitString = String(convertedData.haendler_preis_pro_einheit)
      .replace(/[€\s]/g, '')
      .replace(',', '.');
    
    const pricePerUnitNumber = parseFloat(pricePerUnitString);
    convertedData.haendler_preis_pro_einheit = isNaN(pricePerUnitNumber) ? null : pricePerUnitNumber;
  } else {
    convertedData.haendler_preis_pro_einheit = null;
  }

  return convertedData;
} 