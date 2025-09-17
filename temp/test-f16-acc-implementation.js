/**
 * Test für die F16 ACC-Implementierung
 * Testet die F16-spezifische ACC-Integration mit Debugging
 */

const BASE_URL = 'http://localhost:3000';

async function testF16ACCImplementation() {
  console.log('🧪 Testing F16 ACC Implementation...\n');
  
  try {
    // 1. Test: F16 BIM Model API
    console.log('1️⃣ Testing: F16 BIM Model API');
    const f16Response = await fetch(`${BASE_URL}/api/zepta/f16/bim-model`);
    
    console.log(`   Response status: ${f16Response.status}`);
    console.log(`   Response headers:`, Object.fromEntries(f16Response.headers.entries()));
    
    if (!f16Response.ok) {
      const errorText = await f16Response.text();
      console.log(`   Error response: ${errorText}`);
      throw new Error(`F16 BIM Model API failed: ${f16Response.status} - ${errorText}`);
    }
    
    const f16Data = await f16Response.json();
    console.log('✅ F16 BIM Model API successful');
    console.log(`   Response data:`, JSON.stringify(f16Data, null, 2));
    
    if (f16Data.file) {
      console.log('✅ BIM Model file found:');
      console.log(`   Name: ${f16Data.file.attributes?.name}`);
      console.log(`   Type: ${f16Data.file.attributes?.extension?.type}`);
      console.log(`   URN: ${f16Data.urn}`);
      console.log(`   Token available: ${f16Data.token ? 'Yes' : 'No'}`);
    }
    
  } catch (error) {
    console.error('❌ F16 ACC Implementation Test failed:', error);
    console.error('   Error details:', error.message);
    
    // Zusätzliche Debugging-Informationen
    console.log('\n🔍 Additional Debugging Information:');
    
    try {
      // Test: ACC OAuth Service
      console.log('\n2️⃣ Testing: ACC OAuth Service');
      const oauthResponse = await fetch(`${BASE_URL}/api/auth/acc-authorize-url`);
      
      if (oauthResponse.ok) {
        const oauthData = await oauthResponse.json();
        console.log('✅ OAuth URL generated successfully');
        console.log(`   OAuth URL: ${oauthData.url}`);
      } else {
        console.log(`❌ OAuth URL generation failed: ${oauthResponse.status}`);
      }
      
    } catch (oauthError) {
      console.log(`❌ OAuth test failed: ${oauthError.message}`);
    }
    
    try {
      // Test: ACC Projects API (alte Implementierung)
      console.log('\n3️⃣ Testing: ACC Projects API (Old Implementation)');
      const projectsResponse = await fetch(`${BASE_URL}/api/acc/projects`);
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('✅ Projects API working');
        console.log(`   Found ${projectsData.data?.length || 0} projects`);
        
        if (projectsData.data && projectsData.data.length > 0) {
          const f16Project = projectsData.data.find(p => 
            p.name.includes('F16') || p.name.includes('Fontaneallee')
          );
          
          if (f16Project) {
            console.log(`✅ F16 Project found: ${f16Project.name} (ID: ${f16Project.id})`);
          } else {
            console.log('⚠️ F16 Project not found in projects list');
            console.log('   Available projects:');
            projectsData.data.forEach(project => {
              console.log(`     - ${project.name} (ID: ${project.id})`);
            });
          }
        }
      } else {
        console.log(`❌ Projects API failed: ${projectsResponse.status}`);
      }
      
    } catch (projectsError) {
      console.log(`❌ Projects test failed: ${projectsError.message}`);
    }
  }
}

// Test ausführen
testF16ACCImplementation();
