/**
 * Teste mögliche Hessen INSPIRE Buildings URLs
 */
async function testHessenBuildingsURLs() {
  console.log('🔍 Teste mögliche Hessen INSPIRE Buildings URLs...\n');

  // Basierend auf dem Muster der funktionierenden Hessen URLs
  const testUrls = [
    // Muster von Flurstücke: org.2.753259a3-2469-4a16-a8a6-f1a02b897b0d_wfs
    // Muster von Adressen:   org.2.2d55ae0b-b221-4f74-bd9d-fe957aa4df37_wfs
    // Suche nach Buildings mit ähnlichem Muster:
    'https://inspire-hessen.de/ows/services/org.2.buildings_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    'https://inspire-hessen.de/ows/services/buildings_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    
    // Alternative auf geoportal.hessen.de mit korrekter FEATURETYPE_ID:
    'https://www.geoportal.hessen.de/mapbender/php/wfs.php?INSPIRE=1&FEATURETYPE_ID=buildings&REQUEST=GetCapabilities&SERVICE=WFS',
    'https://www.geoportal.hessen.de/mapbender/php/wfs.php?INSPIRE=1&FEATURETYPE_ID=gebaeude&REQUEST=GetCapabilities&SERVICE=WFS',
    
    // Mögliche direkte INSPIRE Buildings URL:
    'https://inspire-hessen.de/ows/services/inspire_buildings_wfs?service=WFS&request=GetCapabilities&version=2.0.0'
  ];

  for (const url of testUrls) {
    console.log(`🧪 Teste: ${url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BRAIN-DB-WFS-Client/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const content = await response.text();
        console.log(`   📄 Content-Length: ${content.length} Zeichen`);
        
        // Prüfe ob es XML ist und ob es Layer enthält
        if (content.includes('WFS_Capabilities') || content.includes('<FeatureType')) {
          console.log('   ✅ WFS Capabilities gefunden!');
          
          // Suche nach Building/Gebäude-bezogenen Layern
          const buildingMatches = content.match(/(building|gebäude|bu-)/gi);
          if (buildingMatches) {
            console.log(`   🏢 Building-Hinweise gefunden: ${buildingMatches.slice(0, 3).join(', ')}`);
          }
          
          // Zähle FeatureTypes
          const featureTypes = (content.match(/<FeatureType>/g) || []).length;
          console.log(`   📋 FeatureTypes gefunden: ${featureTypes}`);
          
        } else {
          console.log('   ❌ Kein WFS Capabilities XML');
        }
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('   ⏰ Timeout');
      } else {
        console.log(`   ❌ Fehler: ${error.message}`);
      }
    }
    
    console.log(''); // Leerzeile
  }
}

testHessenBuildingsURLs().catch(console.error);
