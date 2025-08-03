/**
 * Supabase Products Table Test
 * 
 * Testet die Funktionalität der products Tabelle in Supabase:
 * - Verbindung zur Datenbank
 * - Lesen von Daten
 * - Schreiben von Daten
 * - Aktualisieren von Daten
 * - Löschen von Daten
 * - Spalten-Validierung
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration
const supabaseUrl = "https://jpmhwyjiuodsvjowddsm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test-Daten
const testProduct = {
  produkt_kategorie: ['Test-Kategorie'],
  produkt_hersteller: 'Test-Hersteller GmbH',
  produkt_name_modell: 'Test-Produkt XYZ-1000',
  produkt_produktlinie_serie: 'Premium Serie',
  produkt_code_id: 'TEST-001',
  produkt_anwendungsbereich: 'Test-Anwendung',
  produkt_beschreibung: 'Ein Test-Produkt für die Datenbank-Tests',
  produkt_hersteller_webseite: 'https://test-hersteller.de',
  produkt_hersteller_produkt_url: 'https://test-hersteller.de/produkt/xyz-1000',
  parameter_masse: '100x200x50 mm',
  parameter_farbe: 'Weiß',
  parameter_hauptmaterial: 'Kunststoff',
  parameter_oberflaeche: 'Glatt',
  parameter_gewicht_pro_einheit: '500g',
  parameter_feuerwiderstand: 'B1',
  parameter_waermeleitfaehigkeit: '0.035 W/mK',
  parameter_u_wert: '0.28 W/m²K',
  parameter_schalldaemmung: '45 dB',
  parameter_wasserbestaendigkeit: 'Wasserabweisend',
  parameter_dampfdiffusion: 'μ = 15',
  parameter_einbauart: 'Klebe-Montage',
  parameter_wartung: 'Wartungsfrei',
  parameter_umweltzertifikat: 'Blauer Engel',
  dokumente_datenblatt: 'https://test-hersteller.de/datenblatt.pdf',
  dokumente_technisches_merkblatt: 'https://test-hersteller.de/merkblatt.pdf',
  dokumente_produktkatalog: 'https://test-hersteller.de/katalog.pdf',
  dokumente_weitere_dokumente: 'https://test-hersteller.de/weitere.pdf',
  dokumente_bim_cad_technische_zeichnungen: 'https://test-hersteller.de/cad.zip',
  haendler_haendlername: 'Test-Händler AG',
  haendler_haendler_webseite: 'https://test-haendler.de',
  haendler_haendler_produkt_url: 'https://test-haendler.de/produkt/xyz-1000',
  haendler_verfuegbarkeit: 'Sofort verfügbar',
  haendler_einheit: 'Stück',
  haendler_preis: 29.99,
  haendler_preis_pro_einheit: 29.99,
  erfahrung_einsatz_in_projekt: 'Test-Projekt 2024',
  erfahrung_muster_bestellt: 'Ja, Muster bestellt',
  erfahrung_muster_abgelegt: 'Muster im Büro',
  erfahrung_bewertung: 'Sehr gut',
  erfahrung_bemerkungen_notizen: 'Test-Notizen für das Produkt',
  erfassung_quell_url: 'https://test-quelle.de',
  erfassung_erfassungsdatum: new Date().toISOString(),
  erfassung_erfassung_fuer: 'Deutschland',
  erfassung_extraktions_log: 'Test-Extraktion erfolgreich',
  source_type: 'Test',
  source_url: 'https://test-quelle.de'
};

let createdProductId = null;

async function runTests() {
  console.log('🧪 Starte Supabase Products Table Tests...\n');

  try {
    // Test 1: Verbindung testen
    await testConnection();
    
    // Test 2: Aktuelle Daten anzeigen
    await showCurrentData();
    
    // Test 3: Produkt erstellen
    await testCreateProduct();
    
    // Test 4: Produkt lesen
    await testReadProduct();
    
    // Test 5: Produkt aktualisieren
    await testUpdateProduct();
    
    // Test 6: Produkt löschen
    await testDeleteProduct();
    
    // Test 7: Spalten-Validierung
    await testColumnValidation();
    
    console.log('\n✅ Alle Tests erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('\n❌ Test fehlgeschlagen:', error);
    process.exit(1);
  }
}

async function testConnection() {
  console.log('🔧 Test 1: Datenbank-Verbindung...');
  
  const { data, error } = await supabase
    .from('products')
    .select('count')
    .limit(1);
  
  if (error) {
    throw new Error(`Verbindung fehlgeschlagen: ${error.message}`);
  }
  
  console.log('✅ Verbindung erfolgreich');
}

async function showCurrentData() {
  console.log('\n📊 Test 2: Aktuelle Daten anzeigen...');
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(5);
  
  if (error) {
    throw new Error(`Daten lesen fehlgeschlagen: ${error.message}`);
  }
  
  console.log(`📈 Aktuell ${data.length} Produkte in der Datenbank:`);
  data.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.produkt_name_modell || 'Unbenannt'} (ID: ${product.id})`);
  });
}

async function testCreateProduct() {
  console.log('\n➕ Test 3: Produkt erstellen...');
  
  const { data, error } = await supabase
    .from('products')
    .insert([testProduct])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Produkt erstellen fehlgeschlagen: ${error.message}`);
  }
  
  createdProductId = data.id;
  console.log(`✅ Produkt erfolgreich erstellt: ${data.produkt_name_modell} (ID: ${data.id})`);
}

async function testReadProduct() {
  console.log('\n📖 Test 4: Produkt lesen...');
  
  if (!createdProductId) {
    throw new Error('Keine Produkt-ID für Lesetest verfügbar');
  }
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', createdProductId)
    .single();
  
  if (error) {
    throw new Error(`Produkt lesen fehlgeschlagen: ${error.message}`);
  }
  
  console.log(`✅ Produkt erfolgreich gelesen: ${data.produkt_name_modell}`);
  console.log(`   Hersteller: ${data.produkt_hersteller}`);
  console.log(`   Preis: ${data.haendler_preis} €`);
}

async function testUpdateProduct() {
  console.log('\n✏️ Test 5: Produkt aktualisieren...');
  
  if (!createdProductId) {
    throw new Error('Keine Produkt-ID für Update-Test verfügbar');
  }
  
  const updateData = {
    produkt_name_modell: 'Test-Produkt XYZ-1000 (Aktualisiert)',
    haendler_preis: 39.99,
    erfahrung_bewertung: 'Ausgezeichnet'
  };
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', createdProductId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Produkt aktualisieren fehlgeschlagen: ${error.message}`);
  }
  
  console.log(`✅ Produkt erfolgreich aktualisiert: ${data.produkt_name_modell}`);
  console.log(`   Neuer Preis: ${data.haendler_preis} €`);
  console.log(`   Neue Bewertung: ${data.erfahrung_bewertung}`);
}

async function testDeleteProduct() {
  console.log('\n🗑️ Test 6: Produkt löschen...');
  
  if (!createdProductId) {
    throw new Error('Keine Produkt-ID für Delete-Test verfügbar');
  }
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', createdProductId);
  
  if (error) {
    throw new Error(`Produkt löschen fehlgeschlagen: ${error.message}`);
  }
  
  console.log(`✅ Produkt erfolgreich gelöscht: ${createdProductId}`);
  
  // Verifiziere, dass das Produkt wirklich gelöscht wurde
  const { data: verifyData } = await supabase
    .from('products')
    .select('id')
    .eq('id', createdProductId);
  
  if (verifyData && verifyData.length > 0) {
    throw new Error('Produkt wurde nicht korrekt gelöscht');
  }
  
  console.log('✅ Löschung verifiziert');
}

async function testColumnValidation() {
  console.log('\n🔍 Test 7: Spalten-Validierung...');
  
  // Teste ungültige Spalte
  const invalidData = {
    ...testProduct,
    ungültige_spalte: 'Dies sollte nicht gespeichert werden'
  };
  
  const { data, error } = await supabase
    .from('products')
    .insert([invalidData])
    .select()
    .single();
  
  if (error) {
    console.log(`✅ Ungültige Spalte korrekt abgelehnt: ${error.message}`);
  } else {
    console.log(`⚠️ Ungültige Spalte wurde akzeptiert (unerwartet)`);
    
    // Lösche das Test-Produkt wieder
    if (data.id) {
      await supabase
        .from('products')
        .delete()
        .eq('id', data.id);
    }
  }
  
  // Teste gültige Spalten
  const validData = {
    produkt_hersteller: 'Valid-Hersteller',
    produkt_name_modell: 'Valid-Produkt',
    haendler_preis: 25.00
  };
  
  const { data: validResult, error: validError } = await supabase
    .from('products')
    .insert([validData])
    .select()
    .single();
  
  if (validError) {
    throw new Error(`Gültige Daten wurden abgelehnt: ${validError.message}`);
  }
  
  console.log(`✅ Gültige Spalten akzeptiert: ${validResult.produkt_name_modell}`);
  
  // Lösche das Test-Produkt
  await supabase
    .from('products')
    .delete()
    .eq('id', validResult.id);
  
  console.log('✅ Test-Produkt wieder gelöscht');
}

// Test ausführen
runTests().catch(console.error); 