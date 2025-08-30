const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Dotenv-Konfiguration
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * INTELLIGENTER WFS Feature Test
 * Testet verschiedene Parameter-Kombinationen und Output-Formate
 */
async function smartWfsFeatureTest() {
  console.log('🧠 INTELLIGENTER WFS FEATURE TEST\n');
  
  // Hole bekannt gute Layer (INSPIRE-konforme mit vielen Layern)
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
        ist_aktiv,
        inspire_konform,
        layer_anzahl
      )
    `)
    .eq('wfs_streams.ist_aktiv', true)
    .eq('wfs_streams.inspire_konform', true)  // Nur INSPIRE-konforme
    .gte('wfs_streams.layer_anzahl', 2)       // Services mit mehreren Layern
    .not('wfs_streams.bundesland_oder_region', 'is', null)
    .order('layer_anzahl', { ascending: false, foreignTable: 'wfs_streams' })
    .limit(20); // Top 20 vielversprechendste Layer

  if (error) {
    console.error('❌ Fehler beim Laden der Test-Layer:', error);
    return;
  }

  console.log(`📋 ${testLayers.length} vielversprechende INSPIRE-Layer geladen\n`);

  const results = { successful: 0, total: 0, details: [] };

  for (const layer of testLayers) {
    results.total++;
    const bundesland = layer.wfs_streams.bundesland_oder_region;
    
    console.log(`\n🧪 [${results.total}] ${layer.name}`);
    console.log(`   📍 ${bundesland} | ${layer.feature_typ || 'Unbekannt'}`);
    console.log(`   🏷️  ${layer.titel || 'Kein Titel'}`);

    const baseUrl = layer.wfs_streams.url.split('?')[0];
    let success = false;

    // Teste verschiedene Parameter-Kombinationen
    const testConfigs = [
      // Standard JSON
      {
        format: 'application/json',
        params: `service=WFS&request=GetFeature&typeName=${layer.name}&maxFeatures=5&outputFormat=application/json`
      },
      // GeoJSON
      {
        format: 'application/geo+json', 
        params: `service=WFS&request=GetFeature&typeName=${layer.name}&maxFeatures=5&outputFormat=application/geo%2Bjson`
      },
      // Standard GML
      {
        format: 'text/xml',
        params: `service=WFS&request=GetFeature&typeName=${layer.name}&maxFeatures=5`
      },
      // Mit Version 2.0.0
      {
        format: 'application/json',
        params: `service=WFS&version=2.0.0&request=GetFeature&typeName=${layer.name}&count=5&outputFormat=application/json`
      },
      // Mit Version 1.1.0 
      {
        format: 'text/xml',
        params: `service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.name}&maxFeatures=5`
      }
    ];

    for (const config of testConfigs) {
      if (success) break; // Schon erfolgreich

      const testUrl = `${baseUrl}?${config.params}`;
      console.log(`   🔧 Teste ${config.format}: ${config.params.substring(0, 40)}...`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(testUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'BRAIN-DB-Smart-Test/1.0',
            'Accept': `${config.format}, application/json, text/xml, */*`
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const content = await response.text();

          // Prüfe auf Erfolg
          if (contentType.includes('json')) {
            try {
              const data = JSON.parse(content);
              if (data.features && data.features.length > 0) {
                console.log(`   ✅ SUCCESS: ${data.features.length} Features (JSON)`);
                console.log(`   📋 Eigenschaften: ${Object.keys(data.features[0].properties || {}).slice(0, 3).join(', ')}`);
                success = true;
                results.successful++;
                results.details.push({
                  layer: layer.name,
                  bundesland,
                  method: config.format,
                  features: data.features.length
                });
                break;
              }
            } catch (e) {
              console.log(`   ⚠️  JSON Parse Error`);
            }
          } else if (contentType.includes('xml') && !content.includes('ExceptionReport') && !content.includes('ServiceException')) {
            // Prüfe GML/XML auf Features
            const featureCount = (content.match(/<gml:featureMember|<wfs:member|<gml:boundedBy/g) || []).length;
            if (featureCount > 0) {
              console.log(`   ✅ SUCCESS: ~${featureCount} Features (XML/GML)`);
              success = true;
              results.successful++;
              results.details.push({
                layer: layer.name,
                bundesland,
                method: config.format,
                features: featureCount
              });
              break;
            } else {
              console.log(`   ⚠️  XML aber keine Features erkannt`);
            }
          } else {
            console.log(`   ❌ Exception/Error Response`);
          }
        } else {
          console.log(`   ❌ ${response.status}`);
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`   ⏰ Timeout`);
        } else {
          console.log(`   ❌ ${error.message}`);
        }
      }

      // Kurze Pause zwischen Tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!success) {
      console.log(`   ❌ ALLE METHODEN FEHLGESCHLAGEN`);
    }

    // Pause zwischen Layern
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // ===========================================
  // INTELLIGENTE ZUSAMMENFASSUNG
  // ===========================================
  console.log('\n' + '='.repeat(60));
  console.log('🧠 INTELLIGENTER TEST - ZUSAMMENFASSUNG');
  console.log('='.repeat(60));

  console.log(`\n🎯 ERGEBNIS:`);
  console.log(`   Getestete Layer: ${results.total}`);
  console.log(`   Funktionierende Layer: ${results.successful} (${Math.round(results.successful/results.total*100)}%)`);

  if (results.successful > 0) {
    console.log(`\n✅ ERFOLGREICHE LAYER:`);
    results.details.forEach((detail, i) => {
      console.log(`   ${i+1}. ${detail.layer} (${detail.bundesland})`);
      console.log(`      Method: ${detail.method} | Features: ${detail.features}`);
    });

    console.log(`\n📊 ERFOLG NACH BUNDESLÄNDERN:`);
    const bundeslaenderStats = {};
    results.details.forEach(detail => {
      bundeslaenderStats[detail.bundesland] = (bundeslaenderStats[detail.bundesland] || 0) + 1;
    });
    Object.entries(bundeslaenderStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([bl, count]) => {
        console.log(`   ${bl}: ${count} funktionierende Layer`);
      });

    console.log(`\n🔧 ERFOLGREICHE METHODEN:`);
    const methodStats = {};
    results.details.forEach(detail => {
      methodStats[detail.method] = (methodStats[detail.method] || 0) + 1;
    });
    Object.entries(methodStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([method, count]) => {
        console.log(`   ${method}: ${count}x erfolgreich`);
      });
  }

  const successRate = Math.round(results.successful/results.total*100);
  if (successRate >= 50) {
    console.log(`\n🎉 GUTE NACHRICHTEN: ${successRate}% der INSPIRE-Layer funktionieren!`);
  } else if (successRate >= 20) {
    console.log(`\n⚠️  GEMISCHTE ERGEBNISSE: ${successRate}% funktionieren - typisch für WFS-Landschaft`);
  } else {
    console.log(`\n😱 ERNÜCHTERND: Nur ${successRate}% funktionieren - WFS-Services haben oft Probleme`);
  }

  console.log(`\n🔚 Intelligenter Test abgeschlossen!`);
}

// Führe den Test aus
smartWfsFeatureTest().catch(console.error);
