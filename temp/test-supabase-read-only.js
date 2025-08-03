const { createClient } = require('@supabase/supabase-js');

// Supabase-Client mit Anon Key (nur zum Lesen)
const supabase = createClient(
  "https://jpmhwyjiuodsvjowddsm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E"
);

async function testConnection() {
  console.log('🧪 Teste Supabase-Verbindung...');

  try {
    // 1. Teste Verbindung
    console.log('📡 Teste Datenbankverbindung...');
    const { data: captures, error } = await supabase
      .from('captures')
      .select('id, screenshot_url')
      .like('screenshot_url', 'data:%')
      .limit(3);

    if (error) {
      console.error('❌ Verbindungsfehler:', error);
      return;
    }

    console.log('✅ Verbindung erfolgreich!');
    console.log(`📋 Gefundene Captures mit Base64: ${captures.length}`);

    if (captures.length > 0) {
      console.log('📊 Erste 3 Captures:');
      captures.forEach((capture, index) => {
        console.log(`  ${index + 1}. Capture ID: ${capture.id}`);
        console.log(`     Screenshot URL Länge: ${capture.screenshot_url.length} Zeichen`);
        console.log(`     Beginnt mit: ${capture.screenshot_url.substring(0, 50)}...`);
      });
    }

    // 2. Teste Storage Buckets
    console.log('\n📦 Teste Storage Buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage-Fehler (normal mit Anon Key):', bucketError.message);
    } else {
      console.log('✅ Storage verfügbar');
      console.log('📁 Verfügbare Buckets:', buckets.map(b => b.name));
    }

    console.log('\n🎉 Test abgeschlossen!');
    console.log('💡 Für vollständige Migration brauchst du den Service-Role-Key');

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
  }
}

testConnection(); 