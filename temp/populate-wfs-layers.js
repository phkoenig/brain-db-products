const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * WFS GetCapabilities Parser
 */
class WFSCapabilitiesParser {
  /**
   * Extrahiert Service-Titel aus XML
   */
  extractServiceTitle(xml) {
    const titleMatch = xml.match(/<ows:Title[^>]*>(.*?)<\/ows:Title>/s);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * Extrahiert Service-Abstract aus XML
   */
  extractServiceAbstract(xml) {
    const abstractMatch = xml.match(/<ows:Abstract[^>]*>(.*?)<\/ows:Abstract>/s);
    return abstractMatch ? abstractMatch[1].trim() : null;
  }

  /**
   * Extrahiert WFS-Version aus XML
   */
  extractWFSVersion(xml) {
    const versionMatch = xml.match(/<wfs:WFS_Capabilities[^>]*version="([^"]+)"/);
    return versionMatch ? versionMatch[1] : null;
  }

  /**
   * Extrahiert Provider-Name aus XML
   */
  extractProviderName(xml) {
    const providerMatch = xml.match(/<ows:ProviderName[^>]*>(.*?)<\/ows:ProviderName>/s);
    return providerMatch ? providerMatch[1].trim() : null;
  }

  /**
   * Extrahiert Provider-Site aus XML
   */
  extractProviderSite(xml) {
    const siteMatch = xml.match(/<ows:ProviderSite[^>]*>(.*?)<\/ows:ProviderSite>/s);
    return siteMatch ? siteMatch[1].trim() : null;
  }

  /**
   * Extrahiert Bounding Box aus XML
   */
  extractBoundingBox(xml) {
    const bboxMatch = xml.match(/<ows:WGS84BoundingBox[^>]*>.*?<ows:LowerCorner[^>]*>(.*?)<\/ows:LowerCorner>.*?<ows:UpperCorner[^>]*>(.*?)<\/ows:UpperCorner>.*?<\/ows:WGS84BoundingBox>/s);
    if (bboxMatch) {
      const [minLon, minLat] = bboxMatch[1].trim().split(' ');
      const [maxLon, maxLat] = bboxMatch[2].trim().split(' ');
      return {
        minLon: parseFloat(minLon),
        minLat: parseFloat(minLat),
        maxLon: parseFloat(maxLon),
        maxLat: parseFloat(maxLat)
      };
    }
    return null;
  }

  /**
   * Extrahiert Layer-Informationen aus XML
   */
  extractLayers(xml) {
    const layers = [];
    const wfsVersion = this.extractWFSVersion(xml);
    
    // WFS 2.0.0 Layer
    const wfs20Layers = xml.match(/<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs);
    if (wfs20Layers) {
      wfs20Layers.forEach(layerXml => {
        const layer = {
          name: this.extractLayerName(layerXml),
          title: this.extractLayerTitle(layerXml),
          abstract: this.extractLayerAbstract(layerXml),
          defaultCRS: this.extractLayerDefaultCRS(layerXml),
          otherCRS: this.extractLayerOtherCRS(layerXml),
          outputFormats: this.extractLayerOutputFormats(layerXml),
          bbox: this.extractLayerBoundingBox(layerXml)
        };
        if (layer.name) layers.push(layer);
      });
    }

    // WFS 1.1.0 Layer (falls keine WFS 2.0.0 Layer gefunden wurden)
    if (layers.length === 0) {
      const wfs11Layers = xml.match(/<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs);
      if (wfs11Layers) {
        wfs11Layers.forEach(layerXml => {
          const layer = {
            name: this.extractLayerName(layerXml),
            title: this.extractLayerTitle(layerXml),
            abstract: this.extractLayerAbstract(layerXml),
            defaultCRS: this.extractLayerDefaultCRS(layerXml),
            otherCRS: this.extractLayerOtherCRS(layerXml),
            outputFormats: this.extractLayerOutputFormats(layerXml),
            bbox: this.extractLayerBoundingBox(layerXml)
          };
          if (layer.name) layers.push(layer);
        });
      }
    }

    return layers;
  }

  /**
   * Extrahiert Layer-Name
   */
  extractLayerName(xml) {
    const nameMatch = xml.match(/<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s);
    return nameMatch ? nameMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Titel
   */
  extractLayerTitle(xml) {
    const titleMatch = xml.match(/<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Abstract
   */
  extractLayerAbstract(xml) {
    const abstractMatch = xml.match(/<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s);
    return abstractMatch ? abstractMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Default-CRS (WFS 2.0.0)
   */
  extractLayerDefaultCRS(xml) {
    const crsMatch = xml.match(/<wfs:DefaultCRS[^>]*>(.*?)<\/wfs:DefaultCRS>/s);
    return crsMatch ? crsMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Other-CRS (WFS 2.0.0)
   */
  extractLayerOtherCRS(xml) {
    const crsMatches = xml.match(/<wfs:OtherCRS[^>]*>(.*?)<\/wfs:OtherCRS>/gs);
    return crsMatches ? crsMatches.map(match => match.replace(/<\/?wfs:OtherCRS[^>]*>/g, '').trim()) : [];
  }

  /**
   * Extrahiert Layer-Output-Formats (WFS 2.0.0)
   */
  extractLayerOutputFormats(xml) {
    const formatMatches = xml.match(/<wfs:OutputFormat[^>]*>(.*?)<\/wfs:OutputFormat>/gs);
    return formatMatches ? formatMatches.map(match => match.replace(/<\/?wfs:OutputFormat[^>]*>/g, '').trim()) : [];
  }

  /**
   * Extrahiert Layer-Bounding-Box
   */
  extractLayerBoundingBox(xml) {
    const bboxMatch = xml.match(/<ows:WGS84BoundingBox[^>]*>.*?<ows:LowerCorner[^>]*>(.*?)<\/ows:LowerCorner>.*?<ows:UpperCorner[^>]*>(.*?)<\/ows:UpperCorner>.*?<\/ows:WGS84BoundingBox>/s);
    if (bboxMatch) {
      const [minLon, minLat] = bboxMatch[1].trim().split(' ');
      const [maxLon, maxLat] = bboxMatch[2].trim().split(' ');
      return {
        minLon: parseFloat(minLon),
        minLat: parseFloat(minLat),
        maxLon: parseFloat(maxLon),
        maxLat: parseFloat(maxLat)
      };
    }
    return null;
  }

  /**
   * Parst WFS GetCapabilities XML
   */
  parse(xml) {
    try {
      const layers = this.extractLayers(xml);
      return {
        success: true,
        layers: layers,
        count: layers.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        layers: [],
        count: 0
      };
    }
  }
}

/**
 * HTTP Client für WFS Requests
 */
class WFSHTTPClient {
  /**
   * Führt HTTP Request aus
   */
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

  /**
   * Holt GetCapabilities XML von WFS Service
   */
  async getCapabilities(url) {
    try {
      const response = await this.makeRequest(url);
      if (response.statusCode === 200) {
        return {
          success: true,
          xml: response.data,
          statusCode: response.statusCode
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.statusCode}`,
          statusCode: response.statusCode
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: null
      };
    }
  }
}

/**
 * Hauptfunktion zum Befüllen der Layer-Tabelle
 */
async function populateWFSLayers() {
  console.log('🚀 Starte WFS Layer Extraktion...\n');

  // Hole alle WFS-Streams aus der Datenbank
  const { data: streams, error: streamsError } = await supabase
    .from('wfs_streams')
    .select('id, service_title, url, land_name, wfs_version')
    .order('land_name', { ascending: true });

  if (streamsError) {
    console.error('❌ Fehler beim Laden der WFS-Streams:', streamsError);
    return;
  }

  console.log(`📊 Gefunden: ${streams.length} WFS-Streams\n`);

  const parser = new WFSCapabilitiesParser();
  const httpClient = new WFSHTTPClient();

  let totalLayers = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const stream of streams) {
    console.log(`🔍 Verarbeite: ${stream.service_title}`);
    console.log(`   URL: ${stream.url}`);
    console.log(`   Land: ${stream.land_name}`);
    console.log(`   WFS Version: ${stream.wfs_version}`);

    try {
      // Hole GetCapabilities XML
      const capabilities = await httpClient.getCapabilities(stream.url);
      
      if (!capabilities.success) {
        console.log(`   ❌ Fehler beim Abrufen der Capabilities: ${capabilities.error}\n`);
        errorCount++;
        continue;
      }

      // Parse XML und extrahiere Layer
      const parseResult = parser.parse(capabilities.xml);
      
      if (!parseResult.success) {
        console.log(`   ❌ Fehler beim Parsen: ${parseResult.error}\n`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Gefunden: ${parseResult.count} Layer`);

      // Füge Layer zur Datenbank hinzu
      for (const layer of parseResult.layers) {
        const layerData = {
          wfs_id: stream.id,
          name: layer.name,
          titel: layer.title || layer.name,
          abstract: layer.abstract,
          default_crs: layer.defaultCRS,
          weitere_crs: layer.otherCRS,
          outputformate: layer.outputFormats,
          bbox_wgs84: layer.bbox,
          ist_abfragbar: true,
          zuletzt_describe_geprueft: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('wfs_layers')
          .insert(layerData);

        if (insertError) {
          console.log(`   ⚠️  Fehler beim Einfügen von Layer ${layer.name}: ${insertError.message}`);
        } else {
          totalLayers++;
        }
      }

      // Aktualisiere layer_anzahl in wfs_streams
      const { error: updateError } = await supabase
        .from('wfs_streams')
        .update({ 
          layer_anzahl: parseResult.count,
          zuletzt_geprueft: new Date().toISOString()
        })
        .eq('id', stream.id);

      if (updateError) {
        console.log(`   ⚠️  Fehler beim Aktualisieren der Layer-Anzahl: ${updateError.message}`);
      }

      successCount++;
      console.log(`   ✅ Erfolgreich verarbeitet\n`);

    } catch (error) {
      console.log(`   ❌ Unerwarteter Fehler: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('📊 Zusammenfassung:');
  console.log(`   ✅ Erfolgreich verarbeitet: ${successCount} Streams`);
  console.log(`   ❌ Fehler: ${errorCount} Streams`);
  console.log(`   📋 Insgesamt eingefügt: ${totalLayers} Layer`);
  console.log('\n🎉 WFS Layer Extraktion abgeschlossen!');
}

// Führe das Skript aus
populateWFSLayers().catch(console.error);
