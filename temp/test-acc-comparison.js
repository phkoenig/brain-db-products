/**
 * Vergleichstest: Original ACC vs F16 ACC Implementation
 * Testet beide Implementierungen und vergleicht die Ergebnisse
 */

const BASE_URL = 'http://localhost:3000';

async function testACCComparison() {
  console.log('🧪 Testing ACC Implementation Comparison...\n');
  
  const results = {
    original: { success: false, error: null, data: null },
    f16: { success: false, error: null, data: null }
  };
  
  try {
    // 1. Test: Original ACC Implementation
    console.log('1️⃣ Testing: Original ACC Implementation');
    console.log('   Testing: /api/acc/projects');
    
    try {
      const originalResponse = await fetch(`${BASE_URL}/api/acc/projects`);
      
      if (originalResponse.ok) {
        const originalData = await originalResponse.json();
        results.original.success = true;
        results.original.data = originalData;
        console.log('✅ Original ACC: Projects loaded successfully');
        console.log(`   Found ${originalData.data?.length || 0} projects`);
        
        if (originalData.data && originalData.data.length > 0) {
          console.log('   Projects:');
          originalData.data.forEach((project, index) => {
            console.log(`     ${index + 1}. ${project.name} (ID: ${project.id})`);
          });
        }
      } else {
        const errorText = await originalResponse.text();
        results.original.error = `HTTP ${originalResponse.status}: ${errorText}`;
        console.log(`❌ Original ACC: Failed with ${originalResponse.status}`);
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      results.original.error = error.message;
      console.log(`❌ Original ACC: Exception - ${error.message}`);
    }
    
    // 2. Test: F16 ACC Implementation
    console.log('\n2️⃣ Testing: F16 ACC Implementation');
    console.log('   Testing: /api/zepta/f16/bim-model');
    
    try {
      const f16Response = await fetch(`${BASE_URL}/api/zepta/f16/bim-model`);
      
      if (f16Response.ok) {
        const f16Data = await f16Response.json();
        results.f16.success = true;
        results.f16.data = f16Data;
        console.log('✅ F16 ACC: BIM model loaded successfully');
        console.log(`   File: ${f16Data.file?.attributes?.name || 'Unknown'}`);
        console.log(`   URN: ${f16Data.urn || 'Unknown'}`);
        console.log(`   Token available: ${f16Data.token ? 'Yes' : 'No'}`);
      } else {
        const errorText = await f16Response.text();
        results.f16.error = `HTTP ${f16Response.status}: ${errorText}`;
        console.log(`❌ F16 ACC: Failed with ${f16Response.status}`);
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      results.f16.error = error.message;
      console.log(`❌ F16 ACC: Exception - ${error.message}`);
    }
    
    // 3. Comparison Analysis
    console.log('\n3️⃣ Comparison Analysis');
    console.log('='.repeat(50));
    
    if (results.original.success && results.f16.success) {
      console.log('✅ Both implementations are working!');
      console.log('   Original ACC: Can load projects');
      console.log('   F16 ACC: Can load BIM model');
    } else if (results.original.success && !results.f16.success) {
      console.log('⚠️ Only Original ACC is working');
      console.log('   Original ACC: ✅ Working');
      console.log(`   F16 ACC: ❌ ${results.f16.error}`);
      console.log('\n   Possible issues with F16 implementation:');
      console.log('   - Different token handling');
      console.log('   - Different API endpoints');
      console.log('   - Different error handling');
    } else if (!results.original.success && results.f16.success) {
      console.log('⚠️ Only F16 ACC is working');
      console.log(`   Original ACC: ❌ ${results.original.error}`);
      console.log('   F16 ACC: ✅ Working');
    } else {
      console.log('❌ Both implementations are failing');
      console.log(`   Original ACC: ❌ ${results.original.error}`);
      console.log(`   F16 ACC: ❌ ${results.f16.error}`);
      console.log('\n   Possible root causes:');
      console.log('   - OAuth authentication issues');
      console.log('   - Server configuration problems');
      console.log('   - Network connectivity issues');
    }
    
    // 4. Detailed Error Analysis
    if (!results.original.success || !results.f16.success) {
      console.log('\n4️⃣ Detailed Error Analysis');
      console.log('='.repeat(50));
      
      if (!results.original.success) {
        console.log('Original ACC Error Analysis:');
        console.log(`   Error: ${results.original.error}`);
        
        if (results.original.error.includes('401') || results.original.error.includes('403')) {
          console.log('   → Authentication/Authorization issue');
          console.log('   → Check OAuth token validity');
        } else if (results.original.error.includes('404')) {
          console.log('   → API endpoint not found');
          console.log('   → Check API route configuration');
        } else if (results.original.error.includes('500')) {
          console.log('   → Server-side error');
          console.log('   → Check server logs for details');
        }
      }
      
      if (!results.f16.success) {
        console.log('F16 ACC Error Analysis:');
        console.log(`   Error: ${results.f16.error}`);
        
        if (results.f16.error.includes('401') || results.f16.error.includes('403')) {
          console.log('   → Authentication/Authorization issue');
          console.log('   → Check OAuth token validity');
        } else if (results.f16.error.includes('404')) {
          console.log('   → API endpoint not found');
          console.log('   → Check API route configuration');
        } else if (results.f16.error.includes('500')) {
          console.log('   → Server-side error');
          console.log('   → Check server logs for details');
        }
      }
    }
    
    console.log('\n🎉 ACC Comparison Test completed!');
    
  } catch (error) {
    console.error('❌ ACC Comparison Test failed:', error);
    console.error('   Error details:', error.message);
  }
}

// Test ausführen
testACCComparison();
