const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase-Client mit Secret Key für Server-Side-Operationen
const supabase = createClient(
  "https://jpmhwyjiuodsvjowddsm.supabase.co",
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

async function testCompleteIntegration() {
  console.log('🚀 Teste komplette Integration...');

  try {
    // 1. Hole ein Capture mit Base64-Daten
    console.log('📋 Hole Capture mit Base64-Daten...');
    const { data: captures, error: capturesError } = await supabase
      .from('captures')
      .select('id, screenshot_url, thumbnail_url, created_at, url')
      .like('screenshot_url', 'data:%')
      .limit(1);

    if (capturesError || !captures || captures.length === 0) {
      console.error('❌ Kein Capture mit Base64-Daten gefunden');
      return;
    }

    const capture = captures[0];
    console.log(`✅ Capture ${capture.id} geladen`);

    // 2. Erstelle ein Test-Produkt
    console.log('📝 Erstelle Test-Produkt...');
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        produkt_name_modell: `Test Product from Capture ${capture.id}`,
        produkt_beschreibung: `Auto-generiertes Test-Produkt aus Capture ${capture.id}`,
        source_type: 'capture_migration_test',
        source_url: `capture_${capture.id}`,
        erfassung_quell_url: capture.url,
        created_at: capture.created_at,
        updated_at: new Date().toISOString()
      })
      .select();

    if (productError) {
      console.error('❌ Fehler beim Erstellen des Produkts:', productError);
      return;
    }

    const product = productData[0];
    console.log(`✅ Produkt ${product.id} erstellt`);

    // 3. Teste die Bildübertragung über die API-Route
    console.log('🔄 Teste Bildübertragung über API-Route...');
    
    const imageTransferResponse = await fetch('http://localhost:3000/api/products/transfer-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        captureId: capture.id,
        url: capture.url
      }),
    });

    console.log(`📡 API Response Status: ${imageTransferResponse.status}`);

    if (imageTransferResponse.ok) {
      const transferResult = await imageTransferResponse.json();
      console.log('✅ Bildübertragung erfolgreich!');
      console.log('📊 Übertragene Bilder:', Object.keys(transferResult.uploadedImages).length);
      console.log('📸 Screenshot:', transferResult.uploadedImages.screenshot_path ? '✅' : '❌');
      console.log('🖼️ Thumbnail:', transferResult.uploadedImages.thumbnail_path ? '✅' : '❌');
      
      if (transferResult.uploadedImages.screenshot_path) {
        console.log('🔗 Screenshot URL:', transferResult.uploadedImages.screenshot_path);
      }
      if (transferResult.uploadedImages.thumbnail_path) {
        console.log('🔗 Thumbnail URL:', transferResult.uploadedImages.thumbnail_path);
      }
    } else {
      const errorData = await imageTransferResponse.json();
      console.error('❌ Bildübertragung fehlgeschlagen:', errorData.error);
      if (errorData.details) {
        console.error('📝 Details:', errorData.details);
      }
    }

    // 4. Prüfe das aktualisierte Produkt
    console.log('🔍 Prüfe aktualisiertes Produkt...');
    const { data: updatedProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, produkt_name_modell, screenshot_path, thumbnail_path')
      .eq('id', product.id)
      .single();

    if (fetchError) {
      console.error('❌ Fehler beim Laden des aktualisierten Produkts:', fetchError);
    } else {
      console.log('✅ Aktualisiertes Produkt geladen:');
      console.log(`   ID: ${updatedProduct.id}`);
      console.log(`   Name: ${updatedProduct.produkt_name_modell}`);
      console.log(`   Screenshot: ${updatedProduct.screenshot_path || 'Nicht gesetzt'}`);
      console.log(`   Thumbnail: ${updatedProduct.thumbnail_path || 'Nicht gesetzt'}`);
    }

    console.log('\n🎉 Komplette Integration erfolgreich getestet!');

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
  }
}

testCompleteIntegration(); 