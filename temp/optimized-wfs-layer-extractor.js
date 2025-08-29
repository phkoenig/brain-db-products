const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');
const { WFSCapabilitiesParser } = require('../src/lib/wfs-parser.js');

// Dotenv-Konfiguration
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

console.log('🔧 Debug: Supabase URL:', supabaseUrl);
console.log('🔧 Debug: Supabase Key vorhanden:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * HTTP Client für WFS Requests
 */
class WFSHTTPClient {
  /**
   * Führt HTTP Request aus
   */
  async makeRequest(url, timeout = 15000) {
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
 * Hauptfunktion zum Befüllen der Layer-Tabelle mit dem optimierten Parser
 */
async function extractWFSLayersOptimized() {
  console.log('🚀 Starte optimierte WFS Layer Extraktion...\n');

  // Hole alle WFS-Streams aus der Datenbank
  const { data: streams, error: streamsError } = await supabase
    .from('wfs_streams')
    .select('id, service_title, url, land_name, wfs_version, layer_anzahl')
    .eq('ist_aktiv', true)
    .order('land_name', { ascending: true });

  if (streamsError) {
    console.error('❌ Fehler beim Laden der WFS-Streams:', streamsError);
    return;
  }

  console.log(`📊 Gefunden: ${streams.length} aktive WFS-Streams\n`);

  const parser = new WFSCapabilitiesParser();
  const httpClient = new WFSHTTPClient();

  let totalLayers = 0;
  let successCount = 0;
  let errorCount = 0;
  let newLayersCount = 0;

  for (const stream of streams) {
    console.log(`🔍 Verarbeite: ${stream.service_title}`);
    console.log(`   URL: ${stream.url}`);
    console.log(`   Land: ${stream.land_name}`);
    console.log(`   WFS Version: ${stream.wfs_version}`);
    console.log(`   Bereits vorhandene Layer: ${stream.layer_anzahl || 0}`);

    try {
      // Hole GetCapabilities XML
      const capabilities = await httpClient.getCapabilities(stream.url);
      
      if (!capabilities.success) {
        console.log(`   ❌ Fehler beim Abrufen der Capabilities: ${capabilities.error}\n`);
        errorCount++;
        continue;
      }

      // Parse XML und extrahiere Layer mit dem optimierten Parser
      const parseResult = parser.parse(capabilities.xml);
      
      if (!parseResult.success) {
        console.log(`   ❌ Fehler beim Parsen: ${parseResult.error}\n`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Gefunden: ${parseResult.layerCount} Layer`);

      // Prüfe, ob bereits Layer für diesen Stream existieren
      const { data: existingLayers, error: existingError } = await supabase
        .from('wfs_layers')
        .select('id')
        .eq('wfs_id', stream.id);

      if (existingError) {
        console.log(`   ⚠️  Fehler beim Prüfen existierender Layer: ${existingError.message}`);
      }

      const existingCount = existingLayers ? existingLayers.length : 0;
      console.log(`   📋 Bereits in DB: ${existingCount} Layer`);

      // Füge nur neue Layer zur Datenbank hinzu
      let insertedCount = 0;
      for (const layer of parseResult.layers) {
        // Prüfe, ob Layer bereits existiert
        const layerExists = existingLayers && existingLayers.some(existing => 
          existing.name === layer.name
        );

        if (layerExists) {
          continue; // Überspringe bereits vorhandene Layer
        }

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
          insertedCount++;
          newLayersCount++;
        }
      }

      console.log(`   📥 Neue Layer eingefügt: ${insertedCount}`);

      // Aktualisiere layer_anzahl in wfs_streams
      const { error: updateError } = await supabase
        .from('wfs_streams')
        .update({ 
          layer_anzahl: parseResult.layerCount,
          zuletzt_geprueft: new Date().toISOString()
        })
        .eq('id', stream.id);

      if (updateError) {
        console.log(`   ⚠️  Fehler beim Aktualisieren der Layer-Anzahl: ${updateError.message}`);
      }

      successCount++;
      totalLayers += parseResult.layerCount;
      console.log(`   ✅ Erfolgreich verarbeitet\n`);

    } catch (error) {
      console.log(`   ❌ Unerwarteter Fehler: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('📊 Zusammenfassung:');
  console.log(`   ✅ Erfolgreich verarbeitet: ${successCount} Streams`);
  console.log(`   ❌ Fehler: ${errorCount} Streams`);
  console.log(`   📋 Gesamte Layer gefunden: ${totalLayers}`);
  console.log(`   📥 Neue Layer eingefügt: ${newLayersCount}`);
  console.log('\n🎉 Optimierte WFS Layer Extraktion abgeschlossen!');
}

// Führe das Skript aus
extractWFSLayersOptimized().catch(console.error);
