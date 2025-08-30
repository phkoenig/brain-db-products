const { WFSCapabilitiesParser } = require('../src/lib/wfs-parser.js');

/**
 * Option 1: Suche nach ALKIS-basierten Gebäude-Services für Hessen
 * Option 2: Prüfe ob bestehende Services Gebäude-Layer enthalten
 */
async function hessenAlkisGebaeudeSearch() {
  console.log('🔍 HESSEN ALKIS GEBÄUDE-SUCHE (Option 1 & 2)...\n');
  
  const parser = new WFSCapabilitiesParser();

  // ===========================================
  // OPTION 1: Suche nach ALKIS-Gebäude-Services
  // ===========================================
  console.log('📋 OPTION 1: ALKIS-Gebäude-Service-URLs testen...\n');
  
  const alkisGebaeudeUrls = [
    // Muster basierend auf bekannten Hessen UUIDs mit ALKIS-Gebäude-Varianten
    'https://inspire-hessen.de/ows/services/org.2.alkis-gebaeude_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    'https://inspire-hessen.de/ows/services/org.2.gebaeude-alkis_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    
    // UUID-Varianten mit Gebäude-Bezug (ähnlich zu bestehenden Mustern)
    'https://inspire-hessen.de/ows/services/org.2.753259a3-2469-4a16-a8a6-f1a02b897b0d_gebaeude_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    'https://inspire-hessen.de/ows/services/org.2.2d55ae0b-b221-4f74-bd9d-fe957aa4df37_gebaeude_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    
    // Mögliche separate Gebäude-UUIDs
    'https://inspire-hessen.de/ows/services/org.2.buildings-2d-alkis_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    'https://inspire-hessen.de/ows/services/org.2.he-buildings_wfs?service=WFS&request=GetCapabilities&version=2.0.0'
  ];

  for (const url of alkisGebaeudeUrls) {
    const serviceName = url.match(/org\.2\.([^?]+)/)[1];
    console.log(`🧪 Teste: ${serviceName}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BRAIN-DB-WFS-Client/1.0' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const xmlContent = await response.text();
        
        if (xmlContent.includes('WFS_Capabilities')) {
          console.log(`   ✅ WFS Capabilities gefunden!`);
          
          const result = parser.parse(xmlContent, url);
          if (result && result.layers && result.layers.length > 0) {
            console.log(`   🎯 ${result.layers.length} Layer gefunden:`);
            
            const buildingLayers = result.layers.filter(layer => 
              layer.name.toLowerCase().includes('building') ||
              layer.name.toLowerCase().includes('gebäude') ||
              layer.name.toLowerCase().includes('bu-') ||
              layer.title?.toLowerCase().includes('gebäude')
            );
            
            if (buildingLayers.length > 0) {
              console.log(`   🏢 GEBÄUDE-LAYER GEFUNDEN!`);
              buildingLayers.forEach(layer => {
                console.log(`      - ${layer.name}: ${layer.title || 'Kein Titel'}`);
              });
              console.log(`   🌐 ERFOLGREICHE URL: ${url}`);
              return { success: true, url, layers: buildingLayers };
            }
          }
        }
      } else {
        console.log(`   ❌ ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${error.name === 'AbortError' ? 'Timeout' : error.message}`);
    }
  }

  // ===========================================
  // OPTION 2: Prüfe bestehende Services auf versteckte Gebäude-Layer
  // ===========================================
  console.log('\n📋 OPTION 2: Bestehende Hessen-Services auf Gebäude-Layer prüfen...\n');
  
  const existingServices = [
    {
      name: 'INSPIRE-WFS HE Flurstücke/Grundstücke ALKIS',
      url: 'https://inspire-hessen.de/ows/services/org.2.753259a3-2469-4a16-a8a6-f1a02b897b0d_wfs?service=WFS&request=GetCapabilities&version=2.0.0'
    },
    {
      name: 'INSPIRE-WFS HE Adressen Hauskoordinaten', 
      url: 'https://inspire-hessen.de/ows/services/org.2.2d55ae0b-b221-4f74-bd9d-fe957aa4df37_wfs?service=WFS&request=GetCapabilities&version=2.0.0'
    },
    {
      name: 'INSPIRE-WFS HE Verkehrsnetze ATKIS Basis-DLM',
      url: 'https://inspire-hessen.de/ows/services/org.2.714e13b9-506c-4313-abfd-d90de88fc155_wfs?service=WFS&request=GetCapabilities&version=2.0.0'
    }
  ];

  for (const service of existingServices) {
    console.log(`🔍 Analysiere: ${service.name}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BRAIN-DB-WFS-Client/1.0' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const xmlContent = await response.text();
        const result = parser.parse(xmlContent, service.url);
        
        if (result && result.layers) {
          console.log(`   📋 ${result.layers.length} Layer total`);
          
          // Suche nach Gebäude-bezogenen Layern
          const buildingLayers = result.layers.filter(layer => {
            const searchText = `${layer.name} ${layer.title || ''} ${layer.abstract || ''}`.toLowerCase();
            return searchText.includes('building') || 
                   searchText.includes('gebäude') || 
                   searchText.includes('bu-') ||
                   searchText.includes('bldg:') ||
                   searchText.includes('hausumr') ||
                   layer.name.includes('AX_Gebaeude');
          });
          
          if (buildingLayers.length > 0) {
            console.log(`   🏢 VERSTECKTE GEBÄUDE-LAYER GEFUNDEN!`);
            buildingLayers.forEach(layer => {
              console.log(`      - ${layer.name}: ${layer.title || layer.abstract || 'Kein Titel'}`);
            });
            return { success: true, service: service.name, layers: buildingLayers };
          } else {
            console.log(`   ❌ Keine Gebäude-Layer gefunden`);
            // Zeige erste 3 Layer als Beispiel
            result.layers.slice(0, 3).forEach(layer => {
              console.log(`      - ${layer.name}`);
            });
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ${error.name === 'AbortError' ? 'Timeout' : error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🔚 Hessen ALKIS Gebäude-Suche abgeschlossen');
  return { success: false };
}

hessenAlkisGebaeudeSearch().catch(console.error);
