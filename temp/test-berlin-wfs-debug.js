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
 * Debug-Parser für Berlin WFS
 */
class BerlinWFSParser {
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

  // Debug: Zeige alle möglichen Layer-Tags
  debugLayerTags(xml) {
    console.log('\n🔍 Debug: Suche nach Layer-Tags...');
    
    // Suche nach verschiedenen möglichen Layer-Tag-Formaten
    const possibleTags = [
      'wfs:FeatureType',
      'FeatureType',
      'wfs:FeatureTypeList',
      'FeatureTypeList',
      'wfs:FeatureTypeList/FeatureType',
      'wfs:FeatureTypeList/wfs:FeatureType'
    ];

    possibleTags.forEach(tag => {
      const matches = xml.match(new RegExp(`<${tag}[^>]*>`, 'g'));
      if (matches) {
        console.log(`   ✅ Gefunden: <${tag}> (${matches.length} mal)`);
      } else {
        console.log(`   ❌ Nicht gefunden: <${tag}>`);
      }
    });

    // Suche nach allen Tags, die "Feature" enthalten
    const featureTags = xml.match(/<[^>]*[Ff]eature[^>]*>/g);
    if (featureTags) {
      console.log(`\n🔍 Alle Tags mit "Feature":`);
      featureTags.slice(0, 10).forEach(tag => {
        console.log(`   ${tag}`);
      });
      if (featureTags.length > 10) {
        console.log(`   ... und ${featureTags.length - 10} weitere`);
      }
    }

    // Suche nach allen Tags, die "Type" enthalten
    const typeTags = xml.match(/<[^>]*[Tt]ype[^>]*>/g);
    if (typeTags) {
      console.log(`\n🔍 Alle Tags mit "Type":`);
      typeTags.slice(0, 10).forEach(tag => {
        console.log(`   ${tag}`);
      });
      if (typeTags.length > 10) {
        console.log(`   ... und ${typeTags.length - 10} weitere`);
      }
    }
  }

  // Debug: Zeige XML-Struktur um bestimmte Bereiche
  debugXMLStructure(xml) {
    console.log('\n🔍 Debug: XML-Struktur Analyse...');
    
    // Suche nach dem FeatureTypeList-Bereich
    const featureTypeListMatch = xml.match(/<wfs:FeatureTypeList[^>]*>(.*?)<\/wfs:FeatureTypeList>/s);
    if (featureTypeListMatch) {
      console.log('   ✅ FeatureTypeList gefunden');
      console.log('   📋 Inhalt (erste 500 Zeichen):');
      console.log('   ' + featureTypeListMatch[1].substring(0, 500).replace(/\n/g, '\n   '));
    } else {
      console.log('   ❌ FeatureTypeList nicht gefunden');
      
      // Suche nach alternativen Bereichen
      const alternatives = [
        'wfs:FeatureType',
        'FeatureType',
        'wfs:FeatureTypeList',
        'FeatureTypeList'
      ];
      
      alternatives.forEach(alt => {
        const altMatch = xml.match(new RegExp(`<${alt}[^>]*>.*?<\/${alt}>`, 'gs'));
        if (altMatch) {
          console.log(`   🔍 Alternative gefunden: <${alt}> (${altMatch.length} mal)`);
          console.log('   📋 Erster Match (erste 300 Zeichen):');
          console.log('   ' + altMatch[0].substring(0, 300).replace(/\n/g, '\n   '));
        }
      });
    }
  }

  // Versuche Layer mit verschiedenen Parsing-Strategien zu extrahieren
  extractLayersWithMultipleStrategies(xml) {
    console.log('\n🔍 Debug: Layer-Extraktion mit verschiedenen Strategien...');
    
    const strategies = [
      {
        name: 'Standard WFS 2.0.0',
        pattern: /<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs,
        namePattern: /<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s,
        titlePattern: /<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s
      },
      {
        name: 'Standard WFS 1.1.0',
        pattern: /<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs,
        namePattern: /<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s,
        titlePattern: /<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s
      },
      {
        name: 'Alternative FeatureType',
        pattern: /<FeatureType>(.*?)<\/FeatureType>/gs,
        namePattern: /<Name[^>]*>(.*?)<\/Name>/s,
        titlePattern: /<Title[^>]*>(.*?)<\/Title>/s
      },
      {
        name: 'Berlin-spezifisch',
        pattern: /<wfs:FeatureType[^>]*>(.*?)<\/wfs:FeatureType>/gs,
        namePattern: /<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s,
        titlePattern: /<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s
      }
    ];

    strategies.forEach((strategy, index) => {
      console.log(`\n   🔧 Strategie ${index + 1}: ${strategy.name}`);
      
      const matches = xml.match(strategy.pattern);
      if (matches) {
        console.log(`   ✅ ${matches.length} Matches gefunden`);
        
        // Analysiere den ersten Match
        if (matches.length > 0) {
          const firstMatch = matches[0];
          console.log(`   📋 Erster Match (erste 200 Zeichen):`);
          console.log('   ' + firstMatch.substring(0, 200).replace(/\n/g, '\n   '));
          
          // Teste Name-Extraktion
          const nameMatch = firstMatch.match(strategy.namePattern);
          if (nameMatch) {
            console.log(`   ✅ Name extrahiert: ${nameMatch[1].trim()}`);
          } else {
            console.log(`   ❌ Name konnte nicht extrahiert werden`);
          }
          
          // Teste Title-Extraktion
          const titleMatch = firstMatch.match(strategy.titlePattern);
          if (titleMatch) {
            console.log(`   ✅ Title extrahiert: ${titleMatch[1].trim()}`);
          } else {
            console.log(`   ❌ Title konnte nicht extrahiert werden`);
          }
        }
      } else {
        console.log(`   ❌ Keine Matches gefunden`);
      }
    });
  }

  parse(xml) {
    console.log('\n🔍 Debug: Starte XML-Parsing...');
    
    // Debug-Analysen
    this.debugLayerTags(xml);
    this.debugXMLStructure(xml);
    this.extractLayersWithMultipleStrategies(xml);
    
    // Versuche normale Extraktion
    const layers = [];
    const wfs20Layers = xml.match(/<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs);
    
    if (wfs20Layers) {
      console.log(`\n✅ Normale Extraktion: ${wfs20Layers.length} Layer gefunden`);
      wfs20Layers.forEach((layerXml, index) => {
        const nameMatch = layerXml.match(/<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s);
        const titleMatch = layerXml.match(/<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s);
        
        if (nameMatch) {
          layers.push({
            name: nameMatch[1].trim(),
            title: titleMatch ? titleMatch[1].trim() : nameMatch[1].trim()
          });
        }
      });
    } else {
      console.log('\n❌ Normale Extraktion fehlgeschlagen');
    }

    return {
      success: true,
      layers: layers,
      count: layers.length,
      version: this.extractWFSVersion(xml),
      title: this.extractServiceTitle(xml),
      abstract: this.extractServiceAbstract(xml)
    };
  }
}

/**
 * Debug-Test für Berlin WFS
 */
async function debugBerlinWFS() {
  console.log('🔍 Debug-Test für Berlin WFS-Service...\n');

  const berlinUrl = 'https://gdi.berlin.de/services/wfs/alkis_flurstuecke?REQUEST=GetCapabilities&SERVICE=wfs';
  
  console.log(`📡 URL: ${berlinUrl}`);
  
  const httpClient = new WFSHTTPClient();
  const parser = new BerlinWFSParser();

  // Teste den Service
  const capabilities = await httpClient.getCapabilities(berlinUrl);
  
  if (!capabilities.success) {
    console.log(`❌ Service nicht erreichbar: ${capabilities.error}`);
    return;
  }

  console.log(`✅ Service erfolgreich erreicht! (HTTP ${capabilities.statusCode})`);
  console.log(`📏 XML-Größe: ${capabilities.xml.length} Zeichen`);
  
  // Parse XML mit Debug-Informationen
  const parseResult = parser.parse(capabilities.xml);
  
  console.log(`\n📊 Finale Ergebnisse:`);
  console.log(`   Titel: ${parseResult.title}`);
  console.log(`   Abstract: ${parseResult.abstract}`);
  console.log(`   WFS Version: ${parseResult.version}`);
  console.log(`   Layer-Anzahl: ${parseResult.count}`);

  if (parseResult.count > 0) {
    console.log(`\n📋 Gefundene Layer:`);
    parseResult.layers.forEach((layer, index) => {
      console.log(`   ${index + 1}. ${layer.name}: ${layer.title}`);
    });
  }

  console.log('\n🎉 Berlin WFS Debug-Test abgeschlossen!');
}

// Führe das Debug-Skript aus
debugBerlinWFS().catch(console.error);
