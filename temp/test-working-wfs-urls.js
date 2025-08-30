const axios = require('axios');

// Teste funktionierende WFS-URLs aus der Datenbank
const testUrls = [
  {
    name: 'WFS MV ALKIS SimpleFeature (139 Layer)',
    url: 'https://www.geodaten-mv.de/dienste/alkis_wfs_sf',
    expected: 'XML Response'
  },
  {
    name: 'INSPIRE-WFS MV Verkehrsnetz (40 Layer)',
    url: 'https://www.geodaten-mv.de/dienste/inspire_tn_atkis_bdlm_download',
    expected: 'XML Response'
  },
  {
    name: 'ALKIS Flurstücke Berlin (17 Layer)',
    url: 'https://gdi.berlin.de/services/wfs/alkis?REQUEST=GetCapabilities&SERVICE=WFS',
    expected: 'XML Response'
  },
  {
    name: 'INSPIRE-WFS Brandenburg (25 Layer)',
    url: 'https://inspire.brandenburg.de/services/strassennetz_wfs?service=WFS&request=GetCapabilities&version=2.0.0',
    expected: 'XML Response'
  }
];

async function testWFSURL(url, name) {
  console.log(`\n🔍 Teste: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'WFS-Test-Client/1.0'
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'N/A'}`);
    
    const content = response.data;
    const contentType = response.headers['content-type'] || '';
    
    // Prüfe ob es WFS XML ist
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      if (content.includes('<WFS_Capabilities') || content.includes('<wfs:WFS_Capabilities')) {
        console.log(`   ✅ WFS GetCapabilities XML erkannt!`);
        
        // Zähle Layer
        const layerMatches = content.match(/<FeatureType>/g) || [];
        console.log(`   📊 Gefundene Layer: ${layerMatches.length}`);
        
        return { success: true, layerCount: layerMatches.length };
      } else {
        console.log(`   ⚠️ XML aber kein WFS GetCapabilities`);
        return { success: false, error: 'Kein WFS XML' };
      }
    } else {
      console.log(`   ❌ Kein XML-Response: ${contentType}`);
      return { success: false, error: 'Kein XML' };
    }
    
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Teste funktionierende WFS-URLs aus der Datenbank...\n');
  
  let successCount = 0;
  let totalLayers = 0;
  
  for (const test of testUrls) {
    const result = await testWFSURL(test.url, test.name);
    if (result.success) {
      successCount++;
      totalLayers += result.layerCount;
    }
  }
  
  console.log(`\n📊 Zusammenfassung:`);
  console.log(`   ✅ Erfolgreich: ${successCount}/${testUrls.length} URLs`);
  console.log(`   📊 Gesamte Layer: ${totalLayers}`);
  
  if (successCount === testUrls.length) {
    console.log(`   🎉 Alle URLs funktionieren noch!`);
  } else {
    console.log(`   ⚠️ Einige URLs haben Probleme`);
  }
  
  console.log('\n🏁 Tests abgeschlossen');
}

runTests().catch(console.error);
