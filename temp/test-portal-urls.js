const axios = require('axios');

// Teste einige URLs aus der Datenbank
const testUrls = [
  {
    name: 'WFS RP ALKIS Vereinfacht',
    url: 'https://www.geoportal.rlp.de/registry/wfs/519',
    expected: 'Portal-Link'
  },
  {
    name: 'INSPIRE-WFS HE Hydro',
    url: 'https://www.geoportal.hessen.de/registry/wfs/719',
    expected: 'Portal-Link'
  },
  {
    name: 'INSPIRE-WFS BW Hydro',
    url: 'https://metadaten.geoportal-bw.de/geonetwork/srv/ger/catalog.search',
    expected: 'Portal-Link'
  },
  {
    name: 'WFS TH ALKIS Vereinfacht',
    url: 'https://www.geoproxy.geoportal-th.de/geoproxy/services/adv_alkis_wfs',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'INSPIRE-WFS Saarland Gebäude',
    url: 'https://geoportal.saarland.de/mapbender/php/wfs.php?INSPIRE=1&FEATURETYPE_ID=1971&REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0',
    expected: 'Echte WFS-URL'
  }
];

async function testURL(url, name) {
  console.log(`\n🔍 Teste: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'N/A'}`);
    
    const content = response.data;
    const contentType = response.headers['content-type'] || '';
    
    // Prüfe ob es XML ist (echte WFS-URL)
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      console.log(`   🎯 Ergebnis: ECHTE WFS-URL (XML-Response)`);
      if (content.includes('<WFS_Capabilities') || content.includes('<wfs:WFS_Capabilities')) {
        console.log(`   ✅ WFS GetCapabilities XML erkannt!`);
      } else {
        console.log(`   ⚠️ XML aber kein WFS GetCapabilities`);
      }
      return 'wfs';
    }
    
    // Prüfe ob es HTML ist (Portal-Link)
    if (contentType.includes('text/html')) {
      console.log(`   🎯 Ergebnis: PORTAL-LINK (HTML-Response)`);
      if (content.includes('wfs') || content.includes('GetCapabilities')) {
        console.log(`   🔍 WFS-URLs im HTML gefunden`);
      } else {
        console.log(`   ❌ Keine WFS-URLs im HTML`);
      }
      return 'portal';
    }
    
    // Prüfe ob es JSON ist
    if (contentType.includes('application/json')) {
      console.log(`   🎯 Ergebnis: JSON-Response`);
      return 'json';
    }
    
    console.log(`   ❓ Unbekannter Content-Type: ${contentType}`);
    return 'unknown';
    
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`);
    return 'error';
  }
}

async function runTests() {
  console.log('🚀 Teste URLs aus der Datenbank...\n');
  
  for (const test of testUrls) {
    await testURL(test.url, test.name);
  }
  
  console.log('\n🏁 Tests abgeschlossen');
}

runTests().catch(console.error);
