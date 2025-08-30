const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Dotenv-Konfiguration
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * INSPIRE-KONFORMER WFS Feature Test
 * Testet mit den korrekten INSPIRE-Standards: WFS 2.0.0 + GML 3.2.1
 */
async function inspireCompliantWfsTest() {
  console.log('🌍 INSPIRE-KONFORMER WFS FEATURE TEST\n');
  console.log('Standards: WFS 2.0.0 + GML 3.2.1 + ETRS89\n');
  
  // Hole explizit INSPIRE-konforme Layer
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
    .eq('wfs_streams.inspire_konform', true)  // Nur echte INSPIRE-Services
    .not('wfs_streams.bundesland_oder_region', 'is', null)
    .not('inspire_thema_codes', 'is', null)   // Nur Layer mit INSPIRE Theme Codes
    .limit(25); // Teste 25 verschiedene INSPIRE-Layer

  if (error) {
    console.error('❌ Fehler beim Laden der INSPIRE-Layer:', error);
    return;
  }

  console.log(`📋 ${testLayers.length} INSPIRE-konforme Layer geladen\n`);

  const results = { 
    successful: 0, 
    total: 0, 
    details: [],
    standardsUsed: {
      'WFS 2.0.0 + GML 3.2.1': 0,
      'WFS 2.0.0 + GML 3.2': 0,
      'WFS 1.1.0 + GML 3.1.1': 0,
      'Fallback Legacy': 0
    }
  };

  for (const layer of testLayers) {
    results.total++;
    const bundesland = layer.wfs_streams.bundesland_oder_region;
    const inspireThemes = layer.inspire_thema_codes || [];
    
    console.log(`\n🧪 [${results.total}] ${layer.name}`);
    console.log(`   📍 ${bundesland} | ${layer.feature_typ || 'Unbekannt'}`);
    console.log(`   🌍 INSPIRE: ${inspireThemes.join(', ')}`);
    console.log(`   🏷️  ${layer.titel || 'Kein Titel'}`);

    const baseUrl = layer.wfs_streams.url.split('?')[0];
    let success = false;
    let usedStandard = '';

    // INSPIRE-konforme Parameter-Kombinationen (in der richtigen Reihenfolge)
    const inspireTestConfigs = [
      // 1. AKTUELLER INSPIRE-STANDARD (2023+)
      {
        name: 'WFS 2.0.0 + GML 3.2.1',
        params: `service=WFS&version=2.0.0&request=GetFeature&typeNames=${layer.name}&count=5&outputFormat=text/xml; subtype=gml/3.2.1&srsName=EPSG:4258`
      },
      // 2. INSPIRE-STANDARD (2010-2023)  
      {
        name: 'WFS 2.0.0 + GML 3.2',
        params: `service=WFS&version=2.0.0&request=GetFeature&typeNames=${layer.name}&count=5&outputFormat=application/gml+xml; version=3.2&srsName=EPSG:4258`
      },
      // 3. ÄLTERER INSPIRE-STANDARD
      {
        name: 'WFS 1.1.0 + GML 3.1.1',
        params: `service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.name}&maxFeatures=5&outputFormat=text/xml; subtype=gml/3.1.1&srsName=EPSG:4258`
      },
      // 4. FALLBACK für Legacy-Services
      {
        name: 'Fallback Legacy',
        params: `service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.name}&maxFeatures=5`
      }
    ];

    for (const config of inspireTestConfigs) {
      if (success) break; // Schon erfolgreich

      const testUrl = `${baseUrl}?${config.params}`;
      console.log(`   🔧 Teste: ${config.name}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(testUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'INSPIRE-Compliant-Client/1.0',
            'Accept': 'application/gml+xml, text/xml, application/xml, */*',
            'Accept-Encoding': 'gzip, deflate'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const content = await response.text();

          console.log(`   📊 Status: ${response.status} | Content-Type: ${contentType}`);

          // Prüfe auf INSPIRE-konforme GML-Antwort
          if (contentType.includes('xml') || contentType.includes('gml')) {
            
            // Prüfe auf Exception Reports
            if (content.includes('ExceptionReport') || content.includes('ServiceException')) {
              console.log(`   ❌ Exception Report erhalten`);
              continue;
            }

            // Prüfe auf echte GML-Features
            const gmlFeaturePatterns = [
              /<gml:featureMember/g,
              /<wfs:member/g,
              /<gml:boundedBy/g,
              /<.*:featureMember/g
            ];

            let featureCount = 0;
            for (const pattern of gmlFeaturePatterns) {
              const matches = content.match(pattern) || [];
              featureCount = Math.max(featureCount, matches.length);
            }

            if (featureCount > 0) {
              console.log(`   ✅ SUCCESS: ${featureCount} GML Features`);
              
              // Prüfe GML-Version
              let gmlVersion = 'unbekannt';
              if (content.includes('gml/3.2')) gmlVersion = 'GML 3.2.1';
              else if (content.includes('gml/3.1')) gmlVersion = 'GML 3.1.1';
              else if (content.includes('gml:')) gmlVersion = 'GML (Version erkannt)';
              
              console.log(`   📋 GML-Version: ${gmlVersion}`);
              
              // Prüfe CRS
              const crsMatches = content.match(/srsName="([^"]+)"/g) || [];
              if (crsMatches.length > 0) {
                const uniqueCrs = [...new Set(crsMatches)];
                console.log(`   🗺️  CRS: ${uniqueCrs.slice(0, 2).join(', ')}`);
              }

              success = true;
              usedStandard = config.name;
              results.successful++;
              results.standardsUsed[config.name]++;
              
              results.details.push({
                layer: layer.name,
                bundesland,
                method: config.name,
                features: featureCount,
                inspireThemes,
                gmlVersion
              });
              break;
              
            } else {
              console.log(`   ⚠️  XML aber keine GML-Features erkannt`);
              console.log(`   📄 Sample: ${content.substring(0, 150)}...`);
            }
          } else {
            console.log(`   ❌ Kein XML/GML Content-Type: ${contentType}`);
          }
        } else {
          console.log(`   ❌ HTTP ${response.status} ${response.statusText}`);
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`   ⏰ Timeout (12s)`);
        } else {
          console.log(`   ❌ Network: ${error.message}`);
        }
      }

      // Kurze Pause zwischen Tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!success) {
      console.log(`   ❌ ALLE INSPIRE-STANDARDS FEHLGESCHLAGEN`);
    }

    // Pause zwischen Layern
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  // ===========================================
  // INSPIRE-KONFORME ZUSAMMENFASSUNG
  // ===========================================
  console.log('\n' + '='.repeat(70));
  console.log('🌍 INSPIRE-KONFORMER TEST - ZUSAMMENFASSUNG');
  console.log('='.repeat(70));

  console.log(`\n🎯 INSPIRE-KONFORMITÄT:`);
  console.log(`   Getestete INSPIRE-Layer: ${results.total}`);
  console.log(`   Funktionierende Layer: ${results.successful} (${Math.round(results.successful/results.total*100)}%)`);

  if (results.successful > 0) {
    console.log(`\n📋 VERWENDETE STANDARDS:`);
    Object.entries(results.standardsUsed)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .forEach(([standard, count]) => {
        const percentage = Math.round(count/results.successful*100);
        console.log(`   ${standard}: ${count}x (${percentage}%)`);
      });

    console.log(`\n✅ ERFOLGREICHE INSPIRE-LAYER:`);
    results.details.forEach((detail, i) => {
      console.log(`   ${i+1}. ${detail.layer} (${detail.bundesland})`);
      console.log(`      INSPIRE: ${detail.inspireThemes.join(', ')} | ${detail.method} | ${detail.features} Features`);
    });

    console.log(`\n🗺️  INSPIRE-ERFOLG NACH BUNDESLÄNDERN:`);
    const bundeslaenderStats = {};
    results.details.forEach(detail => {
      bundeslaenderStats[detail.bundesland] = (bundeslaenderStats[detail.bundesland] || 0) + 1;
    });
    Object.entries(bundeslaenderStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([bl, count]) => {
        console.log(`   ${bl}: ${count} funktionierende INSPIRE-Layer`);
      });

    console.log(`\n🌍 INSPIRE-THEME-ABDECKUNG:`);
    const themeStats = {};
    results.details.forEach(detail => {
      detail.inspireThemes.forEach(theme => {
        themeStats[theme] = (themeStats[theme] || 0) + 1;
      });
    });
    Object.entries(themeStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([theme, count]) => {
        console.log(`   ${theme}: ${count} funktionierende Layer`);
      });
  }

  const successRate = Math.round(results.successful/results.total*100);
  
  console.log(`\n🏆 INSPIRE-BEWERTUNG:`);
  if (successRate >= 70) {
    console.log(`   EXZELLENT: ${successRate}% - Deutschland hat sehr gute INSPIRE-Implementierung!`);
  } else if (successRate >= 50) {
    console.log(`   GUT: ${successRate}% - Solide INSPIRE-Konformität in Deutschland`);
  } else if (successRate >= 30) {
    console.log(`   AUSBAUFÄHIG: ${successRate}% - INSPIRE-Implementierung hat noch Lücken`);
  } else {
    console.log(`   PROBLEMATISCH: ${successRate}% - Viele INSPIRE-Services funktionieren nicht korrekt`);
  }

  console.log(`\n🔚 INSPIRE-konformer Test abgeschlossen!`);
}

// Führe den Test aus
inspireCompliantWfsTest().catch(console.error);
