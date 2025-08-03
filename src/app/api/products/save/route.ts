import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase-Konfiguration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      data, 
      updateType, 
      column = null,
      sourceType = null,
      sourceUrl = null 
    } = body;

    console.log('📝 Products Save API called:', {
      productId: productId ? 'exists' : 'new',
      updateType,
      column,
      dataKeys: Object.keys(data || {}),
      sourceType,
      sourceUrl
    });

    // Validierung der Eingabedaten
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      );
    }

    // Automatische Felder hinzufügen
    const enrichedData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    // Wenn es ein neues Produkt ist, füge Erfassungs-Metadaten hinzu
    if (!productId) {
      enrichedData.created_at = new Date().toISOString();
      enrichedData.erfassung_erfassungsdatum = new Date().toISOString();
      enrichedData.erfassung_erfassung_fuer = 'Deutschland';
      
      if (sourceType) {
        enrichedData.source_type = sourceType;
      }
      if (sourceUrl) {
        enrichedData.source_url = sourceUrl;
        enrichedData.erfassung_quell_url = sourceUrl;
      }
    }

    let result;
    let operation;

    if (productId) {
      // Prüfe zuerst, ob das Produkt existiert
      const existingProduct = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single();
      
      if (existingProduct.error || !existingProduct.data) {
        // Produkt existiert nicht - erstelle neues
        console.log('🆕 Product does not exist, creating new one');
        operation = 'create';
        
        result = await supabase
          .from('products')
          .insert([enrichedData])
          .select();
      } else {
        // Produkt existiert - Update
        operation = 'update';
        
        // Spaltenweise Update - nur spezifische Felder aktualisieren
        if (column && updateType === 'column_analysis') {
          console.log(`🔄 Updating column: ${column}`);
          
          // Filtere nur die Felder der entsprechenden Spalte
          const columnFields = Object.keys(data).filter(key => key.startsWith(column.toLowerCase() + '_'));
          const columnData = Object.fromEntries(
            columnFields.map(key => [key, data[key]])
          );
          
          console.log(`📊 Column fields to update:`, columnFields);
          
          result = await supabase
            .from('products')
            .update({
              ...columnData,
              updated_at: new Date().toISOString(),
              erfassung_extraktions_log: `KI-Analyse Spalte ${column} abgeschlossen - ${new Date().toISOString()}`
            })
            .eq('id', productId)
            .select();
        } else {
          // Vollständiges Update (für On-Blur Updates)
          console.log('✏️ Full product update');
          
          result = await supabase
            .from('products')
            .update(enrichedData)
            .eq('id', productId)
            .select();
        }
      }
    } else {
      // Neues Produkt erstellen
      operation = 'create';
      console.log('🆕 Creating new product');
      
      result = await supabase
        .from('products')
        .insert([enrichedData])
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
      column: column || 'full'
    });

    return NextResponse.json({
      success: true,
      operation,
      productId: savedProduct.id,
      data: savedProduct,
      message: `Product ${operation === 'create' ? 'created' : 'updated'} successfully`
    });

  } catch (error) {
    console.error('❌ Products Save API error:', error);
    
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
    console.error('❌ Products Get API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 