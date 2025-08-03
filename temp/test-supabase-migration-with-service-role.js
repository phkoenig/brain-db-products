const { createClient } = require('@supabase/supabase-js');

// Supabase-Client mit Service Role Key für Server-Side-Operationen
// WICHTIG: Service Role Key nur auf dem Server verwenden, nie im Browser!
const supabase = createClient(
  "https://jpmhwyjiuodsvjowddsm.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Service Role Key aus Umgebungsvariablen
  {
    auth: {
      persistSession: false,        // Keine Session-Persistierung auf Server
      autoRefreshToken: false,      // Kein automatisches Token-Refresh
      detectSessionInUrl: false,    // Keine Session-Erkennung aus URL
    },
  }
);

async function testMigrationWithServiceRole() {
  console.log('🚀 Teste Migration mit Service Role Key...');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY nicht gefunden!');
    console.log('💡 Füge den Service Role Key zu deiner .env.local hinzu:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY="dein_service_role_key"');
    return;
  }

  try {
    // 1. Teste Verbindung mit Service Role Key
    console.log('📡 Teste Datenbankverbindung mit Service Role...');
    const { data: captures, error } = await supabase
      .from('captures')
      .select('id, screenshot_url, created_at')
      .like('screenshot_url', 'data:%')
      .limit(1);

    if (error) {
      console.error('❌ Verbindungsfehler:', error);
      return;
    }

    if (!captures || captures.length === 0) {
      console.log('❌ Kein Capture mit Base64 gefunden');
      return;
    }

    const capture = captures[0];
    console.log('✅ Verbindung erfolgreich!');
    console.log(`📋 Gefundenes Capture: ID ${capture.id}`);

    // 2. Erstelle ProductFiles Bucket (Service Role Key erlaubt das)
    console.log('\n📦 Erstelle ProductFiles Bucket...');
    const { error: bucketError } = await supabase.storage.createBucket('productfiles', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 52428800 // 50MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Bucket-Erstellungsfehler:', bucketError);
      return;
    }
    console.log('✅ ProductFiles Bucket bereit');

    // 3. Konvertiere Base64 zu Buffer
    console.log('\n🔄 Konvertiere Base64 zu Datei...');
    const base64Data = capture.screenshot_url;
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches) {
      console.error('❌ Ungültiges Base64-Format');
      return;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');
    const filename = `product_${capture.id}_screenshot.png`;

    console.log(`📁 Lade hoch als: ${filename}`);

    // 4. Lade in ProductFiles Bucket hoch
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('productfiles')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload-Fehler:', uploadError);
      return;
    }

    console.log('✅ Datei erfolgreich hochgeladen:', uploadData.path);

    // 5. Hole Public URL
    const { data: urlData } = supabase.storage
      .from('productfiles')
      .getPublicUrl(filename);

    console.log('🔗 Public URL:', urlData.publicUrl);

    // 6. Erstelle Produkt-Eintrag
    console.log('\n📝 Erstelle Produkt-Eintrag...');
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name: `Product from Capture ${capture.id}`,
        description: `Auto-generiertes Produkt aus Capture ${capture.id}`,
        image_url: urlData.publicUrl,
        created_at: capture.created_at,
        updated_at: new Date().toISOString()
      })
      .select();

    if (productError) {
      console.error('❌ Produkt-Erstellungsfehler:', productError);
      return;
    }

    console.log('✅ Produkt erstellt:', productData[0].id);

    console.log('\n🎉 Migration erfolgreich abgeschlossen!');
    console.log('📊 Zusammenfassung:');
    console.log(`- Capture ID: ${capture.id}`);
    console.log(`- Datei hochgeladen: ${filename}`);
    console.log(`- Produkt erstellt: ${productData[0].id}`);
    console.log(`- Public URL: ${urlData.publicUrl}`);

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
  }
}

testMigrationWithServiceRole(); 