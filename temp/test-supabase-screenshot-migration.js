const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.cursor' });

// 1. Supabase-Client initialisieren
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateOneCapture() {
  console.log('🚀 Starte Migration eines Screenshots...');

  // 2. Capture holen
  const { data: captures, error: capErr } = await supabase
    .from('captures')
    .select('id, screenshot_url')
    .like('screenshot_url', 'data:%')
    .limit(1);

  if (capErr) {
    console.error('❌ Fehler beim Laden der Captures:', capErr);
    return;
  }
  if (!captures || captures.length === 0) {
    console.log('❌ Kein Capture mit Base64 gefunden');
    return;
  }

  const capture = captures[0];
  console.log('📋 Gefundenes Capture:', capture.id);

  // 3. Base64 in Buffer
  const matches = capture.screenshot_url.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    console.error('❌ Ungültiges Base64-Format');
    return;
  }
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `product_${capture.id}_screenshot.png`;

  // 4. Hochladen
  console.log('⬆️  Lade Datei hoch:', filename);
  const { error: uploadError } = await supabase.storage
    .from('productfiles')
    .upload(filename, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.error('❌ Upload-Fehler:', uploadError);
    return;
  }

  // 5. Public URL holen
  const { data: urlData } = supabase.storage
    .from('productfiles')
    .getPublicUrl(filename);
  console.log('🔗 Public URL:', urlData.publicUrl);

  // 6. In Products-Tabelle schreiben
  const { error: prodErr } = await supabase.from('products').insert({
    name: `Product from Capture ${capture.id}`,
    image_url: urlData.publicUrl,
    // weitere Felder nach Bedarf
  });
  if (prodErr) {
    console.error('❌ Fehler beim Schreiben in products:', prodErr);
    return;
  }

  console.log('✅ Migration abgeschlossen!');
}

migrateOneCapture();