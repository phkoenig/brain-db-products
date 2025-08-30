const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { WFSCapabilitiesParser } = require('../../../lib/wfs-parser.js');

// Dotenv-Konfiguration
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env.local') });

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

console.log('🔧 Debug: Supabase URL:', supabaseUrl);
console.log('🔧 Debug: Supabase Key vorhanden:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Aktualisiert bestehende Layer mit erweiterten Metadaten
 */
async function updateExistingLayersMetadata() {
  console.log('🚀 Starte Update bestehender WFS-Layer mit erweiterten Metadaten...\n');

  const parser = new WFSCapabilitiesParser();
  
  // Hole alle Layer ohne erweiterte Metadaten
  const { data: layers, error: layersError } = await supabase
    .from('wfs_layers')
    .select(`
      id, 
      name, 
      titel, 
      abstract,
      schluesselwoerter,
      inspire_thema_codes,
      geometrietyp,
      feature_typ
    `)
    .order('created_at', { ascending: true });

  if (layersError) {
    console.error('❌ Fehler beim Laden der Layer:', layersError);
    return;
  }

  console.log(`📊 Gefunden: ${layers.length} Layer zur Aktualisierung\n`);

  let updatedCount = 0;
  let categorizedCount = 0;
  let keywordsCount = 0;
  let inspireCount = 0;
  let geometryCount = 0;

  for (const layer of layers) {
    console.log(`🔍 Verarbeite Layer: ${layer.name}`);
    
    let needsUpdate = false;
    const updateData = {};

    // 1. Intelligente Kategorisierung (falls noch nicht vorhanden)
    if (!layer.feature_typ) {
      const smartCategory = parser.categorizeLayer({
        name: layer.name,
        title: layer.titel,
        abstract: layer.abstract
      });
      
      if (smartCategory) {
        updateData.feature_typ = smartCategory;
        categorizedCount++;
        needsUpdate = true;
        console.log(`   📂 Kategorie hinzugefügt: ${smartCategory}`);
      }
    }

    // 2. INSPIRE Theme Codes extrahieren (falls noch nicht vorhanden)
    if (!layer.inspire_thema_codes || layer.inspire_thema_codes.length === 0) {
      const inspireThemes = parser._extractInspireThemeCodes({
        Name: layer.name,
        Title: layer.titel,
        Abstract: layer.abstract
      });
      
      if (inspireThemes && inspireThemes.length > 0) {
        updateData.inspire_thema_codes = inspireThemes;
        inspireCount++;
        needsUpdate = true;
        console.log(`   🌍 INSPIRE Themes hinzugefügt: ${inspireThemes.join(', ')}`);
      }
    }

    // 3. Geometrietyp ableiten (falls noch nicht vorhanden)
    if (!layer.geometrietyp) {
      const geometryType = parser._extractGeometryType({
        Name: layer.name,
        Title: layer.titel
      });
      
      if (geometryType) {
        updateData.geometrietyp = geometryType;
        geometryCount++;
        needsUpdate = true;
        console.log(`   📐 Geometrietyp hinzugefügt: ${geometryType}`);
      }
    }

    // 4. Keywords aus Name/Title/Abstract extrahieren
    if (!layer.schluesselwoerter || layer.schluesselwoerter.length === 0) {
      const keywords = extractKeywordsFromText(layer.name, layer.titel, layer.abstract);
      
      if (keywords && keywords.length > 0) {
        updateData.schluesselwoerter = keywords;
        keywordsCount++;
        needsUpdate = true;
        console.log(`   🏷️  Keywords hinzugefügt: ${keywords.join(', ')}`);
      }
    }

    // Update durchführen, falls nötig
    if (needsUpdate) {
      updateData.updated_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('wfs_layers')
        .update(updateData)
        .eq('id', layer.id);

      if (updateError) {
        console.log(`   ❌ Fehler beim Update: ${updateError.message}`);
      } else {
        updatedCount++;
        console.log(`   ✅ Layer aktualisiert`);
      }
    } else {
      console.log(`   ℹ️  Keine Aktualisierung nötig`);
    }
    
    console.log(''); // Leerzeile
  }

  console.log('📊 Update-Zusammenfassung:');
  console.log(`   ✅ Layer aktualisiert: ${updatedCount}`);
  console.log(`   📂 Neue Kategorisierungen: ${categorizedCount}`);
  console.log(`   🏷️  Keywords hinzugefügt: ${keywordsCount}`);
  console.log(`   🌍 INSPIRE Themes hinzugefügt: ${inspireCount}`);
  console.log(`   📐 Geometrietypen hinzugefügt: ${geometryCount}`);
  console.log('\n🎉 Update bestehender Layer abgeschlossen!');
}

/**
 * Extrahiert Keywords aus Text-Feldern
 */
function extractKeywordsFromText(name, title, abstract) {
  const keywords = new Set();
  
  // Kombiniere alle Texte
  const allText = `${name || ''} ${title || ''} ${abstract || ''}`.toLowerCase();
  
  // Standard-Keywords basierend auf häufigen Begriffen
  const keywordMap = {
    'ALKIS': ['alkis', 'adv:', 'ax_'],
    'INSPIRE': ['inspire', 'cp:', 'bu:', 'hy:', 'tn:', 'ad:'],
    'Flurstück': ['flur', 'cadastral', 'parcel', 'liegenschaft'],
    'Gebäude': ['gebäude', 'building', 'house', 'bau'],
    'Adresse': ['address', 'adresse', 'anschrift'],
    'Straße': ['straße', 'street', 'road', 'verkehr'],
    'Wasser': ['wasser', 'gewässer', 'hydro', 'water'],
    'Verwaltung': ['verwaltung', 'administrative', 'gemeinde'],
    'Schutzgebiet': ['schutz', 'protected', 'natura'],
    'Nutzung': ['nutzung', 'landuse', 'corine']
  };
  
  // Suche nach Keywords
  for (const [keyword, patterns] of Object.entries(keywordMap)) {
    if (patterns.some(pattern => allText.includes(pattern))) {
      keywords.add(keyword);
    }
  }
  
  return Array.from(keywords);
}

// Führe das Update-Skript aus
updateExistingLayersMetadata().catch(console.error);
