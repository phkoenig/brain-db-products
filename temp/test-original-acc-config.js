/**
 * Test für die Original ACC-Konfiguration
 * Testet die funktionierende ACC-Implementierung aus dem Urprojekt
 */

const BASE_URL = 'http://localhost:3000';

async function testOriginalACCConfig() {
  console.log('🧪 Testing Original ACC Configuration...\n');
  
  try {
    // 1. Test: OAuth Token Status
    console.log('1️⃣ Testing: OAuth Token Status');
    
    // Test OAuth URL generation first
    const oauthUrlResponse = await fetch(`${BASE_URL}/api/auth/acc-authorize-url`);
    
    if (oauthUrlResponse.ok) {
      const oauthData = await oauthUrlResponse.json();
      console.log('✅ OAuth URL generation works');
      console.log(`   OAuth URL: ${oauthData.url.substring(0, 100)}...`);
    } else {
      console.log('❌ OAuth URL generation failed');
    }
    
    // 2. Test: ACC Projects API (Original Implementation)
    console.log('\n2️⃣ Testing: ACC Projects API (Original Implementation)');
    const projectsResponse = await fetch(`${BASE_URL}/api/acc/projects`);
    
    console.log(`   Response status: ${projectsResponse.status}`);
    console.log(`   Response headers:`, Object.fromEntries(projectsResponse.headers.entries()));
    
    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      console.log(`   Error response: ${errorText}`);
      throw new Error(`ACC Projects API failed: ${projectsResponse.status} - ${errorText}`);
    }
    
    const projectsData = await projectsResponse.json();
    console.log('✅ ACC Projects API successful');
    console.log(`   Found ${projectsData.data?.length || 0} projects`);
    
    if (projectsData.data && projectsData.data.length > 0) {
      console.log('   Projects:');
      projectsData.data.forEach((project, index) => {
        console.log(`     ${index + 1}. ${project.name} (ID: ${project.id})`);
      });
      
      // 3. Test: Project Contents API (Original Implementation)
      console.log('\n3️⃣ Testing: Project Contents API (Original Implementation)');
      const firstProject = projectsData.data[0];
      const contentsResponse = await fetch(`${BASE_URL}/api/acc/projects/${firstProject.id}/contents`);
      
      console.log(`   Response status: ${contentsResponse.status}`);
      
      if (!contentsResponse.ok) {
        const errorText = await contentsResponse.text();
        console.log(`   Error response: ${errorText}`);
        throw new Error(`Project Contents API failed: ${contentsResponse.status} - ${errorText}`);
      }
      
      const contentsData = await contentsResponse.json();
      console.log('✅ Project Contents API successful');
      console.log(`   Found ${contentsData.data?.length || 0} top-level folders`);
      
      if (contentsData.data && contentsData.data.length > 0) {
        console.log('   Top-level folders:');
        contentsData.data.forEach((folder, index) => {
          console.log(`     ${index + 1}. ${folder.attributes?.displayName || folder.attributes?.name} (${folder.type})`);
        });
        
        // 4. Test: Find Project Files folder
        console.log('\n4️⃣ Testing: Find Project Files Folder');
        const projectFilesFolder = contentsData.data.find(folder => 
          folder.attributes?.displayName === 'Project Files' || 
          folder.attributes?.name === 'Project Files'
        );
        
        if (projectFilesFolder) {
          console.log('✅ Project Files folder found');
          console.log(`   Folder ID: ${projectFilesFolder.id}`);
          console.log(`   Folder Name: ${projectFilesFolder.attributes?.displayName || projectFilesFolder.attributes?.name}`);
          
          // 5. Test: Folder Contents API (Original Implementation)
          console.log('\n5️⃣ Testing: Folder Contents API (Original Implementation)');
          const folderContentsResponse = await fetch(`${BASE_URL}/api/acc/projects/${firstProject.id}/folders/${projectFilesFolder.id}/contents`);
          
          console.log(`   Response status: ${folderContentsResponse.status}`);
          
          if (!folderContentsResponse.ok) {
            const errorText = await folderContentsResponse.text();
            console.log(`   Error response: ${errorText}`);
            throw new Error(`Folder Contents API failed: ${folderContentsResponse.status} - ${errorText}`);
          }
          
          const folderContentsData = await folderContentsResponse.json();
          console.log('✅ Folder Contents API successful');
          console.log(`   Found ${folderContentsData.data?.length || 0} items in Project Files folder`);
          
          if (folderContentsData.data && folderContentsData.data.length > 0) {
            console.log('   Items in Project Files:');
            folderContentsData.data.forEach((item, index) => {
              console.log(`     ${index + 1}. ${item.attributes?.displayName || item.attributes?.name} (${item.type})`);
            });
            
            // 6. Test: Find 3D model files
            console.log('\n6️⃣ Testing: Find 3D Model Files');
            const modelFiles = folderContentsData.data.filter(item => 
              item.type === 'items' && 
              (item.attributes?.extension?.type?.includes('Revit') || 
               item.attributes?.extension?.type?.includes('IFC') ||
               item.attributes?.name?.toLowerCase().includes('.rvt') ||
               item.attributes?.name?.toLowerCase().includes('.ifc'))
            );
            
            console.log(`   Found ${modelFiles.length} 3D model files`);
            
            if (modelFiles.length > 0) {
              console.log('   Model files:');
              modelFiles.forEach((file, index) => {
                console.log(`     ${index + 1}. ${file.attributes.name} (${file.attributes.extension?.type})`);
              });
            }
          }
          
        } else {
          console.log('⚠️ Project Files folder not found');
        }
      }
    }
    
    console.log('\n🎉 Original ACC Configuration Test completed successfully!');
    console.log('   The original ACC implementation is working correctly.');
    
  } catch (error) {
    console.error('❌ Original ACC Configuration Test failed:', error);
    console.error('   Error details:', error.message);
    
    // Additional debugging
    console.log('\n🔍 Additional Debugging Information:');
    
    try {
      // Test: Check if server is running
      console.log('\n7️⃣ Testing: Server Status');
      const healthResponse = await fetch(`${BASE_URL}/`);
      
      if (healthResponse.ok) {
        console.log('✅ Server is running');
      } else {
        console.log('❌ Server is not responding properly');
      }
      
    } catch (serverError) {
      console.log('❌ Server test failed:', serverError.message);
    }
  }
}

// Test ausführen
testOriginalACCConfig();
