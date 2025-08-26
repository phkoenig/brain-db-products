const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Supabase Client Setup
const supabaseUrl = 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * HTTP Client für WFS Requests
 */
class WFSHTTPClient {
  async makeRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: timeout,
        headers: {
          'User-Agent': 'WFS-Catalog-Scanner/1.0'
        }
      };

      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async getCapabilities(url) {
    try {
      const response = await this.makeRequest(url);
      return {
        success: response.statusCode === 200,
        xml: response.data,
        statusCode: response.statusCode,
        error: response.statusCode !== 200 ? `HTTP ${response.statusCode}` : null
      };
    } catch (error) {
      return {
        success: false,
        xml: null,
        statusCode: null,
        error: error.message
      };
    }
  }
}

/**
 * WFS GetCapabilities Parser
 */
class WFSCapabilitiesParser {
  extractWFSVersion(xml) {
    const versionMatch = xml.match(/<wfs:WFS_Capabilities[^>]*version="([^"]+)"/);
    return versionMatch ? versionMatch[1] : null;
  }

  extractLayers(xml) {
    const layers = [];
    
    // WFS 2.0.0 Layer
    const wfs20Layers = xml.match(/<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs);
    if (wfs20Layers) {
      wfs20Layers.forEach(layerXml => {
        const nameMatch = layerXml.match(/<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s);
        const titleMatch = layerXml.match(/<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s);
        if (nameMatch) {
          layers.push({
            name: nameMatch[1].trim(),
            title: titleMatch ? titleMatch[1].trim() : nameMatch[1].trim()
          });
        }
      });
    }

    // WFS 1.1.0 Layer (falls keine WFS 2.0.0 Layer gefunden wurden)
    if (layers.length === 0) {
      const wfs11Layers = xml.match(/<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs);
      if (wfs11Layers) {
        wfs11Layers.forEach(layerXml => {
          const nameMatch = layerXml.match(/<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s);
          const titleMatch = layerXml.match(/<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s);
          if (nameMatch) {
            layers.push({
              name: nameMatch[1].trim(),
              title: titleMatch ? titleMatch[1].trim() : nameMatch[1].trim()
            });
          }
        });
      }
    }

    return layers;
  }

  parse(xml) {
    try {
      const layers = this.extractLayers(xml);
      const version = this.extractWFSVersion(xml);
      return {
        success: true,
        layers: layers,
        count: layers.length,
        version: version
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        layers: [],
        count: 0,
        version: null
      };
    }
  }
}

/**
 * Korrigierte URLs für problematische Services
 */
const correctedUrls = {
  'ALKIS Berlin Flurstücke': [
    'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_flurstuecke?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.1.0',
    'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_flurstuecke?SERVICE=WFS&REQUEST=GetCapabilities',
    'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_flurstuecke?request=GetCapabilities&service=WFS'
  ],
  'ALKIS Berlin Gebäude': [
    'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_gebaeudeflaechen?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.1.0',
    'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_gebaeudeflaechen?SERVICE=WFS&REQUEST=GetCapabilities',
    'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_gebaeudeflaechen?request=GetCapabilities&service=WFS'
  ],
  'WFS ALKIS Land Bremen': [
    'https://opendata.lgln.niedersachsen.de/doorman/noauth/alkishb_wfs?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.1.0',
    'https://opendata.lgln.niedersachsen.de/doorman/noauth/alkishb_wfs?request=GetCapabilities&service=WFS&version=1.1.0'
  ],
  'WFS HE ALKIS Vereinfacht': [
    'https://www.gds.hessen.de/wfs2/aaa-suite/services/alkis_vereinfacht?request=GetCapabilities&service=WFS&version=2.0.0',
    'https://www.gds.hessen.de/wfs2/aaa-suite/services/alkis_vereinfacht?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=2.0.0'
  ]
};

/**
 * Testet alle WFS-Services systematisch
 */
async function testAllWFSServices() {
  console.log('🔍 Systematischer Test aller WFS-Services...\n');

  // Hole alle WFS-Streams aus der Datenbank
  const { data: streams, error: streamsError } = await supabase
    .from('wfs_streams')
    .select('id, service_title, url, land_name, wfs_version, layer_anzahl')
    .order('land_name', { ascending: true });

  if (streamsError) {
    console.error('❌ Fehler beim Laden der WFS-Streams:', streamsError);
    return;
  }

  const httpClient = new WFSHTTPClient();
  const parser = new WFSCapabilitiesParser();

  let totalTested = 0;
  let totalSuccessful = 0;
  let totalLayersFound = 0;

  for (const stream of streams) {
    console.log(`\n🔍 Teste: ${stream.service_title}`);
    console.log(`   Bundesland: ${stream.land_name}`);
    console.log(`   Erwartete WFS Version: ${stream.wfs_version}`);
    console.log(`   Aktuelle Layer-Anzahl: ${stream.layer_anzahl}`);

    // Teste die ursprüngliche URL
    console.log(`   📡 Teste Original-URL: ${stream.url}`);
    let capabilities = await httpClient.getCapabilities(stream.url);
    
    if (!capabilities.success) {
      console.log(`   ❌ Original-URL fehlgeschlagen: ${capabilities.error}`);
      
      // Teste korrigierte URLs falls verfügbar
      if (correctedUrls[stream.service_title]) {
        console.log(`   🔧 Teste korrigierte URLs...`);
        for (const correctedUrl of correctedUrls[stream.service_title]) {
          console.log(`   📡 Teste: ${correctedUrl}`);
          capabilities = await httpClient.getCapabilities(correctedUrl);
          if (capabilities.success) {
            console.log(`   ✅ Korrigierte URL erfolgreich!`);
            break;
          } else {
            console.log(`   ❌ Fehlgeschlagen: ${capabilities.error}`);
          }
        }
      }
    } else {
      console.log(`   ✅ Original-URL erfolgreich!`);
    }

    totalTested++;

    if (capabilities.success) {
      totalSuccessful++;
      
      // Parse XML und zähle Layer
      const parseResult = parser.parse(capabilities.xml);
      
      if (parseResult.success) {
        console.log(`   📊 Gefunden: ${parseResult.count} Layer`);
        console.log(`   🔍 Erkannte WFS Version: ${parseResult.version}`);
        
        if (parseResult.count > 0) {
          console.log(`   📋 Erste Layer:`);
          parseResult.layers.slice(0, 3).forEach(layer => {
            console.log(`      - ${layer.name}: ${layer.title}`);
          });
          if (parseResult.layers.length > 3) {
            console.log(`      ... und ${parseResult.layers.length - 3} weitere`);
          }
          totalLayersFound += parseResult.count;
        }
        
        // Aktualisiere die Datenbank wenn Layer gefunden wurden
        if (parseResult.count !== stream.layer_anzahl) {
          const { error: updateError } = await supabase
            .from('wfs_streams')
            .update({ 
              layer_anzahl: parseResult.count,
              zuletzt_geprueft: new Date().toISOString()
            })
            .eq('id', stream.id);

          if (updateError) {
            console.log(`   ⚠️  Fehler beim Aktualisieren: ${updateError.message}`);
          } else {
            console.log(`   ✅ Layer-Anzahl aktualisiert: ${stream.layer_anzahl} → ${parseResult.count}`);
          }
        }
      } else {
        console.log(`   ❌ Parsing fehlgeschlagen: ${parseResult.error}`);
      }
    } else {
      console.log(`   ❌ Service nicht erreichbar`);
    }
  }

  console.log('\n📊 Zusammenfassung:');
  console.log(`   🔍 Getestet: ${totalTested} Services`);
  console.log(`   ✅ Erfolgreich: ${totalSuccessful} Services`);
  console.log(`   ❌ Fehlgeschlagen: ${totalTested - totalSuccessful} Services`);
  console.log(`   📋 Insgesamt gefunden: ${totalLayersFound} Layer`);
  console.log(`   📈 Erfolgsrate: ${((totalSuccessful / totalTested) * 100).toFixed(1)}%`);
  
  console.log('\n🎯 Empfehlungen:');
  if (totalSuccessful < totalTested) {
    console.log('   - Einige URLs müssen korrigiert werden');
    console.log('   - Manche Services sind möglicherweise offline');
    console.log('   - INSPIRE-Services haben oft andere URL-Strukturen');
  }
  
  console.log('\n🎉 WFS-Service Test abgeschlossen!');
}

// Führe das Skript aus
testAllWFSServices().catch(console.error);
