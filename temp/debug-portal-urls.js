const axios = require('axios');

// Portal-URLs analysieren um echte WFS-URLs zu finden
const portalUrls = [
  {
    name: 'Rheinland-Pfalz Portal',
    url: 'https://www.geoportal.rlp.de/spatial-objects/519?service=WFS&request=GetCapabilities',
    expected: 'Portal-Seite mit WFS-Link'
  },
  {
    name: 'Sachsen-Anhalt Metaver Portal 1',
    url: 'https://metaver.de/trefferanzeige?docuuid=410EFCD9-37D9-4D6D-B7A3-09FCCEC9321C',
    expected: 'Metaver-Seite mit WFS-Link'
  },
  {
    name: 'Sachsen-Anhalt Metaver Portal 2',
    url: 'https://metaver.de/trefferanzeige?docuuid=DE9B25EE-8D28-4D54-9E2C-DB4493F3A5AA',
    expected: 'Metaver-Seite mit WFS-Link'
  }
];

async function analyzePortalURL(url, name) {
  console.log(`\n🔍 Analysiere Portal: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   ✅ HTTP Status: ${response.status}`);
    console.log(`   📄 Content-Type: ${response.headers['content-type'] || 'N/A'}`);
    console.log(`   📏 Content-Length: ${response.data.length} Zeichen`);
    
    const content = response.data;
    
    // Suche nach WFS-URLs im Content
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
    
    // Entferne Duplikate
    foundUrls = [...new Set(foundUrls)];
    
    if (foundUrls.length > 0) {
      console.log(`   🔗 Gefundene WFS-URLs:`);
      foundUrls.forEach((url, index) => {
        console.log(`      ${index + 1}. ${url}`);
      });
    } else {
      console.log(`   ❌ Keine WFS-URLs gefunden`);
      
      // Zeige ersten 500 Zeichen des Contents für Debugging
      console.log(`   📄 Content-Preview (erste 500 Zeichen):`);
      console.log(`      ${content.substring(0, 500).replace(/\n/g, '\\n')}...`);
    }
    
    return {
      success: true,
      foundUrls,
      contentType: response.headers['content-type']
    };
    
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`);
    if (error.response) {
      console.log(`      HTTP Status: ${error.response.status}`);
      console.log(`      Content-Type: ${error.response.headers['content-type'] || 'N/A'}`);
    }
    return { success: false, error: error.message };
  }
}

async function runPortalAnalysis() {
  console.log('🚀 Starte Portal-URL Analyse für WFS-Links');
  console.log('=====================================');
  
  const results = [];
  
  for (const portal of portalUrls) {
    const result = await analyzePortalURL(portal.url, portal.name);
    results.push({
      ...portal,
      result
    });
  }
  
  // Zusammenfassung
  console.log('\n📊 PORTAL-ANALYSE ZUSAMMENFASSUNG:');
  console.log('=====================================');
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Erfolgreich analysiert: ${successful.length}/${results.length}`);
  console.log(`❌ Fehlgeschlagen: ${failed.length}/${results.length}`);
  
  // Sammle alle gefundenen WFS-URLs
  const allWfsUrls = [];
  successful.forEach(result => {
    if (result.result.foundUrls && result.result.foundUrls.length > 0) {
      allWfsUrls.push(...result.result.foundUrls);
    }
  });
  
  if (allWfsUrls.length > 0) {
    console.log(`\n🔗 GEFUNDENE WFS-URLS (${allWfsUrls.length}):`);
    allWfsUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
  } else {
    console.log(`\n❌ Keine WFS-URLs in den Portalen gefunden`);
  }
  
  console.log('\n🏁 Portal-Analyse abgeschlossen');
}

// Analyse ausführen
runPortalAnalysis().catch(console.error);
