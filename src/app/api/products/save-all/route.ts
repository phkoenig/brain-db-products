import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase-Konfiguration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hilfsfunktion zum Konvertieren von Preis-Strings zu Zahlen
const convertPriceFields = (data: any) => {
  const priceFields = [
    'haendler_preis',
    'haendler_preis_pro_einheit',
    'alternative_retailer_price',
    'alternative_retailer_price_per_unit'
  ];

  const convertedData = { ...data };

  priceFields.forEach(field => {
    if (convertedData[field] !== undefined && convertedData[field] !== null && convertedData[field] !== '') {
      // Entferne Euro-Symbol und Leerzeichen
      let priceValue = String(convertedData[field]).replace(/[€\s]/g, '');
      
      // Konvertiere deutsche Formatierung (1.234,56) zu Standard (1234.56)
      if (priceValue.includes(',')) {
        const parts = priceValue.split(',');
        const wholePart = parts[0].replace(/\./g, '');
        const decimalPart = parts[1] || '00';
        priceValue = `${wholePart}.${decimalPart}`;
      }
      
      // Konvertiere zu Zahl
      const numericPrice = parseFloat(priceValue);
      if (!isNaN(numericPrice)) {
        convertedData[field] = numericPrice;
        console.log(`💰 Converted ${field}: "${data[field]}" → ${numericPrice}`);
      } else {
        console.log(`⚠️ Could not convert ${field}: "${data[field]}" → setting to null`);
        convertedData[field] = null;
      }
    } else {
      // Leere Werte auf null setzen
      convertedData[field] = null;
    }
  });

  return convertedData;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId,
      produktData = {},
      parameterData = {},
      dokumenteData = {},
      haendlerData = {},
      sourceType = 'manufacturer',
      sourceUrl = null
    } = body;

    console.log('📝 Save All API called:', {
      productId: productId || 'new',
      produktFields: Object.keys(produktData).length,
      parameterFields: Object.keys(parameterData).length,
      dokumenteFields: Object.keys(dokumenteData).length,
      haendlerFields: Object.keys(haendlerData).length,
      sourceType,
      sourceUrl
    });

    // Generiere productId falls nicht vorhanden
    const finalProductId = productId || crypto.randomUUID();

    // Kombiniere alle Daten
    const completeData = {
      id: finalProductId,
      ...produktData,
      ...parameterData,
      ...dokumenteData,
      ...haendlerData,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      erfassung_erfassungsdatum: new Date().toISOString(),
      erfassung_erfassung_fuer: 'Deutschland',
      source_type: sourceType,
      erfassung_quell_url: sourceUrl,
      erfassung_extraktions_log: `Vollständige KI-Analyse abgeschlossen - ${new Date().toISOString()}`
    };

    // Konvertiere Preis-Felder zu Zahlen
    const processedData = convertPriceFields(completeData);

    console.log('🔍 Complete data to save:', {
      id: processedData.id,
      totalFields: Object.keys(processedData).length,
      produktName: processedData.produkt_name_modell || 'Unnamed',
      haendlerName: processedData.haendler_haendlername || 'Unknown',
      haendlerPreis: processedData.haendler_preis,
      haendlerPreisProEinheit: processedData.haendler_preis_pro_einheit
    });

    // Prüfe ob Produkt bereits existiert
    const existingProduct = await supabase
      .from('products')
      .select('id')
      .eq('id', finalProductId)
      .single();

    let result;
    let operation;

    if (existingProduct.error || !existingProduct.data) {
      // Neues Produkt erstellen
      operation = 'create';
      console.log('🆕 Creating new product with complete data');
      
      result = await supabase
        .from('products')
        .insert([processedData])
        .select();
    } else {
      // Existierendes Produkt aktualisieren
      operation = 'update';
      console.log('🔄 Updating existing product with complete data');
      
      result = await supabase
        .from('products')
        .update(processedData)
        .eq('id', finalProductId)
        .select();
    }

    if (result.error) {
      console.error('❌ Database operation failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Database operation failed',
          details: result.error.message 
        },
        { status: 500 }
      );
    }

    if (!result.data || result.data.length === 0) {
      console.error('❌ No data returned from database operation');
      return NextResponse.json(
        { error: 'No data returned from database operation' },
        { status: 500 }
      );
    }

    const savedProduct = result.data[0];
    
    console.log(`✅ Product ${operation} successful:`, {
      id: savedProduct.id,
      name: savedProduct.produkt_name_modell || 'Unnamed',
      operation,
      totalFields: Object.keys(savedProduct).filter(key => savedProduct[key] !== null).length
    });

    return NextResponse.json({
      success: true,
      operation,
      productId: savedProduct.id,
      data: savedProduct,
      message: `Product ${operation === 'create' ? 'created' : 'updated'} successfully with complete data`
    });

  } catch (error) {
    console.error('❌ Save All API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint für Debugging
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Get Product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}