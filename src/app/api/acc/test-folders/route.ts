import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function GET(request: NextRequest) {
  console.log('🔍 === ACC FOLDERS TEST API STARTED ===');
  
  // Projekt-ID aus Query-Parameter holen
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({
      success: false,
      error: 'Project ID is required. Use ?projectId=...',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
  
  try {
    console.log('🔍 DEBUG: Original Project ID from Project API:', projectId);
    console.log('🔍 DEBUG: Project ID length:', projectId.length);
    console.log('🔍 DEBUG: Project ID format check:', {
      hasB: projectId.startsWith('b.'),
      hasUrn: projectId.startsWith('urn:'),
      hasDashes: projectId.includes('-'),
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)
    });
    
    // Test 1: Root-Folder-Inhalte abrufen
    console.log('📁 Test 1: Root-Folder-Inhalte abrufen...');
    console.log('🔍 Verwendete Projekt-ID:', projectId);
    
    // Test nur die korrekten Projekt-ID-Formate für Data Management API
    const testFormats = [
      { name: 'Original', id: projectId },
      { name: 'With b. prefix', id: `b.${projectId}` },
      { name: 'Without b. prefix', id: projectId.replace(/^b\./, '') }
    ];
    
    let successfulFormat = null;
    let lastError = null;
    
    let rootContents = null;
    
    for (const format of testFormats) {
      console.log(`\n🔍 Testing format: ${format.name} - ${format.id}`);
      
      try {
        rootContents = await ACCService.getProjectContents(format.id, 'root');
        console.log(`✅ SUCCESS with format: ${format.name}!`);
        successfulFormat = format;
        break;
      } catch (error) {
        console.log(`❌ FAILED with format: ${format.name}:`, error);
        lastError = error;
      }
    }
    
    if (!successfulFormat || !rootContents) {
      console.error('❌ All project ID formats failed');
      return NextResponse.json({
        success: false,
        error: `All project ID formats failed. Last error: ${lastError}`,
        timestamp: new Date().toISOString(),
        debug: {
          originalProjectId: projectId,
          testedFormats: testFormats.map(f => ({ name: f.name, id: f.id }))
        }
      }, { status: 500 });
    }
    
    console.log('✅ Root-Folder-Inhalte erfolgreich abgerufen!');
    console.log('📁 Ordner:', rootContents.folders.length);
    console.log('📄 Dateien:', rootContents.items.length);
    
    // Test 2: TopFolders abrufen (falls verfügbar)
    console.log('\n📁 Test 2: TopFolders abrufen...');
    let topFolders = null;
    try {
      const token = await ACCService.getToken();
      const dataManagementUrl = 'https://developer.api.autodesk.com/data/v1';
      const formattedProjectId = successfulFormat.id;
      
      const topFoldersUrl = `${dataManagementUrl}/projects/${formattedProjectId}/topFolders`;
      console.log('🔍 TopFolders URL:', topFoldersUrl);
      
      const response = await fetch(topFoldersUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        topFolders = await response.json();
        console.log('✅ TopFolders erfolgreich abgerufen!');
      } else {
        console.log('⚠️ TopFolders nicht verfügbar:', response.status);
      }
    } catch (error) {
      console.log('⚠️ TopFolders Test fehlgeschlagen:', error);
    }
    
    // Test 3: Ersten Ordner-Inhalt abrufen (falls vorhanden)
    console.log('\n📁 Test 3: Ersten Ordner-Inhalt abrufen...');
    let firstFolderContents = null;
    if (rootContents.folders.length > 0) {
      const firstFolder = rootContents.folders[0];
      console.log('🔍 Erster Ordner:', firstFolder);
      
      try {
        const folderContents = await ACCService.getProjectContents(successfulFormat.id, firstFolder.id);
        firstFolderContents = folderContents;
        console.log('✅ Erster Ordner-Inhalt erfolgreich abgerufen!');
        console.log('📁 Unterordner:', folderContents.folders.length);
        console.log('📄 Dateien:', folderContents.items.length);
      } catch (error) {
        console.log('⚠️ Erster Ordner-Inhalt Test fehlgeschlagen:', error);
      }
    }
    
    // Test 4: Viewer-kompatible Dateien identifizieren
    console.log('\n🔍 Test 4: Viewer-kompatible Dateien identifizieren...');
    const viewerCompatibleFiles = rootContents.items.filter((item: any) => {
      const extension = item.attributes?.extension?.toLowerCase();
      return ['rvt', 'dwg', 'ifc', 'nwd', 'nwc', '3ds', 'obj', 'fbx'].includes(extension);
    });
    
    console.log('✅ Viewer-kompatible Dateien gefunden:', viewerCompatibleFiles.length);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      debug: {
        successfulFormat: successfulFormat,
        originalProjectId: projectId
      },
      tests: {
        rootContents: {
          folders: rootContents.folders.length,
          items: rootContents.items.length,
          data: rootContents
        },
        topFolders: topFolders ? {
          available: true,
          data: topFolders
        } : {
          available: false
        },
        firstFolderContents: firstFolderContents ? {
          available: true,
          folders: firstFolderContents.folders.length,
          items: firstFolderContents.items.length,
          data: firstFolderContents
        } : {
          available: false
        },
        viewerCompatibleFiles: {
          count: viewerCompatibleFiles.length,
          files: viewerCompatibleFiles.map((file: any) => ({
            id: file.id,
            name: file.attributes?.displayName,
            extension: file.attributes?.extension,
            size: file.attributes?.size
          }))
        }
      }
    });
    
  } catch (error) {
    console.error('❌ ACC Folders Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
