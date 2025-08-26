/**
 * Test-Skript für den WFS-URL-Validator
 */

const WFSURLValidator = require('./wfs-url-validator');

async function testURLValidator() {
  console.log('🧪 Teste WFS-URL-Validator...\n');

  const validator = new WFSURLValidator();

  // Test 1: Gültige WFS-URL
  console.log('📋 Test 1: Gültige WFS-URL');
  const validURL = 'https://inspire.brandenburg.de/services/cp_alkis_wfs?request=GetCapabilities&service=WFS';
  const result1 = await validator.validateWFSURL(validURL);
  
  console.log('   Ergebnisse:');
  console.log(`   - URL-Syntax: ${result1.url_syntax_valid ? '✅' : '❌'}`);
  console.log(`   - Server erreichbar: ${result1.server_reachable ? '✅' : '❌'}`);
  console.log(`   - XML-Response: ${result1.xml_response_valid ? '✅' : '❌'}`);
  console.log(`   - Gesamt gültig: ${result1.overall_valid ? '✅' : '❌'}`);
  console.log(`   - Notizen: ${result1.validation_notes.join(', ')}\n`);

  // Reset für nächsten Test
  validator.reset();

  // Test 2: Ungültige URL-Syntax
  console.log('📋 Test 2: Ungültige URL-Syntax');
  const invalidURL = 'not-a-valid-url';
  const result2 = await validator.validateWFSURL(invalidURL);
  
  console.log('   Ergebnisse:');
  console.log(`   - URL-Syntax: ${result2.url_syntax_valid ? '✅' : '❌'}`);
  console.log(`   - Server erreichbar: ${result2.server_reachable ? '✅' : '❌'}`);
  console.log(`   - XML-Response: ${result2.xml_response_valid ? '✅' : '❌'}`);
  console.log(`   - Gesamt gültig: ${result2.overall_valid ? '✅' : '❌'}`);
  console.log(`   - Notizen: ${result2.validation_notes.join(', ')}\n`);

  // Reset für nächsten Test
  validator.reset();

  // Test 3: URL ohne WFS-Parameter
  console.log('📋 Test 3: URL ohne WFS-Parameter');
  const noWFSURL = 'https://example.com/api';
  const result3 = await validator.validateWFSURL(noWFSURL);
  
  console.log('   Ergebnisse:');
  console.log(`   - URL-Syntax: ${result3.url_syntax_valid ? '✅' : '❌'}`);
  console.log(`   - Server erreichbar: ${result3.server_reachable ? '✅' : '❌'}`);
  console.log(`   - XML-Response: ${result3.xml_response_valid ? '✅' : '❌'}`);
  console.log(`   - Gesamt gültig: ${result3.overall_valid ? '✅' : '❌'}`);
  console.log(`   - Notizen: ${result3.validation_notes.join(', ')}\n`);

  // Reset für nächsten Test
  validator.reset();

  // Test 4: Nicht existierende Domain
  console.log('📋 Test 4: Nicht existierende Domain');
  const nonExistentURL = 'https://this-domain-does-not-exist-12345.com/wfs?request=GetCapabilities&service=WFS';
  const result4 = await validator.validateWFSURL(nonExistentURL);
  
  console.log('   Ergebnisse:');
  console.log(`   - URL-Syntax: ${result4.url_syntax_valid ? '✅' : '❌'}`);
  console.log(`   - Server erreichbar: ${result4.server_reachable ? '✅' : '❌'}`);
  console.log(`   - XML-Response: ${result4.xml_response_valid ? '✅' : '❌'}`);
  console.log(`   - Gesamt gültig: ${result4.overall_valid ? '✅' : '❌'}`);
  console.log(`   - Notizen: ${result4.validation_notes.join(', ')}\n`);

  console.log('🎉 WFS-URL-Validator Tests abgeschlossen!');
}

// Führe Tests aus
if (require.main === module) {
  testURLValidator().catch(console.error);
}

module.exports = testURLValidator;
