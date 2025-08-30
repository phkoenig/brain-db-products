/**
 * Test der Berlin WFS-Layer auf Straßen/Bürgersteig-Daten
 * Besonders der interessante Layer: alkis:bauwerkelinien
 */
async function testBerlinStreetLayers() {
  console.log('🏙️ BERLIN STRASSEN-LAYER TEST\n');

  // Die interessantesten Berlin Layer für Straßen/Verkehr
  const berlinLayers = [
    {
      name: 'alkis:bauwerkelinien',
      title: 'ALKIS Berlin Bauwerke (Linien)',
      description: 'Bauwerke im Verkehrsbereich, Straßenverkehrsanlagen',
      url: 'https://gdi.berlin.de/services/wfs/alkis?REQUEST=GetCapabilities&SERVICE=WFS'
    },
    {
      name: 'alkis:bauwerkeflaechen', 
      title: 'ALKIS Berlin Bauwerke (Flächen)',
      description: 'Bauwerke, Anlage und Einrichtung in Siedlungsflächen und für den Verkehr',
      url: 'https://gdi.berlin.de/services/wfs/alkis?REQUEST=GetCapabilities&SERVICE=WFS'
    },
    {
      name: 'alkis:festlegungenflaechen',
      title: 'ALKIS Berlin Rechtliche Festlegungen', 
      description: 'Klassifizierung nach Straßenrecht, Wasserrecht, sonstiges Recht',
      url: 'https://gdi.berlin.de/services/wfs/alkis?REQUEST=GetCapabilities&SERVICE=WFS'
    },
    {
      name: 'alkis:tatsaechlichenutzungflaechen',
      title: 'ALKIS Berlin Tatsächliche Nutzung',
      description: 'Lückenlose Beschreibung der Erdoberfläche',
      url: 'https://gdi.berlin.de/services/wfs/alkis?REQUEST=GetCapabilities&SERVICE=WFS'
    }
  ];

  for (const layer of berlinLayers) {
    console.log(`\n🧪 TESTE: ${layer.name}`);
    console.log(`   📋 ${layer.title}`);
    console.log(`   💬 ${layer.description}`);

    const baseUrl = layer.url.split('?')[0];
    
    // Teste verschiedene Parameter-Kombinationen
    const testConfigs = [
      {
        name: 'WFS 1.1.0 Legacy',
        params: `service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.name}&maxFeatures=10`
      },
      {
        name: 'WFS 2.0.0 Standard',
        params: `service=WFS&version=2.0.0&request=GetFeature&typeNames=${layer.name}&count=10`
      }
    ];

    let success = false;

    for (const config of testConfigs) {
      if (success) break;

      const testUrl = `${baseUrl}?${config.params}`;
      console.log(`   🔧 Teste: ${config.name}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(testUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Berlin-Street-Test/1.0',
            'Accept': 'application/gml+xml, text/xml, */*'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const content = await response.text();

          console.log(`   📊 Status: ${response.status} | Content-Type: ${contentType}`);

          if (contentType.includes('xml') && !content.includes('ExceptionReport')) {
            // Prüfe auf GML-Features
            const featurePatterns = [
              /<gml:featureMember/g,
              /<wfs:member/g,
              /<gml:boundedBy/g
            ];

            let featureCount = 0;
            for (const pattern of featurePatterns) {
              const matches = content.match(pattern) || [];
              featureCount = Math.max(featureCount, matches.length);
            }

            if (featureCount > 0) {
              console.log(`   ✅ SUCCESS: ${featureCount} Features gefunden!`);
              
              // Analysiere Feature-Eigenschaften
              const propertyMatches = content.match(/<alkis:\w+>([^<]+)<\/alkis:\w+>/g) || [];
              if (propertyMatches.length > 0) {
                const sampleProps = propertyMatches.slice(0, 5).map(match => 
                  match.replace(/<alkis:(\w+)>.*<\/alkis:\w+>/, '$1')
                );
                console.log(`   📋 Eigenschaften: ${[...new Set(sampleProps)].join(', ')}`);
              }

              // Suche nach straßenbezogenen Keywords
              const streetKeywords = content.match(/(straß|street|road|bürger|sidewalk|gehweg|verkehr|transport)/gi) || [];
              if (streetKeywords.length > 0) {
                console.log(`   🛣️  Straßen-Keywords: ${[...new Set(streetKeywords.slice(0, 5))].join(', ')}`);
              }

              success = true;
            } else {
              console.log(`   ⚠️  XML aber keine Features erkannt`);
            }
          } else {
            console.log(`   ❌ Exception oder kein XML`);
          }
        } else {
          console.log(`   ❌ HTTP ${response.status}`);
        }

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`   ⏰ Timeout`);
        } else {
          console.log(`   ❌ ${error.message}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!success) {
      console.log(`   ❌ LAYER NICHT ABRUFBAR`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🏁 Berlin Straßen-Layer Test abgeschlossen!`);
}

testBerlinStreetLayers().catch(console.error);
