/**
 * UI to Products Table Test
 * 
 * Testet, ob UI-Daten (wie sie von der Capture Page kommen) 
 * erfolgreich in die products Tabelle geschrieben werden können.
 * 
 * Simuliert die Datenstruktur, die von der KI-Analyse und UI-Feldern kommt.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration
const supabaseUrl = "https://jpmhwyjiuodsvjowddsm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulierte UI-Daten (wie sie von der Capture Page kommen würden)
const uiProductData = {
  // PRODUKT_ Felder (aus KI-Analyse)
  produkt_kategorie: ['Dämmstoffe', 'Mineralwolle'],
  produkt_hersteller: 'Knauf Insulation',
  produkt_name_modell: 'Knauf Insulation Dämmplatte',
  produkt_produktlinie_serie: 'Thermo Comfort',
  produkt_code_id: 'TC-040',
  produkt_anwendungsbereich: 'Außendämmung, Innenwanddämmung',
  produkt_beschreibung: 'Hochwertige Dämmplatte aus Mineralwolle für optimale Wärmedämmung',
  produkt_hersteller_webseite: 'https://www.knaufinsulation.de',
  produkt_hersteller_produkt_url: 'https://www.knaufinsulation.de/produkte/thermo-comfort',
  
  // PARAMETER_ Felder (aus KI-Analyse)
  parameter_masse: '1200x600x40 mm',
  parameter_farbe: 'Grau',
  parameter_hauptmaterial: 'Mineralwolle',
  parameter_oberflaeche: 'Glasvlies kaschiert',
  parameter_gewicht_pro_einheit: '1.2 kg/m²',
  parameter_feuerwiderstand: 'A1 (nicht brennbar)',
  parameter_waermeleitfaehigkeit: '0.040 W/mK',
  parameter_u_wert: '0.25 W/m²K',
  parameter_schalldaemmung: '42 dB',
  parameter_wasserbestaendigkeit: 'Wasserabweisend',
  parameter_dampfdiffusion: 'μ = 1',
  parameter_einbauart: 'Klebe-Montage',
  parameter_wartung: 'Wartungsfrei',
  parameter_umweltzertifikat: 'Blauer Engel',
  
  // DOKUMENTE_ Felder (aus KI-Analyse)
  dokumente_datenblatt: 'https://www.knaufinsulation.de/downloads/datenblatt-tc-040.pdf',
  dokumente_technisches_merkblatt: 'https://www.knaufinsulation.de/downloads/merkblatt-tc-040.pdf',
  dokumente_produktkatalog: 'https://www.knaufinsulation.de/downloads/katalog-2024.pdf',
  dokumente_weitere_dokumente: 'https://www.knaufinsulation.de/downloads/montageanleitung.pdf',
  dokumente_bim_cad_technische_zeichnungen: 'https://www.knaufinsulation.de/downloads/cad-tc-040.zip',
  
  // HAENDLER_ Felder (aus KI-Analyse)
  haendler_haendlername: 'XXXLutz Baumarkt',
  haendler_haendler_webseite: 'https://www.xxxlutz.de',
  haendler_haendler_produkt_url: 'https://www.xxxlutz.de/knauf-daemmplatte-tc-040',
  haendler_verfuegbarkeit: 'Sofort verfügbar',
  haendler_einheit: 'm²',
  haendler_preis: 12.99,
  haendler_preis_pro_einheit: 12.99,
  
  // ERFAHRUNG_ Felder (User-Eingaben)
  erfahrung_einsatz_in_projekt: 'Wohnhaus Berlin-Mitte',
  erfahrung_muster_bestellt: 'Ja, 2 m² Muster bestellt',
  erfahrung_muster_abgelegt: 'Muster im Projektordner',
  erfahrung_bewertung: 'Sehr gut - einfache Verarbeitung',
  erfahrung_bemerkungen_notizen: 'Gute Qualität, schnelle Lieferung, empfehlenswert',
  
  // ERFASSUNG_ Felder (automatisch gesetzt)
  erfassung_quell_url: 'https://www.xxxlutz.de/knauf-daemmplatte-tc-040',
  erfassung_erfassungsdatum: new Date().toISOString(),
  erfassung_erfassung_fuer: 'Deutschland',
  erfassung_extraktions_log: 'KI-Analyse erfolgreich - OpenAI + Perplexity',
  
  // Metadaten
  source_type: 'reseller',
  source_url: 'https://www.xxxlutz.de/knauf-daemmplatte-tc-040',
  screenshot_path: '/screenshots/knauf-daemmplatte-2024-08-02.jpg',
  thumbnail_path: '/thumbnails/knauf-daemmplatte-2024-08-02-thumb.jpg',
  
  // AI-Analyse Metadaten
  parsed_fields: {
    openai_confidence: 0.85,
    perplexity_confidence: 0.78,
    fusion_method: 'confidence_based'
  },
  ai_confidence: {
    overall: 0.82,
    fields: {
      produkt_name_modell: 0.95,
      produkt_hersteller: 0.90,
      haendler_preis: 0.88,
      parameter_waermeleitfaehigkeit: 0.75
    }
  },
  manual_reviewed: false,
  notes: 'Test-Produkt für UI-to-Database Integration'
};

let createdProductId = null;

async function runUITests() {
  console.log('🧪 Starte UI-to-Products Table Tests...\n');

  try {
    // Test 1: Verbindung testen
    await testConnection();
    
    // Test 2: UI-Daten in products Tabelle schreiben
    await testWriteUIData();
    
    // Test 3: Geschriebene Daten lesen und validieren
    await testReadUIData();
    
    // Test 4: Daten aktualisieren (simuliert User-Änderungen)
    await testUpdateUIData();
    
    // Test 5: Test-Daten bereinigen
    await testCleanup();
    
    console.log('\n✅ Alle UI-to-Products Tests erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('\n❌ Test fehlgeschlagen:', error.message);
    console.error('Stack:', error.stack);
    
    // Cleanup bei Fehler
    if (createdProductId) {
      try {
        await supabase.from('products').delete().eq('id', createdProductId);
        console.log('🧹 Cleanup nach Fehler durchgeführt');
      } catch (cleanupError) {
        console.error('Cleanup fehlgeschlagen:', cleanupError.message);
      }
    }
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

async function testWriteUIData() {
  console.log('\n📝 Test 2: UI-Daten in products Tabelle schreiben...');
  
  const { data, error } = await supabase
    .from('products')
    .insert([uiProductData])
    .select();
  
  if (error) {
    throw new Error(`Schreiben fehlgeschlagen: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('Keine Daten zurückgegeben nach Insert');
  }
  
  createdProductId = data[0].id;
  console.log(`✅ UI-Daten erfolgreich geschrieben: ${data[0].produkt_name_modell} (ID: ${createdProductId})`);
  console.log(`   Hersteller: ${data[0].produkt_hersteller}`);
  console.log(`   Preis: ${data[0].haendler_preis} €/${data[0].haendler_einheit}`);
  console.log(`   Kategorien: ${data[0].produkt_kategorie?.join(', ')}`);
}

async function testReadUIData() {
  console.log('\n📖 Test 3: Geschriebene UI-Daten lesen und validieren...');
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', createdProductId)
    .single();
  
  if (error) {
    throw new Error(`Lesen fehlgeschlagen: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Keine Daten gefunden');
  }
  
  // Validierung der wichtigsten Felder
  const validations = [
    { field: 'produkt_name_modell', expected: 'Knauf Insulation Dämmplatte' },
    { field: 'produkt_hersteller', expected: 'Knauf Insulation' },
    { field: 'haendler_preis', expected: 12.99 },
    { field: 'parameter_waermeleitfaehigkeit', expected: '0.040 W/mK' },
    { field: 'source_type', expected: 'reseller' }
  ];
  
  for (const validation of validations) {
    if (data[validation.field] !== validation.expected) {
      throw new Error(`Validierung fehlgeschlagen für ${validation.field}: erwartet "${validation.expected}", erhalten "${data[validation.field]}"`);
    }
  }
  
  console.log('✅ Alle UI-Daten erfolgreich gelesen und validiert');
  console.log(`   Produkt: ${data.produkt_name_modell}`);
  console.log(`   Hersteller: ${data.produkt_hersteller}`);
  console.log(`   Preis: ${data.haendler_preis} €/${data.haendler_einheit}`);
  console.log(`   Wärmeleitfähigkeit: ${data.parameter_waermeleitfaehigkeit}`);
  console.log(`   AI-Konfidenz: ${data.ai_confidence?.overall || 'N/A'}`);
}

async function testUpdateUIData() {
  console.log('\n✏️ Test 4: UI-Daten aktualisieren (User-Änderungen)...');
  
  const updateData = {
    erfahrung_bewertung: 'Ausgezeichnet - übertrifft Erwartungen',
    erfahrung_bemerkungen_notizen: 'Sehr zufrieden mit der Qualität. Einfache Verarbeitung und schnelle Lieferung.',
    manual_reviewed: true,
    notes: 'User hat Bewertung und Notizen aktualisiert'
  };
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', createdProductId)
    .select();
  
  if (error) {
    throw new Error(`Update fehlgeschlagen: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('Keine Daten zurückgegeben nach Update');
  }
  
  console.log('✅ UI-Daten erfolgreich aktualisiert');
  console.log(`   Neue Bewertung: ${data[0].erfahrung_bewertung}`);
  console.log(`   Manual Reviewed: ${data[0].manual_reviewed}`);
  console.log(`   Notes: ${data[0].notes}`);
}

async function testCleanup() {
  console.log('\n🗑️ Test 5: Test-Daten bereinigen...');
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', createdProductId);
  
  if (error) {
    throw new Error(`Cleanup fehlgeschlagen: ${error.message}`);
  }
  
  // Verifizierung der Löschung
  const { data: verifyData } = await supabase
    .from('products')
    .select('id')
    .eq('id', createdProductId);
  
  if (verifyData && verifyData.length > 0) {
    throw new Error('Produkt wurde nicht korrekt gelöscht');
  }
  
  console.log('✅ Test-Daten erfolgreich bereinigt');
  createdProductId = null;
}

// Test ausführen
if (require.main === module) {
  runUITests().catch(console.error);
}

module.exports = { runUITests }; 