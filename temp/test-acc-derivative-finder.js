// Test ACCDerivativeFinder Module
// Tests the manifest querying functionality

// Mock fetch for Node.js environment
const fetch = require('node-fetch');

// Import the ACCDerivativeFinder class
const { ACCDerivativeFinder } = require('../src/lib/acc-derivative-finder.ts');

async function testACCDerivativeFinder() {
  console.log('🧪 Testing ACCDerivativeFinder Module...\n');

  // Test data from your ACC project
  const projectId = 'b.e4a2d0c3-1ca2-4a10-b381-f184c303a1c1';
  const itemId = 'urn:adsk.wipemea:dm.lineage:1lB5mmb8TIuIvyBHLXDDDQ';
  
  // Mock token (you'll need to replace this with a real token)
  const mockToken = 'your_mock_token_here';

  try {
    console.log('📋 Test Parameters:');
    console.log(`Project ID: ${projectId}`);
    console.log(`Item ID: ${itemId}`);
    console.log(`Token: ${mockToken.substring(0, 20)}...\n`);

    // Create instance
    const derivativeFinder = new ACCDerivativeFinder(mockToken);
    
    // Test the findDerivatives method
    console.log('🔍 Calling findDerivatives...');
    const result = await derivativeFinder.findDerivatives(projectId, itemId);
    
    console.log('\n📊 Results:');
    console.log('===========');
    console.log(`Is Translated: ${result.isTranslated}`);
    console.log(`Status: ${result.status}`);
    console.log(`Original URN: ${result.originalUrn}`);
    console.log(`Manifest URL: ${result.manifestUrl}`);
    
    if (result.bestViewingDerivative) {
      console.log('\n🎯 Best Viewing Derivative:');
      console.log(`  URN: ${result.bestViewingDerivative.urn}`);
      console.log(`  Type: ${result.bestViewingDerivative.type}`);
      console.log(`  Status: ${result.bestViewingDerivative.status}`);
      console.log(`  Progress: ${result.bestViewingDerivative.progress || 'N/A'}`);
    }
    
    if (result.derivatives && result.derivatives.length > 0) {
      console.log('\n📁 All Derivatives Found:');
      result.derivatives.forEach((derivative, index) => {
        console.log(`  ${index + 1}. ${derivative.type} (${derivative.status})`);
        console.log(`     URN: ${derivative.urn}`);
        console.log(`     Progress: ${derivative.progress || 'N/A'}`);
      });
    } else {
      console.log('\n❌ No derivatives found');
    }
    
    if (result.error) {
      console.log(`\n❌ Error: ${result.error}`);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testACCDerivativeFinder();
