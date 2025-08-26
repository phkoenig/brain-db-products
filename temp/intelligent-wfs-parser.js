const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Supabase Client Setup
const supabaseUrl = 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Intelligenter WFS Parser mit Soft Logic
 */
class IntelligentWFSParser {
  constructor() {
    // Verschiedene Parsing-Strategien für unterschiedliche XML-Strukturen
    this.parsingStrategies = [
      {
        name: 'Standard WFS 2.0.0',
        description: 'Normale WFS 2.0.0 Struktur mit wfs:FeatureType',
        layerPattern: /<wfs:FeatureType[^>]*>(.*?)<\/wfs:FeatureType>/gs,
        namePatterns: [
          /<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s,
          /<Name[^>]*>(.*?)<\/Name>/s
        ],
        titlePatterns: [
          /<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s,
          /<Title[^>]*>(.*?)<\/Title>/s
        ],
        abstractPatterns: [
          /<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s,
          /<Abstract[^>]*>(.*?)<\/Abstract>/s
        ]
      },
      {
        name: 'WFS 1.1.0 Style',
        description: 'WFS 1.1.0 Struktur ohne Namespace',
        layerPattern: /<FeatureType[^>]*>(.*?)<\/FeatureType>/gs,
        namePatterns: [
          /<Name[^>]*>(.*?)<\/Name>/s,
          /<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s
        ],
        titlePatterns: [
          /<Title[^>]*>(.*?)<\/Title>/s,
          /<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s
        ],
        abstractPatterns: [
          /<Abstract[^>]*>(.*?)<\/Abstract>/s,
          /<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s
        ]
      },
      {
        name: 'Berlin-spezifisch',
        description: 'Spezielle Berlin WFS-Struktur',
        layerPattern: /<wfs:FeatureType[^>]*>(.*?)<\/wfs:FeatureType>/gs,
        namePatterns: [
          /<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s,
          /<Name[^>]*>(.*?)<\/Name>/s
        ],
        titlePatterns: [
          /<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s,
          /<Title[^>]*>(.*?)<\/Title>/s
        ],
        abstractPatterns: [
          /<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s,
          /<Abstract[^>]*>(.*?)<\/Abstract>/s
        ]
      },
      {
        name: 'Generic Feature Detection',
        description: 'Generische Erkennung von Feature-bezogenen Tags',
        layerPattern: /<[^>]*[Ff]eature[^>]*>(.*?)<\/[^>]*[Ff]eature[^>]*>/gs,
        namePatterns: [
          /<[^>]*[Nn]ame[^>]*>(.*?)<\/[^>]*[Nn]ame[^>]*>/s,
          /<[^>]*[Ii]d[^>]*>(.*?)<\/[^>]*[Ii]d[^>]*>/s
        ],
        titlePatterns: [
          /<[^>]*[Tt]itle[^>]*>(.*?)<\/[^>]*[Tt]itle[^>]*>/s,
          /<[^>]*[Nn]ame[^>]*>(.*?)<\/[^>]*[Nn]ame[^>]*>/s
        ],
        abstractPatterns: [
          /<[^>]*[Aa]bstract[^>]*>(.*?)<\/[^>]*[Aa]bstract[^>]*>/s
        ]
      }
    ];
  }

  /**
   * Intelligente Layer-Extraktion mit mehreren Strategien
   */
  extractLayersIntelligently(xml) {
    console.log('\n🧠 Intelligente Layer-Extraktion gestartet...');
    
    let bestResult = { layers: [], count: 0, strategy: null, confidence: 0 };
    
    // Teste alle Parsing-Strategien
    for (const strategy of this.parsingStrategies) {
      console.log(`\n🔧 Teste Strategie: ${strategy.name}`);
      console.log(`   Beschreibung: ${strategy.description}`);
      
      try {
        const result = this.extractLayersWithStrategy(xml, strategy);
        
        if (result.count > 0) {
          console.log(`   ✅ ${result.count} Layer gefunden`);
          
          // Bewerte die Qualität der Ergebnisse
          const confidence = this.calculateConfidence(result, strategy);
          console.log(`   📊 Konfidenz: ${confidence.toFixed(1)}%`);
          
          // Wähle das beste Ergebnis
          if (confidence > bestResult.confidence) {
            bestResult = { ...result, strategy: strategy.name, confidence };
            console.log(`   🏆 Neuer bester Fund!`);
          }
        } else {
          console.log(`   ❌ Keine Layer gefunden`);
        }
      } catch (error) {
        console.log(`   ⚠️  Fehler bei Strategie: ${error.message}`);
      }
    }
    
    if (bestResult.count > 0) {
      console.log(`\n🎯 Beste Strategie: ${bestResult.strategy} (Konfidenz: ${bestResult.confidence.toFixed(1)}%)`);
      console.log(`📋 Gefundene Layer: ${bestResult.count}`);
    } else {
      console.log('\n❌ Keine Layer mit keiner Strategie gefunden');
    }
    
    return bestResult;
  }

  /**
   * Extrahiert Layer mit einer spezifischen Strategie
   */
  extractLayersWithStrategy(xml, strategy) {
    const layers = [];
    const matches = xml.match(strategy.layerPattern);
    
    if (!matches) return { layers: [], count: 0 };
    
    for (const layerXml of matches) {
      const layer = this.extractLayerInfo(layerXml, strategy);
      if (layer && layer.name) {
        layers.push(layer);
      }
    }
    
    return { layers, count: layers.length };
  }

  /**
   * Extrahiert Layer-Informationen mit flexiblen Patterns
   */
  extractLayerInfo(layerXml, strategy) {
    // Versuche verschiedene Name-Patterns
    let name = null;
    for (const namePattern of strategy.namePatterns) {
      const match = layerXml.match(namePattern);
      if (match && match[1].trim()) {
        name = match[1].trim();
        break;
      }
    }
    
    if (!name) return null;
    
    // Versuche verschiedene Title-Patterns
    let title = name; // Fallback auf Name
    for (const titlePattern of strategy.titlePatterns) {
      const match = layerXml.match(titlePattern);
      if (match && match[1].trim()) {
        title = match[1].trim();
        break;
      }
    }
    
    // Versuche Abstract zu extrahieren
    let abstract = null;
    for (const abstractPattern of strategy.abstractPatterns) {
      const match = layerXml.match(abstractPattern);
      if (match && match[1].trim()) {
        abstract = match[1].trim();
        break;
      }
    }
    
    return { name, title, abstract };
  }

  /**
   * Berechnet die Konfidenz einer Extraktion
   */
  calculateConfidence(result, strategy) {
    let confidence = 0;
    
    // Basis-Konfidenz basierend auf Anzahl der gefundenen Layer
    if (result.count > 0) {
      confidence += 30;
      
      // Höhere Konfidenz für mehr Layer (wahrscheinlich korrekte Erkennung)
      if (result.count > 5) confidence += 20;
      if (result.count > 10) confidence += 20;
    }
    
    // Konfidenz basierend auf Strategie-Typ
    if (strategy.name.includes('Standard')) confidence += 25;
    if (strategy.name.includes('Generic')) confidence -= 10; // Weniger spezifisch
    
    // Konfidenz basierend auf Datenqualität
    const validLayers = result.layers.filter(layer => 
      layer.name && layer.name.length > 0 && 
      !layer.name.includes('xmlns') && 
      !layer.name.includes('schema')
    );
    
    if (validLayers.length > 0) {
      confidence += 25;
    }
    
    return Math.min(confidence, 100);
  }

  /**
   * Fallback: Suche nach Layer-Namen mit generischen Patterns
   */
  fallbackLayerExtraction(xml) {
    console.log('\n🔄 Fallback: Generische Layer-Erkennung...');
    
    const fallbackPatterns = [
      // Suche nach allen möglichen Layer-ähnlichen Tags
      /<[^>]*[Ff]eature[^>]*[Tt]ype[^>]*>(.*?)<\/[^>]*[Ff]eature[^>]*[Tt]ype[^>]*>/gs,
      /<[^>]*[Tt]ype[^>]*[Ff]eature[^>]*>(.*?)<\/[^>]*[Tt]ype[^>]*[Ff]eature[^>]*>/gs,
      // Suche nach Tags, die "Type" enthalten
      /<[^>]*[Tt]ype[^>]*>(.*?)<\/[^>]*[Tt]ype[^>]*>/gs,
      // Suche nach Tags, die "Layer" enthalten
      /<[^>]*[Ll]ayer[^>]*>(.*?)<\/[^>]*[Ll]ayer[^>]*>/gs
    ];
    
    for (const pattern of fallbackPatterns) {
      const matches = xml.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`   🔍 Fallback-Pattern gefunden: ${matches.length} Matches`);
        
        const layers = [];
        for (const match of matches) {
          // Versuche Name zu extrahieren
          const nameMatch = match.match(/<[^>]*[Nn]ame[^>]*>(.*?)<\/[^>]*[Nn]ame[^>]*>/s);
          if (nameMatch && nameMatch[1].trim()) {
            const name = nameMatch[1].trim();
            if (name.length > 0 && !name.includes('xmlns')) {
              layers.push({ name, title: name, abstract: null });
            }
          }
        }
        
        if (layers.length > 0) {
          console.log(`   ✅ Fallback erfolgreich: ${layers.length} Layer gefunden`);
          return { layers, count: layers.length, strategy: 'Fallback', confidence: 50 };
        }
      }
    }
    
    console.log('   ❌ Fallback fehlgeschlagen');
    return { layers: [], count: 0, strategy: 'Fallback', confidence: 0 };
  }

  /**
   * Hauptmethode für intelligente Layer-Extraktion
   */
  parse(xml) {
    console.log('\n🧠 Starte intelligente WFS-Parsing...');
    
    // Versuche zuerst die intelligenten Strategien
    const intelligentResult = this.extractLayersIntelligently(xml);
    
    // Falls keine Layer gefunden wurden, versuche Fallback
    if (intelligentResult.count === 0) {
      console.log('\n🔄 Keine Layer mit intelligenten Strategien gefunden, versuche Fallback...');
      const fallbackResult = this.fallbackLayerExtraction(xml);
      
      if (fallbackResult.count > 0) {
        return {
          success: true,
          layers: fallbackResult.layers,
          count: fallbackResult.count,
          strategy: fallbackResult.strategy,
          confidence: fallbackResult.confidence,
          version: this.extractWFSVersion(xml),
          title: this.extractServiceTitle(xml),
          abstract: this.extractServiceAbstract(xml)
        };
      }
    }
    
    return {
      success: true,
      layers: intelligentResult.layers,
      count: intelligentResult.count,
      strategy: intelligentResult.strategy,
      confidence: intelligentResult.confidence,
      version: this.extractWFSVersion(xml),
      title: this.extractServiceTitle(xml),
      abstract: this.extractServiceAbstract(xml)
    };
  }

  // Standard-Extraktionsmethoden
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
}

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
 * Testet den intelligenten Parser mit dem Berlin WFS-Service
 */
async function testIntelligentParser() {
  console.log('🧠 Test des intelligenten WFS-Parsers...\n');

  const berlinUrl = 'https://gdi.berlin.de/services/wfs/alkis_flurstuecke?REQUEST=GetCapabilities&SERVICE=wfs';
  
  console.log(`📡 URL: ${berlinUrl}`);
  
  const httpClient = new WFSHTTPClient();
  const parser = new IntelligentWFSParser();

  // Teste den Service
  const capabilities = await httpClient.getCapabilities(berlinUrl);
  
  if (!capabilities.success) {
    console.log(`❌ Service nicht erreichbar: ${capabilities.error}`);
    return;
  }

  console.log(`✅ Service erfolgreich erreicht! (HTTP ${capabilities.statusCode})`);
  console.log(`📏 XML-Größe: ${capabilities.xml.length} Zeichen`);
  
  // Parse XML mit intelligentem Parser
  const parseResult = parser.parse(capabilities.xml);
  
  console.log(`\n📊 Finale Ergebnisse:`);
  console.log(`   Titel: ${parseResult.title}`);
  console.log(`   Abstract: ${parseResult.abstract}`);
  console.log(`   WFS Version: ${parseResult.version}`);
  console.log(`   Layer-Anzahl: ${parseResult.count}`);
  console.log(`   Verwendete Strategie: ${parseResult.strategy}`);
  console.log(`   Konfidenz: ${parseResult.confidence.toFixed(1)}%`);

  if (parseResult.count > 0) {
    console.log(`\n📋 Gefundene Layer:`);
    parseResult.layers.slice(0, 10).forEach((layer, index) => {
      console.log(`   ${index + 1}. ${layer.name}: ${layer.title}`);
    });
    if (parseResult.layers.length > 10) {
      console.log(`   ... und ${parseResult.layers.length - 10} weitere`);
    }
  }

  console.log('\n🎉 Intelligenter Parser Test abgeschlossen!');
}

// Führe das Skript aus
testIntelligentParser().catch(console.error);
