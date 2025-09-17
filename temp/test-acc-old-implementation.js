/**
 * Test für die alte ACC-Implementierung
 * Testet die funktionierende ACC-Seite auf Funktionalität
 */

const BASE_URL = 'http://localhost:3000';

async function testACCOldImplementation() {
  console.log('🧪 Testing ACC Old Implementation...\n');
  
  try {
    // 1. Test: Projekte laden
    console.log('1️⃣ Testing: Load Projects');
    const projectsResponse = await fetch(`${BASE_URL}/api/acc/projects`);
    
    if (!projectsResponse.ok) {
      throw new Error(`Projects API failed: ${projectsResponse.status}`);
    }
    
    const projectsData = await projectsResponse.json();
    console.log('✅ Projects loaded successfully');
    console.log(`   Found ${projectsData.data?.length || 0} projects`);
    
    if (projectsData.data && projectsData.data.length > 0) {
      const firstProject = projectsData.data[0];
      console.log(`   First project: ${firstProject.name} (ID: ${firstProject.id})`);
      
      // 2. Test: Projekt-Inhalte laden
      console.log('\n2️⃣ Testing: Load Project Contents');
      const contentsResponse = await fetch(`${BASE_URL}/api/acc/projects/${firstProject.id}/contents`);
      
      if (!contentsResponse.ok) {
        throw new Error(`Project contents API failed: ${contentsResponse.status}`);
      }
      
      const contentsData = await contentsResponse.json();
      console.log('✅ Project contents loaded successfully');
      console.log(`   Found ${contentsData.data?.length || 0} top-level folders`);
      
      // 3. Test: "Project Files" Ordner finden
      console.log('\n3️⃣ Testing: Find Project Files Folder');
      const projectFilesFolder = contentsData.data?.find(folder => 
        folder.attributes?.displayName === 'Project Files' || 
        folder.attributes?.name === 'Project Files'
      );
      
      if (projectFilesFolder) {
        console.log('✅ Project Files folder found');
        console.log(`   Folder ID: ${projectFilesFolder.id}`);
        console.log(`   Folder Name: ${projectFilesFolder.attributes?.displayName || projectFilesFolder.attributes?.name}`);
        
        // 4. Test: Ordner-Inhalte laden
        console.log('\n4️⃣ Testing: Load Folder Contents');
        const folderContentsResponse = await fetch(`${BASE_URL}/api/acc/projects/${firstProject.id}/folders/${projectFilesFolder.id}/contents`);
        
        if (!folderContentsResponse.ok) {
          throw new Error(`Folder contents API failed: ${folderContentsResponse.status}`);
        }
        
        const folderContentsData = await folderContentsResponse.json();
        console.log('✅ Folder contents loaded successfully');
        console.log(`   Found ${folderContentsData.data?.length || 0} items in Project Files folder`);
        
        // 5. Test: 3D-Modell-Dateien finden
        console.log('\n5️⃣ Testing: Find 3D Model Files');
        const modelFiles = folderContentsData.data?.filter(item => 
          item.type === 'items' && 
          (item.attributes?.extension?.type?.includes('Revit') || 
           item.attributes?.extension?.type?.includes('IFC') ||
           item.attributes?.name?.toLowerCase().includes('.rvt') ||
           item.attributes?.name?.toLowerCase().includes('.ifc'))
        ) || [];
        
        console.log(`   Found ${modelFiles.length} 3D model files`);
        
        if (modelFiles.length > 0) {
          const newestFile = modelFiles.sort((a, b) => 
            new Date(b.attributes.lastModifiedTime).getTime() - new Date(a.attributes.lastModifiedTime).getTime()
          )[0];
          
          console.log('✅ Newest 3D model file found:');
          console.log(`   Name: ${newestFile.attributes.name}`);
          console.log(`   Type: ${newestFile.attributes.extension?.type}`);
          console.log(`   Last Modified: ${newestFile.attributes.lastModifiedTime}`);
          console.log(`   ID: ${newestFile.id}`);
          
          // 6. Test: URN generieren
          console.log('\n6️⃣ Testing: Generate URN');
          const urn = `urn:adsk.wipprod:dm.lineage:${newestFile.id}`;
          console.log(`   Generated URN: ${urn}`);
          
          // 7. Test: Base64 URN generieren
          console.log('\n7️⃣ Testing: Generate Base64 URN');
          const base64Urn = Buffer.from(urn).toString('base64');
          console.log(`   Base64 URN: ${base64Urn}`);
          
        } else {
          console.log('⚠️ No 3D model files found in Project Files folder');
        }
        
      } else {
        console.log('⚠️ Project Files folder not found');
        console.log('   Available folders:');
        contentsData.data?.forEach(folder => {
          console.log(`     - ${folder.attributes?.displayName || folder.attributes?.name} (${folder.type})`);
        });
      }
      
    } else {
      console.log('⚠️ No projects found');
    }
    
    console.log('\n🎉 ACC Old Implementation Test completed successfully!');
    
  } catch (error) {
    console.error('❌ ACC Old Implementation Test failed:', error);
    console.error('   Error details:', error.message);
  }
}

// Test ausführen
testACCOldImplementation();
