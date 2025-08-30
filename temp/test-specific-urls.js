const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { WFSCapabilitiesParser } = require('../src/lib/wfs-parser.js');

// Dotenv-Konfiguration
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Teste spezifische URLs einzeln
 */
async function testSpecificURLs() {
  console.log('🧪 Teste spezifische URLs einzeln...\n');

  const testUrls = [
    {
      id: '4e5aa8bb-c9a2-45f1-beb1-93a3795e7c8e',
      url: 'https://fbinter.stadt-berlin.de/fb/berlin/service.jsp?id=re_hausumringe@senstadt&type=WFS&themeType=spatial',
      bundesland: 'Berlin'
    },
    {
      id: '4213c206-203b-4a6f-8763-3aac08fccfa0', 
      url: 'https://geoinfo.hamburg.de/INSPIRE/Buildings_WFS?service=WFS&request=GetCapabilities',
      bundesland: 'Hamburg'
    },
    {
      id: '9d68c61d-92c7-4ee4-a1c9-aa47ab70dfed',
      url: 'https://www.geoportal-mv.de/inspire/buildings/wfs?service=WFS&request=GetCapabilities',
      bundesland: 'Mecklenburg-Vorpommern'
    },
    {
      id: '573b748a-20c3-45eb-a366-0dab490b24ba',
      url: 'https://geoportal.saarland.de/WFS_SA_BUILDINGS?service=WFS&request=GetCapabilities',
      bundesland: 'Saarland'
    }
  ];

  const parser = new WFSCapabilitiesParser();

  for (const testUrl of testUrls) {
    console.log(`\n🔍 Teste ${testUrl.bundesland}: ${testUrl.url}`);
    
    try {
      // Timeout für HTTP-Request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(testUrl.url, {
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
      
      // Parse mit unserem Parser
      const result = parser.parse(xmlContent, testUrl.url);
      
      if (result && result.layers && result.layers.length > 0) {
        console.log(`   🎯 ${result.layers.length} Layer gefunden:`);
        result.layers.forEach((layer, i) => {
          console.log(`      ${i+1}. ${layer.name} - ${layer.title || 'Kein Titel'}`);
          if (layer.keywords && layer.keywords.length > 0) {
            console.log(`         Keywords: ${layer.keywords.join(', ')}`);
          }
          if (layer.smartCategory) {
            console.log(`         Kategorie: ${layer.smartCategory}`);
          }
        });
      } else {
        console.log('   ⚠️  Keine Layer gefunden oder Parser-Fehler');
        console.log('   Debug: XML-Anfang:', xmlContent.substring(0, 200));
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('   ⏰ Timeout nach 10 Sekunden');
      } else {
        console.log(`   ❌ Fehler: ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ Test abgeschlossen!');
}

// Führe den Test aus
testSpecificURLs().catch(console.error);
