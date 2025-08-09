import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function GET(request: NextRequest) {
  console.log('🔍 === ACC FIND CORRECT PROJECT ID API STARTED ===');
  
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
    
    // Strategie 1: Versuche direkt mit der Project API Projekt-ID
    console.log('\n📋 Strategie 1: Direkte Project API ID verwenden...');
    
    const token = await ACCService.getToken();
    const dataManagementUrl = 'https://developer.api.autodesk.com/data/v1';
    
    // Test verschiedene Formate für Data Management API
    const testFormats = [
      { name: 'Original', id: projectId },
      { name: 'With b. prefix', id: `b.${projectId}` },
      { name: 'Without b. prefix', id: projectId.replace(/^b\./, '') }
    ];
    
    for (const format of testFormats) {
      console.log(`\n🔍 Testing format: ${format.name} - ${format.id}`);
      
      const url = `${dataManagementUrl}/projects/${format.id}/folders/root/contents`;
      console.log('🔍 URL:', url);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ SUCCESS with format: ${format.name}!`);
          console.log('📄 Response preview:', JSON.stringify(data).substring(0, 200) + '...');
          
          return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            correctFormat: format,
            originalProjectId: projectId,
            data: data
          });
        } else {
          const errorText = await response.text();
          console.log(`❌ FAILED with format: ${format.name}: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ ERROR with format: ${format.name}:`, error);
      }
    }
    
    // Strategie 2: Versuche mit Project API Details
    console.log('\n📋 Strategie 2: Project API Details abrufen...');
    
    try {
      const projectUrl = `https://developer.api.autodesk.com/project/v1/hubs/*/projects/${projectId}`;
      console.log('🔍 Project API URL:', projectUrl);
      
      const response = await fetch(projectUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const projectData = await response.json();
        console.log('✅ Project API Details erfolgreich abgerufen!');
        console.log('📄 Project Data:', JSON.stringify(projectData, null, 2));
        
        // Suche nach alternativen Projekt-IDs
        const alternativeIds = [
          projectData.data?.id,
          projectData.data?.attributes?.extension?.data?.projectId,
          projectData.data?.attributes?.extension?.data?.id
        ].filter(Boolean);
        
        console.log('🔍 Alternative Projekt-IDs gefunden:', alternativeIds);
        
        // Teste diese alternativen IDs
        for (const altId of alternativeIds) {
          if (altId === projectId) continue; // Skip original
          
          console.log(`\n🔍 Testing alternative ID: ${altId}`);
          
          const testFormats = [
            { name: 'Original', id: altId },
            { name: 'With b. prefix', id: `b.${altId}` },
            { name: 'Without b. prefix', id: altId.replace(/^b\./, '') }
          ];
          
          for (const format of testFormats) {
            const url = `${dataManagementUrl}/projects/${format.id}/folders/root/contents`;
            
            try {
              const response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log(`✅ SUCCESS with alternative ID format: ${format.name}!`);
                
                return NextResponse.json({
                  success: true,
                  timestamp: new Date().toISOString(),
                  correctFormat: format,
                  originalProjectId: projectId,
                  alternativeProjectId: altId,
                  data: data
                });
              }
            } catch (error) {
              console.log(`❌ Alternative ID format failed: ${format.name}`);
            }
          }
        }
      } else {
        console.log('⚠️ Project API Details nicht verfügbar:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Project API Details Test fehlgeschlagen:', error);
    }
    
    // Strategie 3: Versuche mit Hub-spezifischer URL
    console.log('\n📋 Strategie 3: Hub-spezifische URL versuchen...');
    
    try {
      // Versuche alle Hubs durchzugehen
      const hubsResponse = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (hubsResponse.ok) {
        const hubsData = await hubsResponse.json();
        
        for (const hub of hubsData.data || []) {
          console.log(`\n🔍 Testing Hub: ${hub.attributes?.name} (${hub.id})`);
          
          const projectUrl = `https://developer.api.autodesk.com/project/v1/hubs/${hub.id}/projects/${projectId}`;
          
          try {
            const response = await fetch(projectUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const projectData = await response.json();
              console.log('✅ Projekt in Hub gefunden!');
              console.log('📄 Project Data:', JSON.stringify(projectData, null, 2));
              
              // Teste Data Management API mit dieser Hub-Kombination
              const testFormats = [
                { name: 'Original', id: projectId },
                { name: 'With b. prefix', id: `b.${projectId}` },
                { name: 'Without b. prefix', id: projectId.replace(/^b\./, '') }
              ];
              
              for (const format of testFormats) {
                const url = `${dataManagementUrl}/projects/${format.id}/folders/root/contents`;
                
                try {
                  const dmResponse = await fetch(url, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (dmResponse.ok) {
                    const data = await dmResponse.json();
                    console.log(`✅ SUCCESS with Hub-specific format: ${format.name}!`);
                    
                    return NextResponse.json({
                      success: true,
                      timestamp: new Date().toISOString(),
                      correctFormat: format,
                      originalProjectId: projectId,
                      hub: hub,
                      data: data
                    });
                  }
                } catch (error) {
                  console.log(`❌ Hub-specific format failed: ${format.name}`);
                }
              }
            }
          } catch (error) {
            console.log(`⚠️ Hub ${hub.id} Test fehlgeschlagen:`, error);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Hub-spezifische Strategie fehlgeschlagen:', error);
    }
    
    console.error('❌ Keine funktionierende Projekt-ID gefunden');
    return NextResponse.json({
      success: false,
      error: 'No working project ID found for Data Management API',
      timestamp: new Date().toISOString(),
      debug: {
        originalProjectId: projectId,
        testedFormats: testFormats
      }
    }, { status: 500 });
    
  } catch (error) {
    console.error('❌ ACC Find Correct Project ID failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
