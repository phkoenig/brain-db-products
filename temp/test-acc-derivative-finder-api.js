// Test ACCDerivativeFinder Module via API
// Tests the manifest querying functionality through the Next.js API

const fetch = require('node-fetch');

async function testACCDerivativeFinderAPI() {
  console.log('🧪 Testing ACCDerivativeFinder Module via API...\n');

  // Test data from your ACC project
  const projectId = 'b.e4a2d0c3-1ca2-4a10-b381-f184c303a1c1';
  const itemId = 'urn:adsk.wipemea:dm.lineage:1lB5mmb8TIuIvyBHLXDDDQ';
  
  try {
    console.log('📋 Test Parameters:');
    console.log(`Project ID: ${projectId}`);
    console.log(`Item ID: ${itemId}\n`);

    // Call the APS Viewer Token API (which now uses ACCDerivativeFinder)
    console.log('🔍 Calling APS Viewer Token API...');
    const response = await fetch('http://localhost:3000/api/aps/viewer-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: projectId,
        fileId: itemId
      })
    });

    const data = await response.json();
    
    console.log('\n📊 API Response:');
    console.log('===============');
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Success!');
      if (data.acc_derivative_finder_used) {
        console.log('🎯 ACCDerivativeFinder was used successfully!');
      }
      if (data.derivative_type) {
        console.log(`📁 Found derivative type: ${data.derivative_type}`);
      }
      if (data.message) {
        console.log(`💬 Message: ${data.message}`);
      }
    } else {
      console.log('\n❌ API Error:');
      console.log(`Error: ${data.error}`);
      if (data.details) {
        console.log(`Details: ${data.details}`);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testACCDerivativeFinderAPI();
