const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

// WFS-Parser aus unserem Projekt
const { WFSCapabilitiesParser } = require('../src/lib/wfs-parser.js');

// Echte WFS-URLs aus der Portal-Analyse
const realWfsUrls = [
  {
    name: 'Sachsen-Anhalt ALKIS OpenData WFS',
    url: 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_ALKIS_WFS_OpenData/guest',
    land: 'Sachsen-Anhalt',
    expected: 'Flurstücke verfügbar'
  },
  {
    name: 'Sachsen-Anhalt INSPIRE ALKIS CP WFS',
    url: 'https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_CP_WFS',
    land: 'Sachsen-Anhalt',
    expected: 'Flurstücke verfügbar'
  }
];

async function testRealWFSURL(url, name, land) {
  console.log(`\n🔍 Teste: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Land: ${land}`);
  
  try {
    // HTTP Request mit verschiedenen WFS-Versionen
    const versions = ['2.0.0', '1.1.0', '1.0.0'];
    let response = null;
    let workingVersion = null;
    
    for (const version of versions) {
      try {
        const testUrl = `${url}?SERVICE=WFS&VERSION=${version}&REQUEST=GetCapabilities`;
        console.log(`   🔄 Teste Version ${version}...`);
        
        response = await axios.get(testUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'WFS-Test-Client/1.0'
          }
        });
        
        if (response.status === 200) {
          workingVersion = version;
          console.log(`   ✅ Version ${version} funktioniert!`);
          break;
        }
      } catch (versionError) {
        console.log(`   ❌ Version ${version} fehlgeschlagen: ${versionError.message}`);
      }
    }
    
    if (!response || response.status !== 200) {
      console.log(`   ❌ Keine funktionierende WFS-Version gefunden`);
      return { success: false, error: 'Keine funktionierende WFS-Version' };
    }
    
    // XML parsen
    const xmlContent = response.data;
    console.log(`   📄 XML-Response erhalten (${xmlContent.length} Zeichen)`);
    
    // WFS-Parser verwenden
    const parser = new WFSCapabilitiesParser();
    const result = parser.parse(xmlContent);
    
    if (!result || !result.success) {
      console.log(`   ❌ WFS-Parser konnte XML nicht verarbeiten: ${result?.error || 'Unbekannter Fehler'}`);
      return { success: false, error: 'Parser-Fehler' };
    }
    
    // Layer extrahieren
    const layers = result.layers || [];
    console.log(`   📋 Gefunden: ${layers.length} Layer`);
    
    // Service-Metadaten extrahieren
    const serviceInfo = result.service || {};
    
    console.log(`   🔧 Service-Metadaten:`);
    console.log(`      - Titel: ${serviceInfo.title || 'N/A'}`);
    console.log(`      - WFS-Versionen: ${serviceInfo.versions ? serviceInfo.versions.join(', ') : 'N/A'}`);
    console.log(`      - Output-Formate: ${serviceInfo.outputFormats ? serviceInfo.outputFormats.join(', ') : 'N/A'}`);
    console.log(`      - INSPIRE-konform: ${serviceInfo.isInspire ? 'Ja' : 'Nein'}`);
    
    // Layer-Details anzeigen
    if (layers.length > 0) {
      console.log(`   📋 Layer-Details:`);
      layers.slice(0, 5).forEach((layer, index) => {
        console.log(`      ${index + 1}. ${layer.name || 'Unbekannt'} - ${layer.title || 'Kein Titel'}`);
      });
      if (layers.length > 5) {
        console.log(`      ... und ${layers.length - 5} weitere Layer`);
      }
    }
    
    return {
      success: true,
      layers: layers.length,
      serviceInfo,
      workingVersion
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

async function runRealTests() {
  console.log('🚀 Starte Tests mit echten WFS-URLs für Sachsen-Anhalt');
  console.log('=====================================');
  
  const results = [];
  
  for (const test of realWfsUrls) {
    const result = await testRealWFSURL(test.url, test.name, test.land);
    results.push({
      ...test,
      result
    });
  }
  
  // Zusammenfassung
  console.log('\n📊 TEST-ZUSAMMENFASSUNG:');
  console.log('=====================================');
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Erfolgreich: ${successful.length}/${results.length}`);
  console.log(`❌ Fehlgeschlagen: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ ERFOLGREICHE TESTS:');
    successful.forEach(test => {
      console.log(`   - ${test.name}: ${test.result.layers} Layer gefunden`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FEHLGESCHLAGENE TESTS:');
    failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.result.error}`);
    });
  }
  
  console.log('\n🏁 Tests abgeschlossen');
}

// Test ausführen
runRealTests().catch(console.error);
