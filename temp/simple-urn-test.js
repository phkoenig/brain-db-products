console.log('🧪 Simple URN Test Starting...\n');

// Test data from our logs
const testUrn = 'urn:adsk.wipemea:fs.file:vf.Dz8kcVs8TeiwXXPaP4pLiA?version=1';
console.log('Input URN:', testUrn);

// Step 1: Convert region (wipemea -> wipprod)
const regionConverted = testUrn.replace('wipemea', 'wipprod');
console.log('Region converted:', regionConverted);

// Step 2: Fix query parameters (?version=1 -> _version=1)
const queryFixed = regionConverted.replace('?version=', '_version=');
console.log('Query parameters fixed:', queryFixed);

// Step 3: Base64 encode
const base64Encoded = Buffer.from(queryFixed).toString('base64');
console.log('Base64 encoded:', base64Encoded);

// Expected result from Perplexity
const expected = 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLkR6OGtjVnM4VGVpd1hYUGFQNHBMaUFfdmVyc2lvbj0x';
console.log('Expected:', expected);

// Compare
if (base64Encoded === expected) {
  console.log('✅ SUCCESS: URN processing works correctly!');
} else {
  console.log('❌ FAIL: URN processing failed!');
  console.log('Difference:', base64Encoded.length, 'vs', expected.length);
}

console.log('\n🎉 Test completed!');
