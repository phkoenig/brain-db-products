import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function GET(request: NextRequest) {
  console.log('🔍 === ACC PROJECTS LIST API STARTED ===');
  
  try {
    // Schritt 1: Token abrufen
    const token = await ACCService.getToken();
    console.log('✅ Token erfolgreich abgerufen');
    
    // Schritt 2: Hubs (Accounts) auflisten
    console.log('📋 Schritt 2: Hubs auflisten...');
    const hubsUrl = 'https://developer.api.autodesk.com/project/v1/hubs';
    
    const hubsResponse = await fetch(hubsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!hubsResponse.ok) {
      const errorText = await hubsResponse.text();
      console.error('❌ Hubs request failed:', errorText);
      throw new Error(`Hubs request failed: ${hubsResponse.status} - ${errorText}`);
    }
    
    const hubsData = await hubsResponse.json();
    console.log('✅ Hubs erfolgreich abgerufen');
    console.log('📋 Anzahl Hubs:', hubsData.data?.length || 0);
    
    // Schritt 3: Projekte für jeden Hub auflisten
    console.log('📋 Schritt 3: Projekte für jeden Hub auflisten...');
    const allProjects: any[] = [];
    
    for (const hub of hubsData.data || []) {
      console.log(`🔍 Hub: ${hub.attributes?.name} (${hub.id})`);
      console.log(`🔍 Hub Type: ${hub.attributes?.extension?.type}`);
      
      const projectsUrl = `https://developer.api.autodesk.com/project/v1/hubs/${hub.id}/projects`;
      
      try {
        const projectsResponse = await fetch(projectsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          console.log(`✅ Projekte für Hub ${hub.attributes?.name}: ${projectsData.data?.length || 0}`);
          
          // Debug: Zeige Projekt-Typen
          projectsData.data?.forEach((project: any, index: number) => {
            console.log(`  Projekt ${index + 1}: ${project.attributes?.name} - Type: ${project.attributes?.extension?.type}`);
          });
          
          // Projekte mit Hub-Informationen erweitern
          const projectsWithHub = (projectsData.data || []).map((project: any) => ({
            ...project,
            hub: {
              id: hub.id,
              name: hub.attributes?.name,
              type: hub.attributes?.extension?.type
            }
          }));
          
          allProjects.push(...projectsWithHub);
        } else {
          console.log(`⚠️ Keine Projekte für Hub ${hub.attributes?.name}: ${projectsResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Fehler beim Abrufen der Projekte für Hub ${hub.attributes?.name}:`, error);
      }
    }
    
    console.log('✅ Alle Projekte erfolgreich abgerufen');
    console.log('📋 Gesamtanzahl Projekte:', allProjects.length);
    
    // Schritt 4: Alle Projekte anzeigen (nicht nur ACC-Projekte)
    console.log('📋 Schritt 4: Alle Projekte auflisten...');
    
    const allProjectsDetailed = allProjects.map((project: any) => ({
      id: project.id,
      name: project.attributes?.name,
      description: project.attributes?.description,
      startDate: project.attributes?.startDate,
      endDate: project.attributes?.endDate,
      status: project.attributes?.status,
      hub: project.hub,
      // Wichtige Felder für API-Zugriff
      projectId: project.id, // Das ist die korrekte Projekt-ID für API-Calls
      urn: project.attributes?.extension?.data?.projectId, // Falls verfügbar
      // Debug-Informationen
      projectType: project.attributes?.extension?.type,
      projectData: project.attributes?.extension?.data
    }));
    
    // Schritt 5: ACC-Projekte identifizieren (verschiedene Filter)
    console.log('📋 Schritt 5: ACC-Projekte identifizieren...');
    
    // Verschiedene Filter für ACC-Projekte
    const accProjectsFilter1 = allProjects.filter((project: any) => 
      project.attributes?.extension?.type === 'hubs:autodesk.core:Hub'
    );
    
    const accProjectsFilter2 = allProjects.filter((project: any) => 
      project.attributes?.extension?.type === 'projects:autodesk.core:Project'
    );
    
    const accProjectsFilter3 = allProjects.filter((project: any) => 
      project.attributes?.extension?.type?.includes('autodesk.core')
    );
    
    const accProjectsFilter4 = allProjects.filter((project: any) => 
      project.attributes?.extension?.type?.includes('Project')
    );
    
    console.log('🔍 Filter 1 (hubs:autodesk.core:Hub):', accProjectsFilter1.length);
    console.log('🔍 Filter 2 (projects:autodesk.core:Project):', accProjectsFilter2.length);
    console.log('🔍 Filter 3 (autodesk.core):', accProjectsFilter3.length);
    console.log('🔍 Filter 4 (Project):', accProjectsFilter4.length);
    
    // Verwende den Filter mit den meisten Ergebnissen
    const accProjects = accProjectsFilter4.length > 0 ? accProjectsFilter4 : 
                       accProjectsFilter3.length > 0 ? accProjectsFilter3 :
                       accProjectsFilter2.length > 0 ? accProjectsFilter2 :
                       accProjectsFilter1;
    
    console.log('🔍 ACC-Projekte gefunden:', accProjects.length);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalHubs: hubsData.data?.length || 0,
        totalProjects: allProjects.length,
        accProjects: accProjects.length,
        // Debug-Informationen
        filterResults: {
          filter1: accProjectsFilter1.length,
          filter2: accProjectsFilter2.length,
          filter3: accProjectsFilter3.length,
          filter4: accProjectsFilter4.length
        }
      },
      hubs: hubsData.data?.map((hub: any) => ({
        id: hub.id,
        name: hub.attributes?.name,
        type: hub.attributes?.extension?.type
      })) || [],
      // Zeige alle Projekte (nicht nur ACC-Projekte)
      allProjects: allProjectsDetailed,
      projects: accProjects.map((project: any) => ({
        id: project.id,
        name: project.attributes?.name,
        description: project.attributes?.description,
        startDate: project.attributes?.startDate,
        endDate: project.attributes?.endDate,
        status: project.attributes?.status,
        hub: project.hub,
        projectId: project.id,
        urn: project.attributes?.extension?.data?.projectId,
        projectType: project.attributes?.extension?.type
      }))
    });
    
  } catch (error) {
    console.error('❌ ACC Projects List failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
