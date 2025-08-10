/**
 * Test Script for URN Processor Module (JavaScript version)
 * Run with: node temp/test-urn-processor.js
 */

// Simple URN Processor implementation for testing
class UrnProcessor {
  static processDerivativeUrn(accUrn) {
    console.log(`🔍 URN Processor: Processing ACC URN: ${accUrn}`);
    
    // Step 1: Convert region (wipemea -> wipprod)
    const regionConverted = this.convertRegion(accUrn);
    console.log(`🔍 URN Processor: Region converted: ${regionConverted}`);
    
    // Step 2: Fix query parameters (?version=1 -> _version=1)
    const queryFixed = this.fixQueryParameters(regionConverted);
    console.log(`🔍 URN Processor: Query parameters fixed: ${queryFixed}`);
    
    // Step 3: Base64 encode
    const base64Encoded = this.base64Encode(queryFixed);
    console.log(`🔍 URN Processor: Base64 encoded: ${base64Encoded}`);
    
    return base64Encoded;
  }

  static convertRegion(urn) {
    return urn.replace('wipemea', 'wipprod');
  }

  static fixQueryParameters(urn) {
    return urn.replace('?version=', '_version=');
  }

  static base64Encode(urn) {
    return Buffer.from(urn).toString('base64');
  }

  static validateUrn(urn) {
    const validPatterns = [
      /^urn:adsk\.wipprod:fs\.file:vf\..*_version=\d+$/,
      /^urn:adsk\.wipprod:fs\.file:vf\..*$/
    ];
    
    return validPatterns.some(pattern => pattern.test(urn));
  }
}

async function testUrnProcessor() {
  console.log('🧪 Testing URN Processor Module...\n');

  // Test data from our logs
  const testCases = [
    {
      name: 'ACC Version URN with query',
      input: 'urn:adsk.wipemea:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA?version=1',
      expected: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLkR6OGtjVnM4VGVpd1hYUGFQNHBMaUFfdmVyc2lvbj0x'
    },
    {
      name: 'ACC Version URN without query',
      input: 'urn:adsk.wipemea:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA',
      expected: 'YWRzay53aXBwcm9kOmZzLmZpbGU6dmYuRHo4a2NWczhUZWl3WFhQYVA0cExpQQ'
    }
  ];

  console.log('📋 Test Cases:');
  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}`);
    console.log(`   Input: ${testCase.input}`);
    console.log(`   Expected: ${testCase.expected}\n`);
  });

  console.log('🔍 Running Tests:\n');

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`   Input: ${testCase.input}`);
    
    try {
      const result = UrnProcessor.processDerivativeUrn(testCase.input);
      console.log(`   Result: ${result}`);
      
      if (result === testCase.expected) {
        console.log(`   ✅ PASS\n`);
        passedTests++;
      } else {
        console.log(`   ❌ FAIL - Expected: ${testCase.expected}\n`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}\n`);
    }
  }

  // Additional validation tests
  console.log('🔍 Validation Tests:\n');
  
  const validationTests = [
    {
      name: 'Valid URN with version',
      urn: 'urn:adsk.wipprod:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA_version=1',
      shouldBeValid: true
    },
    {
      name: 'Valid URN without version',
      urn: 'urn:adsk.wipprod:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA',
      shouldBeValid: true
    },
    {
      name: 'Invalid URN (lineage)',
      urn: 'urn:adsk.wipprod:dm.lineage:Dz8kcVs8TeiwXXPaP4pLiA',
      shouldBeValid: false
    }
  ];

  for (const test of validationTests) {
    const isValid = UrnProcessor.validateUrn(test.urn);
    const status = isValid === test.shouldBeValid ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.name}: ${test.urn}`);
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! URN Processor is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the test
testUrnProcessor().catch(console.error);
