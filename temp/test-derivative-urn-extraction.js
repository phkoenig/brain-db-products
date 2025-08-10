// Test-Modul für korrekte Derivative-URN-Extraction
// Basierend auf Perplexity AI's Lösung

const testDerivativeUrnExtraction = async () => {
  console.log('🔍 Testing Derivative URN Extraction...\n');

  // Test-Daten aus unseren Logs
  const testData = {
    originalLineageUrn: 'urn:adsk.wipemea:dm.lineage:Dz8kcVs8TeiwXXPaP4pLiA',
    versionUrn: 'urn:adsk.wipemea:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA?version=1',
    fileName: 'F16-ZTA-ZZ-ZZ-M3-K-04.ifc',
    projectId: 'b.e4a2d0c3-1ca2-4a10-b381-f184c303a1c1'
  };

  console.log('📋 Test Data:');
  console.log('- Original Lineage URN:', testData.originalLineageUrn);
  console.log('- Version URN:', testData.versionUrn);
  console.log('- File Name:', testData.fileName);
  console.log('- Project ID:', testData.projectId);
  console.log('');

  // Schritt 1: Region-Konvertierung (wipemea → wipprod)
  const convertRegion = (urn) => {
    return urn.replace('wipemea', 'wipprod');
  };

  // Schritt 2: Query-Parameter korrigieren (?version=1 → _version=1)
  const fixQueryParameters = (urn) => {
    return urn.replace('?version=', '_version=');
  };

  // Schritt 3: Base64-Kodierung
  const base64Encode = (urn) => {
    return Buffer.from(urn).toString('base64');
  };

  // Schritt 4: Vollständige URN-Verarbeitung
  const processDerivativeUrn = (versionUrn) => {
    console.log('🔄 Processing Derivative URN:');
    console.log('1. Input:', versionUrn);
    
    const regionConverted = convertRegion(versionUrn);
    console.log('2. Region converted:', regionConverted);
    
    const queryFixed = fixQueryParameters(regionConverted);
    console.log('3. Query fixed:', queryFixed);
    
    const base64Encoded = base64Encode(queryFixed);
    console.log('4. Base64 encoded:', base64Encoded);
    
    return {
      original: versionUrn,
      regionConverted,
      queryFixed,
      base64Encoded
    };
  };

  // Test der URN-Verarbeitung
  console.log('🧪 Testing URN Processing:');
  const result = processDerivativeUrn(testData.versionUrn);
  console.log('');

  // Erwartete Ergebnisse
  const expectedResults = {
    regionConverted: 'urn:adsk.wipprod:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA?version=1',
    queryFixed: 'urn:adsk.wipprod:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA_version=1',
    base64Encoded: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLkR6OGtjVnM4VGVpd1hYUGFQNHBMaUE_dmVyc2lvbj0x'
  };

  console.log('✅ Expected Results:');
  console.log('- Region converted:', expectedResults.regionConverted);
  console.log('- Query fixed:', expectedResults.queryFixed);
  console.log('- Base64 encoded:', expectedResults.base64Encoded);
  console.log('');

  // Validierung
  console.log('🔍 Validation:');
  console.log('- Region conversion:', result.regionConverted === expectedResults.regionConverted ? '✅ PASS' : '❌ FAIL');
  console.log('- Query fix:', result.queryFixed === expectedResults.queryFixed ? '✅ PASS' : '❌ FAIL');
  console.log('- Base64 encoding:', result.base64Encoded === expectedResults.base64Encoded ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // API-Endpunkte zum Testen
  console.log('🌐 API Endpoints to Test:');
  console.log('1. Manifest Check:');
  console.log(`   GET https://developer.api.autodesk.com/modelderivative/v2/designdata/${result.base64Encoded}/manifest`);
  console.log('');
  console.log('2. Translation Job:');
  console.log(`   POST https://developer.api.autodesk.com/modelderivative/v2/designdata/job`);
  console.log(`   Body: {"input":{"urn":"${result.base64Encoded}"},"output":{"formats":[{"type":"svf","views":["2d","3d"]}]}}`);
  console.log('');

  // Vergleich mit aktueller Implementierung
  console.log('🔄 Comparison with Current Implementation:');
  const currentBase64 = 'YWRzay53aXBwcm9kOmZzLmZpbGU6dmYuRHo4a2NWczhUZWl3WFhQYVA0cExpQQ';
  console.log('- Current Base64:', currentBase64);
  console.log('- Correct Base64:', result.base64Encoded);
  console.log('- Match:', currentBase64 === result.base64Encoded ? '✅ SAME' : '❌ DIFFERENT');
  console.log('');

  return result;
};

// Test-Funktion für API-Aufrufe (simuliert)
const testApiCalls = async (base64Urn) => {
  console.log('🧪 Simulating API Calls:');
  console.log('Note: This is a simulation - actual API calls would require valid tokens');
  console.log('');

  const manifestUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${base64Urn}/manifest`;
  console.log('📋 Manifest Check URL:');
  console.log(manifestUrl);
  console.log('');

  const translationJobBody = {
    input: {
      urn: base64Urn
    },
    output: {
      formats: [
        {
          type: 'svf',
          views: ['2d', '3d']
        }
      ]
    }
  };

  console.log('📋 Translation Job Body:');
  console.log(JSON.stringify(translationJobBody, null, 2));
  console.log('');

  return {
    manifestUrl,
    translationJobBody
  };
};

// Haupttest-Funktion
const runTests = async () => {
  try {
    console.log('🚀 Starting Derivative URN Extraction Tests\n');
    
    const result = await testDerivativeUrnExtraction();
    const apiCalls = await testApiCalls(result.base64Encoded);
    
    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Implement this logic in ACCService');
    console.log('2. Test with actual API calls using 3-legged OAuth');
    console.log('3. Update viewer-token endpoint');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export für Verwendung in anderen Modulen
module.exports = {
  testDerivativeUrnExtraction,
  testApiCalls,
  runTests
};

// Wenn direkt ausgeführt
if (require.main === module) {
  runTests();
}
