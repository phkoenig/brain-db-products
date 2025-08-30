/**
 * Finale systematische Suche nach Hessen Buildings
 */
async function finalHessenBuildingsSearch() {
  console.log('🔍 FINALE Hessen Buildings-Suche...\n');

  // Teste die wahrscheinlichste Theorie: Hessen hat ein anderes URL-Schema
  const testUrls = [
    // 1. Teste ob es einen dedizierten ALKIS Buildings Service gibt
    'https://inspire-hessen.de/ows/services/alkis-buildings_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    
    // 2. Teste eine mögliche andere UUID (ähnlich anderen Bundesländern)
    'https://inspire-hessen.de/ows/services/org.2.buildings-alkis_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    
    // 3. Prüfe ob Hessen Buildings über das Geoportal verfügbar macht (andere FEATURETYPE_ID)
    'https://www.geoportal.hessen.de/mapbender/php/wfs.php?INSPIRE=1&FEATURETYPE_ID=bu&REQUEST=GetCapabilities&SERVICE=WFS',
    'https://www.geoportal.hessen.de/mapbender/php/wfs.php?INSPIRE=1&FEATURETYPE_ID=1971&REQUEST=GetCapabilities&SERVICE=WFS', // Saarland Pattern
    
    // 4. Teste direkte INSPIRE Registry URLs
    'https://www.geoportal.hessen.de/registry/wfs/buildings',
    'https://www.geoportal.hessen.de/registry/wfs/gebaeude',
    
    // 5. Teste ob es über HLNUG (Hessisches Landesamt) läuft
    'https://www.hlnug.de/wfs/inspire/buildings?service=WFS&request=GetCapabilities',
    
    // 6. Teste mögliche direkte ALKIS-Integration
    'https://inspire-hessen.de/ows/services/alkis_wfs?service=WFS&request=GetCapabilities&version=2.0.0'
  ];

  for (const url of testUrls) {
    console.log(`🧪 ${url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BRAIN-DB-WFS-Client/1.0',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const content = await response.text();
        
        if (content.includes('WFS_Capabilities')) {
          console.log(`   ✅ WFS gefunden! (${content.length} chars)`);
          
          // Suche nach Gebäude-relevanten Layern
          const layerMatches = content.match(/<Name>([^<]*(?:building|gebäude|bu-|bldg:)[^<]*)<\/Name>/gi) || [];
          if (layerMatches.length > 0) {
            console.log(`   🏢 BUILDING LAYER GEFUNDEN!`);
            layerMatches.forEach(match => {
              console.log(`      - ${match.replace(/<\/?Name>/g, '')}`);
            });
            console.log(`   🌐 ERFOLGREICHE URL: ${url}`);
            return url;
          } else {
            // Zähle alle Layer
            const allLayers = content.match(/<Name>([^<]+)<\/Name>/g) || [];
            console.log(`   📋 ${allLayers.length} Layer, aber keine Buildings`);
            if (allLayers.length <= 5) {
              allLayers.forEach(layer => console.log(`      - ${layer.replace(/<\/?Name>/g, '')}`));
            }
          }
        } else if (content.includes('<html')) {
          console.log('   📄 HTML Response (Portal/Fehlerseite)');
        } else {
          console.log('   ❓ Unbekanntes Format');
        }
      } else {
        console.log(`   ❌ ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('   ⏰ Timeout');
      } else {
        console.log(`   ❌ ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('🔚 Suche abgeschlossen');
}

finalHessenBuildingsSearch().catch(console.error);
