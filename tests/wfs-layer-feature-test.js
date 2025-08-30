const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Dotenv-Konfiguration
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test: Abruf von 10 Features von verschiedenen WFS-Layern
 * Zeigt welche Layer wirklich funktionieren vs. nur in GetCapabilities stehen
 */
async function testWfsLayerFeatures() {
  console.log('🧪 WFS LAYER FEATURE-ABRUF TEST\n');
  console.log('Teste verschiedene Layer-Kategorien mit GetFeature-Requests...\n');

  // Hole repräsentative Layer aus verschiedenen Kategorien
  const { data: testLayers, error } = await supabase
    .from('wfs_layers')
    .select(`
      id,
      name,
      titel,
      feature_typ,
      inspire_thema_codes,
      wfs_streams!inner(
        id,
        url,
        bundesland_oder_region,
        service_title,
        ist_aktiv
      )
    `)
    .eq('wfs_streams.ist_aktiv', true)
    .eq('wfs_streams.land_name', 'Deutschland')
    .not('wfs_streams.bundesland_oder_region', 'is', null)
    .limit(50); // Teste 50 verschiedene Layer

  if (error) {
    console.error('❌ Fehler beim Laden der Test-Layer:', error);
    return;
  }

  console.log(`📋 ${testLayers.length} Layer für Feature-Test geladen\n`);

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    categories: {},
    bundeslaender: {},
    errors: {}
  };

  // Gruppiere nach Kategorien für bessere Übersicht
  const layersByCategory = {};
  testLayers.forEach(layer => {
    const category = layer.feature_typ || 'Unbekannt';
    if (!layersByCategory[category]) layersByCategory[category] = [];
    layersByCategory[category].push(layer);
  });

  console.log('📊 Test-Layer nach Kategorien:');
  Object.keys(layersByCategory).forEach(cat => {
    console.log(`   ${cat}: ${layersByCategory[cat].length} Layer`);
  });
  console.log('');

  // Teste Layer aus jeder Kategorie (max 3 pro Kategorie für Effizienz)
  for (const [category, layers] of Object.entries(layersByCategory)) {
    console.log(`\n🔍 TESTE KATEGORIE: ${category.toUpperCase()}`);
    console.log('=' .repeat(50));

    const testLayersForCategory = layers.slice(0, 3); // Max 3 pro Kategorie

    for (const layer of testLayersForCategory) {
      results.total++;
      const bundesland = layer.wfs_streams.bundesland_oder_region;
      
      console.log(`\n🧪 [${results.total}] ${layer.name}`);
      console.log(`   📍 ${bundesland} | ${layer.wfs_streams.service_title}`);
      console.log(`   🏷️  ${layer.titel || 'Kein Titel'}`);

      // Baue GetFeature URL
      const baseUrl = layer.wfs_streams.url.split('?')[0];
      const getFeatureUrl = `${baseUrl}?service=WFS&request=GetFeature&typeName=${layer.name}&maxFeatures=10&outputFormat=application/json`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        console.log(`   🌐 GET ${getFeatureUrl.substring(0, 80)}...`);

        const response = await fetch(getFeatureUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'BRAIN-DB-Feature-Test/1.0',
            'Accept': 'application/json, application/geo+json, text/xml'
          }
        });

        clearTimeout(timeoutId);

        console.log(`   📊 Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const content = await response.text();

          console.log(`   📄 Content-Type: ${contentType}`);
          console.log(`   📏 Size: ${content.length} Zeichen`);

          // Prüfe ob es JSON/GeoJSON ist
          if (contentType.includes('json')) {
            try {
              const data = JSON.parse(content);
              
              if (data.features && Array.isArray(data.features)) {
                console.log(`   ✅ SUCCESS: ${data.features.length} Features erhalten`);
                console.log(`   🎯 Feature-Typ: GeoJSON`);
                
                if (data.features.length > 0) {
                  const firstFeature = data.features[0];
                  const props = Object.keys(firstFeature.properties || {}).slice(0, 3);
                  console.log(`   📋 Eigenschaften: ${props.join(', ')}${props.length >= 3 ? '...' : ''}`);
                }

                results.successful++;
                
                // Statistiken
                if (!results.categories[category]) results.categories[category] = { success: 0, total: 0 };
                results.categories[category].success++;
                results.categories[category].total++;

                if (!results.bundeslaender[bundesland]) results.bundeslaender[bundesland] = { success: 0, total: 0 };
                results.bundeslaender[bundesland].success++;
                results.bundeslaender[bundesland].total++;

              } else {
                console.log(`   ⚠️  JSON aber keine GeoJSON Features`);
                console.log(`   📄 Content: ${content.substring(0, 200)}...`);
                results.failed++;
              }
            } catch (parseError) {
              console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
              results.failed++;
            }
          } else if (contentType.includes('xml')) {
            // Prüfe GML/XML Response
            if (content.includes('<gml:') || content.includes('<wfs:FeatureCollection')) {
              const featureMatches = content.match(/<gml:featureMember|<wfs:member/g) || [];
              console.log(`   ✅ SUCCESS: ~${featureMatches.length} Features (GML/XML)`);
              results.successful++;

              // Statistiken
              if (!results.categories[category]) results.categories[category] = { success: 0, total: 0 };
              results.categories[category].success++;
              results.categories[category].total++;

              if (!results.bundeslaender[bundesland]) results.bundeslaender[bundesland] = { success: 0, total: 0 };
              results.bundeslaender[bundesland].success++;
              results.bundeslaender[bundesland].total++;
            } else {
              console.log(`   ❌ XML aber keine Features erkannt`);
              console.log(`   📄 Content: ${content.substring(0, 200)}...`);
              results.failed++;
            }
          } else {
            console.log(`   ❌ Unbekanntes Format: ${contentType}`);
            results.failed++;
          }

        } else {
          console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
          
          const errorKey = `HTTP ${response.status}`;
          results.errors[errorKey] = (results.errors[errorKey] || 0) + 1;
          results.failed++;

          // Statistiken für failed
          if (!results.categories[category]) results.categories[category] = { success: 0, total: 0 };
          results.categories[category].total++;

          if (!results.bundeslaender[bundesland]) results.bundeslaender[bundesland] = { success: 0, total: 0 };
          results.bundeslaender[bundesland].total++;
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`   ⏰ TIMEOUT nach 15 Sekunden`);
          results.errors['Timeout'] = (results.errors['Timeout'] || 0) + 1;
        } else {
          console.log(`   ❌ Network Error: ${error.message}`);
          results.errors['Network Error'] = (results.errors['Network Error'] || 0) + 1;
        }
        results.failed++;

        // Statistiken für failed
        if (!results.categories[category]) results.categories[category] = { success: 0, total: 0 };
        results.categories[category].total++;

        if (!results.bundeslaender[bundesland]) results.bundeslaender[bundesland] = { success: 0, total: 0 };
        results.bundeslaender[bundesland].total++;
      }

      // Kurze Pause zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // ===========================================
  // ZUSAMMENFASSUNG
  // ===========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST-ZUSAMMENFASSUNG');
  console.log('='.repeat(60));

  console.log(`\n🎯 GESAMT-ERGEBNIS:`);
  console.log(`   Getestete Layer: ${results.total}`);
  console.log(`   Erfolgreiche Features: ${results.successful} (${Math.round(results.successful/results.total*100)}%)`);
  console.log(`   Fehlgeschlagen: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);

  console.log(`\n📋 ERFOLG NACH KATEGORIEN:`);
  Object.entries(results.categories)
    .sort((a, b) => (b[1].success/b[1].total) - (a[1].success/a[1].total))
    .forEach(([cat, stats]) => {
      const successRate = Math.round(stats.success/stats.total*100);
      console.log(`   ${cat}: ${stats.success}/${stats.total} (${successRate}%)`);
    });

  console.log(`\n🗺️  ERFOLG NACH BUNDESLÄNDERN:`);
  Object.entries(results.bundeslaender)
    .sort((a, b) => (b[1].success/b[1].total) - (a[1].success/a[1].total))
    .forEach(([bl, stats]) => {
      const successRate = Math.round(stats.success/stats.total*100);
      console.log(`   ${bl}: ${stats.success}/${stats.total} (${successRate}%)`);
    });

  if (Object.keys(results.errors).length > 0) {
    console.log(`\n❌ HÄUFIGSTE FEHLER:`);
    Object.entries(results.errors)
      .sort((a, b) => b[1] - a[1])
      .forEach(([error, count]) => {
        console.log(`   ${error}: ${count}x`);
      });
  }

  console.log(`\n🎉 Feature-Abruf-Test abgeschlossen!`);
}

// Führe den Test aus
testWfsLayerFeatures().catch(console.error);
