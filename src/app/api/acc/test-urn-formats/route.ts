import { NextRequest, NextResponse } from 'next/server';
import { ACCService } from '@/lib/acc';

export async function GET(request: NextRequest) {
  console.log('🔍 === ACC URN FORMATS SYSTEMATIC TEST ===');
  
  const projectId = '4e325aa4-b44b-4e90-9a15-a322fa67b719';
  const results: any = {};
  
  try {
    const token = await ACCService.getToken();
    const dataManagementUrl = 'https://developer.api.autodesk.com/data/v1';
    
    // Test alle möglichen URN-Formate
    const urnFormats = [
      { name: 'Direct Project ID', format: projectId },
      { name: 'b. Prefix', format: `b.${projectId}` },
      { name: 'URN Format', format: `urn:adsk.wipprod:dm.lineage:${projectId}` },
      { name: 'URL Encoded URN', format: encodeURIComponent(`urn:adsk.wipprod:dm.lineage:${projectId}`) },
      { name: 'ACC URN Format', format: `urn:adsk.wipprod:fs.folder:co.${projectId}` },
      { name: 'BIM360 URN Format', format: `urn:adsk.wipprod:dm.lineage:${projectId}` },
      { name: 'Legacy Format', format: `b.${projectId.replace(/-/g, '')}` },
      { name: 'No Dashes Format', format: `b.${projectId.replace(/-/g, '')}` },
    ];
    
    for (const urnFormat of urnFormats) {
      console.log(`\n🔍 Testing: ${urnFormat.name} - ${urnFormat.format}`);
      
      const url = `${dataManagementUrl}/projects/${urnFormat.format}/folders/root/contents`;
      console.log(`🔍 URL: ${url}`);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const status = response.status;
        const responseText = await response.text();
        
        console.log(`📡 Status: ${status}`);
        
        results[urnFormat.name] = {
          format: urnFormat.format,
          status: status,
          success: response.ok,
          response: responseText.substring(0, 500) // Erste 500 Zeichen
        };
        
        if (response.ok) {
          console.log(`✅ SUCCESS with ${urnFormat.name}!`);
          console.log(`📄 Response preview: ${responseText.substring(0, 200)}...`);
        } else {
          console.log(`❌ FAILED with ${urnFormat.name}: ${responseText}`);
        }
        
      } catch (error) {
        console.log(`❌ ERROR with ${urnFormat.name}:`, error);
        results[urnFormat.name] = {
          format: urnFormat.format,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    // Finde erfolgreiche Formate
    const successfulFormats = Object.entries(results).filter(([name, result]: [string, any]) => result.success);
    
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('='.repeat(50));
    
    if (successfulFormats.length > 0) {
      console.log('✅ SUCCESSFUL FORMATS:');
      successfulFormats.forEach(([name, result]: [string, any]) => {
        console.log(`  - ${name}: ${result.format}`);
      });
    } else {
      console.log('❌ NO SUCCESSFUL FORMATS FOUND');
    }
    
    console.log('\n❌ FAILED FORMATS:');
    Object.entries(results).filter(([name, result]: [string, any]) => !result.success).forEach(([name, result]: [string, any]) => {
      console.log(`  - ${name}: ${result.status} - ${result.response || result.error}`);
    });
    
    return NextResponse.json({
      success: successfulFormats.length > 0,
      timestamp: new Date().toISOString(),
      successfulFormats: successfulFormats.map(([name, result]: [string, any]) => ({
        name,
        format: result.format
      })),
      allResults: results
    });
    
  } catch (error) {
    console.error('❌ URN Formats Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
