const { createClient } = require('@supabase/supabase-js');

// Supabase Client erstellen
const supabase = createClient(
  'https://jpmhwyjiuodsvjowddsm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDI4MjYsImV4cCI6MjA2OTE3ODgyNn0.odurlxtkjmlugltznr4z'
);

async function checkProductsStructure() {
  try {
    console.log('🔍 Überprüfe die Struktur der products Tabelle...\n');
    
    // Hole ein Beispiel-Produkt um die verfügbaren Felder zu sehen
    const { data: sampleProduct, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Fehler beim Abrufen der Produkte:', error);
      return;
    }
    
    if (!sampleProduct || sampleProduct.length === 0) {
      console.log('ℹ️ Keine Produkte in der Datenbank gefunden.');
      return;
    }
    
    const product = sampleProduct[0];
    console.log('📋 Verfügbare Felder in der products Tabelle:\n');
    
    // Alle Felder auflisten
    Object.keys(product).forEach(field => {
      const value = product[field];
      const type = typeof value;
      const isImageField = field.toLowerCase().includes('bild') || 
                          field.toLowerCase().includes('image') || 
                          field.toLowerCase().includes('screenshot') || 
                          field.toLowerCase().includes('thumbnail') ||
                          field.toLowerCase().includes('url');
      
      const icon = isImageField ? '🖼️' : '📝';
      console.log(`${icon} ${field}: ${type} = ${value ? (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null/undefined'}`);
    });
    
    // Speziell nach Bildfeldern suchen
    console.log('\n🔍 Bild-bezogene Felder:');
    const imageFields = Object.keys(product).filter(field => 
      field.toLowerCase().includes('bild') || 
      field.toLowerCase().includes('image') || 
      field.toLowerCase().includes('screenshot') || 
      field.toLowerCase().includes('thumbnail') ||
      field.toLowerCase().includes('url')
    );
    
    if (imageFields.length > 0) {
      imageFields.forEach(field => {
        console.log(`🖼️ ${field}: ${product[field] || 'null'}`);
      });
    } else {
      console.log('❌ Keine Bildfelder gefunden!');
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

checkProductsStructure(); 