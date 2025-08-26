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

  extractServiceTitle(xml) {
    const titleMatch = xml.match(/<ows:Title[^>]*>(.*?)<\/ows:Title>/s);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  extractServiceAbstract(xml) {
    const abstractMatch = xml.match(/<ows:Abstract[^>]*>(.*?)<\/ows:Abstract>/s);
    return abstractMatch ? abstractMatch[1].trim() : null;
  }

  extractLayers(xml) {
    const layers = [];
    
    // WFS 2.0.0 Layer
    const wfs20Layers = xml.match(/<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs);
    if (wfs20Layers) {
      wfs20Layers.forEach(layerXml => {
        const nameMatch = layerXml.match(/<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s);
        const titleMatch = layerXml.match(/<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s);
        const abstractMatch = layerXml.match(/<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s);
        const crsMatch = layerXml.match(/<wfs:DefaultCRS[^>]*>(.*?)<\/wfs:DefaultCRS>/s);
        
        if (nameMatch) {
          layers.push({
            name: nameMatch[1].trim(),
            title: titleMatch ? titleMatch[1].trim() : nameMatch[1].trim(),
            abstract: abstractMatch ? abstractMatch[1].trim() : null,
            defaultCRS: crsMatch ? crsMatch[1].trim() : null
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
          const abstractMatch = layerXml.match(/<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s);
          const crsMatch = layerXml.match(/<wfs:DefaultCRS[^>]*>(.*?)<\/wfs:DefaultCRS>/s);
          
          if (nameMatch) {
            layers.push({
              name: nameMatch[1].trim(),
              title: titleMatch ? titleMatch[1].trim() : nameMatch[1].trim(),
              abstract: abstractMatch ? abstractMatch[1].trim() : null,
              defaultCRS: crsMatch ? crsMatch[1].trim() : null
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
      const title = this.extractServiceTitle(xml);
      const abstract = this.extractServiceAbstract(xml);
      
      return {
        success: true,
        layers: layers,
        count: layers.length,
        version: version,
        title: title,
        abstract: abstract
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        layers: [],
        count: 0,
        version: null,
        title: null,
        abstract: null
      };
    }
  }
}

/**
 * Testet den Berlin WFS-Service
 */
async function testBerlinWFS() {
  console.log('🔍 Teste Berlin WFS-Service...\n');

  const berlinUrl = 'https://gdi.berlin.de/services/wfs/alkis_flurstuecke?REQUEST=GetCapabilities&SERVICE=wfs';
  
  console.log(`📡 URL: ${berlinUrl}`);
  
  const httpClient = new WFSHTTPClient();
  const parser = new WFSCapabilitiesParser();

  // Teste den Service
  const capabilities = await httpClient.getCapabilities(berlinUrl);
  
  if (!capabilities.success) {
    console.log(`❌ Service nicht erreichbar: ${capabilities.error}`);
    return;
  }

  console.log(`✅ Service erfolgreich erreicht! (HTTP ${capabilities.statusCode})`);
  
  // Parse XML
  const parseResult = parser.parse(capabilities.xml);
  
  if (!parseResult.success) {
    console.log(`❌ Parsing fehlgeschlagen: ${parseResult.error}`);
    return;
  }

  console.log(`\n📊 Service-Informationen:`);
  console.log(`   Titel: ${parseResult.title}`);
  console.log(`   Abstract: ${parseResult.abstract}`);
  console.log(`   WFS Version: ${parseResult.version}`);
  console.log(`   Layer-Anzahl: ${parseResult.count}`);

  if (parseResult.count > 0) {
    console.log(`\n📋 Gefundene Layer:`);
    parseResult.layers.forEach((layer, index) => {
      console.log(`   ${index + 1}. ${layer.name}`);
      console.log(`      Titel: ${layer.title}`);
      if (layer.abstract) {
        console.log(`      Abstract: ${layer.abstract.substring(0, 100)}...`);
      }
      if (layer.defaultCRS) {
        console.log(`      CRS: ${layer.defaultCRS}`);
      }
      console.log('');
    });

    // Aktualisiere die Datenbank
    const { data: stream, error: streamError } = await supabase
      .from('wfs_streams')
      .select('id, service_title')
      .eq('service_title', 'ALKIS Berlin Flurstücke')
      .single();

    if (streamError) {
      console.log(`❌ Fehler beim Laden des Streams: ${streamError.message}`);
      return;
    }

    // Aktualisiere Layer-Anzahl
    const { error: updateError } = await supabase
      .from('wfs_streams')
      .update({ 
        layer_anzahl: parseResult.count,
        zuletzt_geprueft: new Date().toISOString()
      })
      .eq('id', stream.id);

    if (updateError) {
      console.log(`❌ Fehler beim Aktualisieren: ${updateError.message}`);
    } else {
      console.log(`✅ Layer-Anzahl in Datenbank aktualisiert: ${parseResult.count}`);
    }

    // Füge Layer zur wfs_layers Tabelle hinzu
    console.log(`\n💾 Füge Layer zur Datenbank hinzu...`);
    let insertedCount = 0;
    
    for (const layer of parseResult.layers) {
      const layerData = {
        wfs_id: stream.id,
        name: layer.name,
        titel: layer.title,
        abstract: layer.abstract,
        default_crs: layer.defaultCRS,
        ist_abfragbar: true,
        zuletzt_describe_geprueft: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('wfs_layers')
        .insert(layerData);

      if (insertError) {
        console.log(`   ⚠️  Fehler beim Einfügen von ${layer.name}: ${insertError.message}`);
      } else {
        insertedCount++;
        console.log(`   ✅ ${layer.name} eingefügt`);
      }
    }

    console.log(`\n🎉 Erfolgreich ${insertedCount} von ${parseResult.count} Layer eingefügt!`);
  } else {
    console.log(`\n⚠️  Keine Layer gefunden`);
  }

  console.log('\n🎉 Berlin WFS-Test abgeschlossen!');
}

// Führe das Skript aus
testBerlinWFS().catch(console.error);
