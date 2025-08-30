const { WFSCapabilitiesParser } = require('../src/lib/wfs-parser.js');

/**
 * Teste neue Berlin WFS-URLs
 */
async function testBerlinURLs() {
  console.log('🧪 Teste neue Berlin WFS-URLs...\n');

  const testUrls = [
    'https://gdi.berlin.de/services/wfs/alkis_gebaude?REQUEST=GetCapabilities&SERVICE=WFS',
    'https://gdi.berlin.de/services/wfs/alkis_flurstuecke?REQUEST=GetCapabilities&SERVICE=WFS'
  ];

  const parser = new WFSCapabilitiesParser();

  for (const url of testUrls) {
    console.log(`🔍 Teste: ${url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BRAIN-DB-WFS-Client/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const xmlContent = await response.text();
      console.log(`   ✅ Response erhalten (${xmlContent.length} Zeichen)`);
      
      // Prüfe ob es XML ist
      if (xmlContent.trim().startsWith('<?xml') || xmlContent.includes('<WFS_Capabilities')) {
        console.log('   ✅ Gültiges XML erhalten');
        
        const result = parser.parse(xmlContent, url);
        
        if (result && result.layers && result.layers.length > 0) {
          console.log(`   🎯 ${result.layers.length} Layer gefunden:`);
          result.layers.forEach((layer, i) => {
            console.log(`      ${i+1}. ${layer.name} - ${layer.title || 'Kein Titel'}`);
          });
        } else {
          console.log('   ⚠️  Parser konnte keine Layer extrahieren');
        }
      } else {
        console.log('   ❌ HTML statt XML erhalten');
        console.log('   Debug:', xmlContent.substring(0, 200));
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('   ⏰ Timeout nach 10 Sekunden');
      } else {
        console.log(`   ❌ Fehler: ${error.message}`);
      }
    }
    
    console.log(''); // Leerzeile
  }
}

testBerlinURLs().catch(console.error);
