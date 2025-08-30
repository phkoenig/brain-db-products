const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');
const { WFSCapabilitiesParser } = require('../../../lib/wfs-parser.js');
const axios = require('axios'); // Für Portal-Link-Analyse

// Dotenv-Konfiguration - Verwende relativen Pfad zum Projekt-Root
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env.local') });

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
 * Prüft ob eine URL ein Portal-Link ist
 */
function isPortalLink(url) {
  const portalIndicators = [
    'geoportal',
    'metaver',
    'spatial-objects',
    'trefferanzeige',
    'docuuid',
    'catalog',
    'registry'
  ];
  
  const urlLower = url.toLowerCase();
  return portalIndicators.some(indicator => urlLower.includes(indicator));
}

/**
 * Automatische Portal-Link-Erkennung und WFS-URL-Extraktion
 * Erkennt wenn eine URL auf ein Portal zeigt und extrahiert echte WFS-URLs
 */
async function extractWFSURLsFromPortal(portalUrl, streamName) {
  console.log(`   🔍 Portal-Link erkannt: ${streamName}`);
  console.log(`   🔗 Analysiere Portal: ${portalUrl}`);
  
  try {
    const response = await axios.get(portalUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.status !== 200) {
      console.log(`   ❌ Portal nicht erreichbar: HTTP ${response.status}`);
      return null;
    }
    
    const content = response.data;
    const contentType = response.headers['content-type'] || '';
    
    // Prüfe ob es JSON ist (wie bei Rheinland-Pfalz)
    if (contentType.includes('application/json')) {
      console.log(`   📄 JSON-Response erkannt - versuche WFS-URLs zu extrahieren`);
      return extractWFSURLsFromJSON(content, streamName);
    }
    
    // HTML-Content analysieren
    if (contentType.includes('text/html')) {
      console.log(`   📄 HTML-Response erkannt - suche nach WFS-URLs`);
      return extractWFSURLsFromHTML(content, streamName);
    }
    
    console.log(`   ❌ Unbekannter Content-Type: ${contentType}`);
    return null;
    
  } catch (error) {
    console.log(`   ❌ Portal-Analyse fehlgeschlagen: ${error.message}`);
    return null;
  }
}

/**
 * Extrahiert WFS-URLs aus JSON-Responses (wie Rheinland-Pfalz)
 */
function extractWFSURLsFromJSON(jsonContent, streamName) {
  try {
    const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    
    // Suche nach WFS-URLs in JSON-Struktur
    const wfsUrls = [];
    const searchInObject = (obj, path = '') => {
      if (typeof obj === 'string') {
        // Prüfe ob String eine WFS-URL ist
        if (obj.includes('wfs') || obj.includes('GetCapabilities') || obj.includes('service=WFS')) {
          const cleanUrl = obj.replace(/&amp;/g, '&').replace(/<\/?[^>]+(>|$)/g, '');
          if (cleanUrl.startsWith('http') && !wfsUrls.includes(cleanUrl)) {
            wfsUrls.push(cleanUrl);
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          searchInObject(value, `${path}.${key}`);
        }
      }
    };
    
    searchInObject(data);
    
    if (wfsUrls.length > 0) {
      console.log(`   ✅ ${wfsUrls.length} WFS-URLs aus JSON extrahiert`);
      wfsUrls.forEach((url, index) => {
        console.log(`      ${index + 1}. ${url}`);
      });
      return wfsUrls;
    }
    
    console.log(`   ❌ Keine WFS-URLs in JSON gefunden`);
    return null;
    
  } catch (error) {
    console.log(`   ❌ JSON-Parsing fehlgeschlagen: ${error.message}`);
    return null;
  }
}

/**
 * Extrahiert WFS-URLs aus HTML-Content (wie Sachsen-Anhalt Metaver)
 */
function extractWFSURLsFromHTML(htmlContent, streamName) {
  try {
    // Suche nach WFS-URLs mit verschiedenen Patterns
    const wfsUrlPatterns = [
      /https?:\/\/[^"'\s]+wfs[^"'\s]*/gi,
      /https?:\/\/[^"'\s]+GetCapabilities[^"'\s]*/gi,
      /https?:\/\/[^"'\s]+service=WFS[^"'\s]*/gi,
      /https?:\/\/[^"'\s]+ows[^"'\s]*/gi
    ];
    
    let foundUrls = [];
    wfsUrlPatterns.forEach(pattern => {
      const matches = htmlContent.match(pattern);
      if (matches) {
        foundUrls.push(...matches);
      }
    });
    
    // Bereinige URLs
    foundUrls = foundUrls.map(url => 
      url.replace(/&amp;/g, '&')
         .replace(/<\/?[^>]+(>|$)/g, '')
         .replace(/['"]/g, '')
    );
    
    // Entferne Duplikate
    foundUrls = [...new Set(foundUrls)];
    
    if (foundUrls.length > 0) {
      console.log(`   ✅ ${foundUrls.length} WFS-URLs aus HTML extrahiert`);
      foundUrls.forEach((url, index) => {
        console.log(`      ${index + 1}. ${url}`);
      });
      return foundUrls;
    }
    
    console.log(`   ❌ Keine WFS-URLs in HTML gefunden`);
    return null;
    
  } catch (error) {
    console.log(`   ❌ HTML-Analyse fehlgeschlagen: ${error.message}`);
    return null;
  }
}

/**
 * Standardisiert den Feature-Typ basierend auf dem Layer-Titel
 */
function standardizeFeatureType(title) {
  if (!title) return null;
  const lowerTitle = title.toLowerCase();

  // Flurstücke
  const parcelKeywords = ['flurstück', 'liegenschaft', 'alkis', 'kataster'];
  if (parcelKeywords.some(kw => lowerTitle.includes(kw))) {
    return 'Flurstücke';
  }

  // Gebäudeumrisse
  const buildingKeywords = ['gebäude', 'hausumringe', 'building'];
  if (buildingKeywords.some(kw => lowerTitle.includes(kw))) {
    return 'Gebäudeumrisse';
  }
  
  // Adressen
  const addressKeywords = ['adresse', 'hauskoordinaten', 'address'];
  if (addressKeywords.some(kw => lowerTitle.includes(kw))) {
    return 'Adressen';
  }

  // Straßen
  const streetKeywords = ['straße', 'strassen', 'verkehr', 'street', 'road'];
  if (streetKeywords.some(kw => lowerTitle.includes(kw))) {
    return 'Straßennetz';
  }
  
  // Gewässer
  const waterKeywords = ['gewässer', 'hydro', 'water'];
  if (waterKeywords.some(kw => lowerTitle.includes(kw))) {
    return 'Gewässernetz';
  }

  return null; // Kein passender Typ gefunden
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
      let wfsUrl = stream.url;
      let extractedUrls = null;

      // Prüfe ob es ein Portal-Link ist
      if (isPortalLink(stream.url)) {
        console.log(`   🔍 Portal-Link erkannt - versuche WFS-URLs zu extrahieren`);
        extractedUrls = await extractWFSURLsFromPortal(stream.url, stream.service_title);
        
        if (extractedUrls && extractedUrls.length > 0) {
          // Verwende die erste gefundene WFS-URL
          wfsUrl = extractedUrls[0];
          console.log(`   ✅ Verwende extrahierte WFS-URL: ${wfsUrl}`);
        } else {
          console.log(`   ❌ Keine WFS-URLs aus Portal extrahiert - verwende Original-URL`);
        }
      }

      // Hole GetCapabilities XML mit der korrigierten URL
      const capabilities = await httpClient.getCapabilities(wfsUrl);
      
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

      // Extrahiere Service-Metadaten
      const serviceData = parseResult.service || {};
      console.log(`   🔧 Service-Metadaten:`);
      console.log(`      - WFS-Versionen: ${serviceData.versions ? serviceData.versions.join(', ') : 'N/A'}`);
      console.log(`      - Output-Formate: ${serviceData.outputFormats ? serviceData.outputFormats.join(', ') : 'N/A'}`);
      console.log(`      - Provider: ${serviceData.provider_name || 'N/A'}`);
      console.log(`      - INSPIRE-konform: ${serviceData.isInspire ? 'Ja' : 'Nein'}`);

      // Prüfe, ob bereits Layer für diesen Stream existieren
      const { data: existingLayers, error: existingError } = await supabase
        .from('wfs_layers')
        .select('id, name')
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

        // Intelligente Kategorisierung mit dem erweiterten Parser
        const smartCategory = parser.categorizeLayer({
          name: layer.name,
          title: layer.title,
          abstract: layer.abstract
        });

        const layerData = {
          wfs_id: stream.id,
          name: layer.name,
          titel: layer.title || layer.name,
          abstract: layer.abstract,
          default_crs: layer.defaultCRS,
          weitere_crs: layer.otherCRS,
          outputformate: layer.outputFormats,
          bbox_wgs84: layer.bbox,
          // ERWEITERT: Neue Metadaten-Felder
          schluesselwoerter: layer.keywords && layer.keywords.length > 0 ? layer.keywords : null,
          inspire_thema_codes: layer.inspireThemeCodes && layer.inspireThemeCodes.length > 0 ? layer.inspireThemeCodes : null,
          geometrietyp: layer.geometryType,
          feature_typ: smartCategory || standardizeFeatureType(layer.title), // Fallback auf alte Logik
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
          
          // Debug-Logging für neue Features
          if (layer.keywords && layer.keywords.length > 0) {
            console.log(`     🏷️  Keywords: ${layer.keywords.join(', ')}`);
          }
          if (smartCategory) {
            console.log(`     📂 Smart Category: ${smartCategory}`);
          }
          if (layer.inspireThemeCodes && layer.inspireThemeCodes.length > 0) {
            console.log(`     🌍 INSPIRE Themes: ${layer.inspireThemeCodes.join(', ')}`);
          }
        }
      }

      console.log(`   📥 Neue Layer eingefügt: ${insertedCount}`);

      // Aktualisiere Service-Metadaten und Layer-Anzahl in wfs_streams
      const updateData = {
        layer_anzahl: parseResult.layerCount,
        zuletzt_geprueft: new Date().toISOString()
      };

      // ERWEITERTE Service-Metadaten hinzufügen, falls verfügbar
      if (serviceData.versions && serviceData.versions.length > 0) {
        updateData.wfs_version = serviceData.versions;
      }
      
      if (serviceData.outputFormats && serviceData.outputFormats.length > 0) {
        updateData.standard_outputformate = serviceData.outputFormats;
      }
      
      if (serviceData.providerName) {
        updateData.provider_name = serviceData.providerName;
      }
      
      if (serviceData.providerSite) {
        updateData.provider_site = serviceData.providerSite;
      }
      
      // INSPIRE-Status basierend auf Parser-Ergebnis
      if (serviceData.isInspire !== undefined) {
        updateData.inspire_konform = serviceData.isInspire;
      }

      // Wenn WFS-URLs extrahiert wurden, aktualisiere die URL in der Datenbank
      if (extractedUrls && extractedUrls.length > 0) {
        try {
          await supabase
            .from('wfs_streams')
            .update({
              url: wfsUrl,
              validation_notes: `Portal-Link automatisch korrigiert. Gefundene URLs: ${extractedUrls.join(', ')}`
            })
            .eq('id', stream.id);
          
          console.log(`   ✅ URL automatisch von Portal-Link korrigiert`);
        } catch (urlUpdateError) {
          console.log(`   ❌ Fehler beim Aktualisieren der URL: ${urlUpdateError.message}`);
        }
      }

      const { error: updateError } = await supabase
        .from('wfs_streams')
        .update(updateData)
        .eq('id', stream.id);

      if (updateError) {
        console.log(`   ⚠️  Fehler beim Aktualisieren der Stream-Metadaten: ${updateError.message}`);
      } else {
        console.log(`   ✅ Service-Metadaten aktualisiert`);
      }

      totalLayers += parseResult.layerCount;
      successCount++;
      console.log(`   ✅ Erfolgreich verarbeitet\n`);

    } catch (error) {
      console.log(`   ❌ Fehler: ${error.message}\n`);
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
