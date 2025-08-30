const axios = require('axios');

// Neue Gebäudeumriss-WFS-URLs aus der Liste
const newBuildingUrls = [
  {
    name: 'Baden-Württemberg Gebäudeumrisse',
    url: 'https://www.geoportal-bw.de/geodienste/INSPIRE/Building?service=WFS&request=GetCapabilities',
    bundesland: 'Baden-Württemberg',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Berlin Gebäudeumrisse',
    url: 'https://fbinter.stadt-berlin.de/fb/berlin/service.jsp?id=re_hausumringe@senstadt&type=WFS&themeType=spatial',
    bundesland: 'Berlin',
    expected: 'Portal-Link'
  },
  {
    name: 'Brandenburg Gebäudeumrisse',
    url: 'https://geoportal.brandenburg.de/gs-json/xml?fileid=919ca8dc-a153-47e0-81f9-479dea978338',
    bundesland: 'Brandenburg',
    expected: 'Portal-Link'
  },
  {
    name: 'Bremen Gebäudeumrisse',
    url: 'https://geodienste.bremen.de/wfs_alkis_hausumringe?REQUEST=GetCapabilities&SERVICE=WFS',
    bundesland: 'Bremen',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Hamburg Gebäudeumrisse',
    url: 'https://geoinfo.hamburg.de/INSPIRE/Buildings_WFS?service=WFS&request=GetCapabilities',
    bundesland: 'Hamburg',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Hessen Gebäudeumrisse',
    url: 'https://www.geoportal.hessen.de/mapbender/php/wfs.php?INSPIRE=1&FEATURETYPE_ID=5580&REQUEST=GetCapabilities&SERVICE=WFS',
    bundesland: 'Hessen',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Mecklenburg-Vorpommern Gebäudeumrisse',
    url: 'https://www.geoportal-mv.de/inspire/buildings/wfs?service=WFS&request=GetCapabilities',
    bundesland: 'Mecklenburg-Vorpommern',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Niedersachsen Gebäudeumrisse',
    url: 'https://opendata.lgln.niedersachsen.de/doorman/noauth/verwaltungsgrenzen_wfs?REQUEST=GetCapabilities&SERVICE=WFS',
    bundesland: 'Niedersachsen',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Nordrhein-Westfalen Gebäudeumrisse',
    url: 'https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht?REQUEST=GetCapabilities&SERVICE=WFS',
    bundesland: 'Nordrhein-Westfalen',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Rheinland-Pfalz Gebäudeumrisse',
    url: 'https://www.geoportal.rlp.de/spatial-objects/519?service=WFS&request=GetCapabilities',
    bundesland: 'Rheinland-Pfalz',
    expected: 'Portal-Link'
  },
  {
    name: 'Saarland Gebäudeumrisse',
    url: 'https://geoportal.saarland.de/WFS_SA_BUILDINGS?service=WFS&request=GetCapabilities',
    bundesland: 'Saarland',
    expected: 'Echte WFS-URL'
  },
  {
    name: 'Sachsen-Anhalt Gebäudeumrisse',
    url: 'https://metaver.de/trefferanzeige?docuuid=1C649F0E-5369-4E7C-A699-55577C2226BC',
    bundesland: 'Sachsen-Anhalt',
    expected: 'Portal-Link'
  }
];

async function testBuildingURL(url, name, bundesland) {
  console.log(`\n🔍 Teste: ${name}`);
  console.log(`   Bundesland: ${bundesland}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'N/A'}`);
    
    const content = response.data;
    const contentType = response.headers['content-type'] || '';
    
    // Prüfe ob es WFS XML ist (echte WFS-URL)
    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      if (content.includes('<WFS_Capabilities') || content.includes('<wfs:WFS_Capabilities')) {
        console.log(`   ✅ ECHTE WFS-URL - WFS GetCapabilities XML erkannt!`);
        
        // Zähle Layer
        const layerMatches = content.match(/<FeatureType>/g) || [];
        console.log(`   📊 Gefundene Layer: ${layerMatches.length}`);
        
        return { 
          type: 'wfs', 
          success: true, 
          layerCount: layerMatches.length,
          url: url 
        };
      } else {
        console.log(`   ⚠️ XML aber kein WFS GetCapabilities`);
        return { type: 'unknown', success: false, error: 'Kein WFS XML', url: url };
      }
    }
    
    // Prüfe ob es HTML ist (Portal-Link)
    if (contentType.includes('text/html')) {
      console.log(`   🔍 PORTAL-LINK - HTML-Response erkannt`);
      
      // Suche nach WFS-URLs im HTML
      const wfsUrlPatterns = [
        /https?:\/\/[^"'\s]+wfs[^"'\s]*/gi,
        /https?:\/\/[^"'\s]+GetCapabilities[^"'\s]*/gi,
        /https?:\/\/[^"'\s]+service=WFS[^"'\s]*/gi
      ];
      
      let foundUrls = [];
      wfsUrlPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          foundUrls.push(...matches);
        }
      });
      
      // Bereinige URLs
      foundUrls = foundUrls.map(url => 
        url.replace(/&amp;/g, '&')
           .replace(/<\/?[^>]+(>|$)/g, '')
           .replace(/['"]/g, '')
      );
      
      // Entferne Duplikate
      foundUrls = [...new Set(foundUrls)];
      
      if (foundUrls.length > 0) {
        console.log(`   ✅ ${foundUrls.length} WFS-URLs im HTML gefunden:`);
        foundUrls.forEach((url, index) => {
          console.log(`      ${index + 1}. ${url}`);
        });
        return { 
          type: 'portal', 
          success: true, 
          foundUrls: foundUrls,
          originalUrl: url 
        };
      } else {
        console.log(`   ❌ Keine WFS-URLs im HTML gefunden`);
        return { type: 'portal', success: false, error: 'Keine WFS-URLs gefunden', url: url };
      }
    }
    
    // Prüfe ob es JSON ist
    if (contentType.includes('application/json')) {
      console.log(`   📄 JSON-Response erkannt`);
      return { type: 'json', success: false, error: 'JSON-Response', url: url };
    }
    
    console.log(`   ❓ Unbekannter Content-Type: ${contentType}`);
    return { type: 'unknown', success: false, error: 'Unbekannter Content-Type', url: url };
    
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`);
    return { type: 'error', success: false, error: error.message, url: url };
  }
}

async function runTests() {
  console.log('🚀 Teste neue Gebäudeumriss-WFS-URLs...\n');
  
  const results = {
    wfs: [],
    portal: [],
    error: [],
    unknown: []
  };
  
  for (const test of newBuildingUrls) {
    const result = await testBuildingURL(test.url, test.name, test.bundesland);
    
    if (result.success) {
      if (result.type === 'wfs') {
        results.wfs.push(result);
      } else if (result.type === 'portal') {
        results.portal.push(result);
      }
    } else {
      if (result.type === 'error') {
        results.error.push(result);
      } else {
        results.unknown.push(result);
      }
    }
  }
  
  console.log(`\n📊 Zusammenfassung:`);
  console.log(`   ✅ Echte WFS-URLs: ${results.wfs.length}`);
  console.log(`   🔍 Portal-Links: ${results.portal.length}`);
  console.log(`   ❌ Fehler: ${results.error.length}`);
  console.log(`   ❓ Unbekannt: ${results.unknown.length}`);
  
  if (results.wfs.length > 0) {
    console.log(`\n✅ Echte WFS-URLs (können direkt in DB):`);
    results.wfs.forEach(result => {
      console.log(`   - ${result.url} (${result.layerCount} Layer)`);
    });
  }
  
  if (results.portal.length > 0) {
    console.log(`\n🔍 Portal-Links (müssen extrahiert werden):`);
    results.portal.forEach(result => {
      console.log(`   - ${result.originalUrl}`);
      console.log(`     Gefundene URLs: ${result.foundUrls.join(', ')}`);
    });
  }
  
  console.log('\n🏁 Tests abgeschlossen');
}

runTests().catch(console.error);
