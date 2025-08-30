/**
 * Suche im INSPIRE Hessen Katalog nach Buildings Services
 */
async function searchHessenInspireCatalog() {
  console.log('🔍 Suche INSPIRE Hessen Katalog nach Buildings...\n');

  // Basis-URL für INSPIRE Hessen Services
  const baseUrl = 'https://inspire-hessen.de/ows/services/';
  
  // Bekannte UUIDs von Hessen:
  // Flurstücke: org.2.753259a3-2469-4a16-a8a6-f1a02b897b0d_wfs
  // Adressen:   org.2.2d55ae0b-b221-4f74-bd9d-fe957aa4df37_wfs
  
  // Teste mögliche Buildings UUIDs (häufige Muster):
  const possibleUUIDs = [
    // Häufige Building-Service UUIDs in INSPIRE:
    'org.2.buildings-2d_wfs',
    'org.2.buildings_wfs', 
    'org.2.gebaeude_wfs',
    'org.2.inspire-buildings_wfs',
    'org.2.bu-alkis_wfs',
    'org.2.bu-core2d_wfs',
    // Mögliche UUID-Varianten (ähnlich zu bestehenden):
    'org.2.714e13b9-506c-4313-abfd-d90de88fc155_wfs', // Verkehr (deaktiviert)
    'org.2.buildings-alkis_wfs'
  ];

  for (const uuid of possibleUUIDs) {
    const url = `${baseUrl}${uuid}?service=WFS&request=GetCapabilities&version=2.0.0`;
    console.log(`🧪 Teste: ${uuid}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BRAIN-DB-WFS-Client/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const content = await response.text();
        if (content.includes('WFS_Capabilities')) {
          console.log(`   ✅ GEFUNDEN! Status: ${response.status}`);
          console.log(`   📋 Content-Length: ${content.length} Zeichen`);
          
          // Suche nach Buildings-Layern
          const buildingMatches = content.match(/(bu-core|Building|Gebäude)/gi) || [];
          if (buildingMatches.length > 0) {
            console.log(`   🏢 Building-Layer gefunden: ${buildingMatches.slice(0, 5).join(', ')}`);
            console.log(`   🌐 VOLLSTÄNDIGE URL: ${url}`);
            return url; // Erfolg!
          }
        }
      } else {
        console.log(`   ❌ Status: ${response.status}`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('   ⏰ Timeout');
      } else {
        console.log(`   ❌ Fehler: ${error.message}`);
      }
    }
  }
  
  console.log('\n❌ Keine funktionierende INSPIRE Buildings URL für Hessen gefunden');
  return null;
}

searchHessenInspireCatalog().catch(console.error);
