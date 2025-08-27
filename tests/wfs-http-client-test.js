/**
 * WFS HTTP Client Tests
 * 
 * Testet die Funktionalität zum Abrufen von WFS-GetCapabilities XML-Dokumenten
 * über HTTP-Requests.
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https-proxy-agent');
const http = require('http');
const { URL } = require('url');
const axios = require('axios');
const zlib = require('zlib');

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test WFS-URLs aus den Testdaten
const TEST_WFS_URLS = {
  // Funktionierende URLs
  working: [
    'https://inspire.brandenburg.de/services/cp_alkis_wfs?request=GetCapabilities&service=WFS',
    'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_flurstuecke',
    'https://geodienste.hamburg.de/HH_WFS_INSPIRE_Flurstuecke?SERVICE=WFS&REQUEST=GetCapabilities'
  ],
  
  // URLs die wahrscheinlich funktionieren
  likelyWorking: [
    'https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-flurstuecke_alkis?request=GetCapabilities&service=WFS',
    'https://www.geoportal.rlp.de/registry/wfs/519?REQUEST=GetCapabilities&VERSION=2.0.0&SERVICE=WFS',
    'https://geodienste.sachsen.de/aaa/public_alkis/vereinf/wfs?request=GetCapabilities&service=WFS'
  ],
  
  // Ungültige URLs für Fehlertests
  invalid: [
    'https://invalid-wfs-url-that-does-not-exist.com/wfs?request=GetCapabilities',
    'https://httpbin.org/status/404',
    'https://httpbin.org/status/500'
  ]
};

/**
 * WFS HTTP Client Klasse
 */
class WFSHTTPClient {
  constructor(options = {}) {
    this.timeout = options.timeout || 60000; // Timeout auf 60 Sekunden erhöht
    this.maxRedirects = 3;
    this.userAgent = 'WFS-Catalog-Bot/1.0';
  }

  /**
   * Führt einen HTTP-Request aus
   */
  async makeRequest(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(url, {
          headers: {
            'Accept-Encoding': 'gzip, deflate, br',
          },
          responseType: 'stream', // Wichtig: Antwort als Stream verarbeiten
          timeout: this.timeout
        });

        const stream = response.data;
        let chunks = [];
        let totalSize = 0;
        const sizeLimit = 15 * 1024 * 1024; // 15 MB Reißleine

        stream.on('data', chunk => {
          totalSize += chunk.length;
          if (totalSize > sizeLimit) {
            stream.destroy(); // Download aktiv abbrechen
            resolve({ 
              statusCode: -3, // Eigener Status-Code für "zu groß"
              error: `Download abgebrochen: Antwort war größer als ${sizeLimit / 1024 / 1024} MB`,
              headers: response.headers 
            });
            return;
          }
          chunks.push(chunk);
        });

        stream.on('end', () => {
          let responseDataBuffer = Buffer.concat(chunks);
          const encoding = response.headers['content-encoding'];

          try {
            if (encoding === 'gzip') {
              responseDataBuffer = zlib.gunzipSync(responseDataBuffer);
            } else if (encoding === 'deflate') {
              responseDataBuffer = zlib.inflateSync(responseDataBuffer);
            }
            const responseText = responseDataBuffer.toString();
            resolve({
              statusCode: response.status,
              data: responseText,
              headers: response.headers
            });
          } catch (e) {
             resolve({ statusCode: -4, error: `Dekomprimierung fehlgeschlagen: ${e.message}`, headers: response.headers });
          }
        });

        stream.on('error', err => {
          resolve({ statusCode: -1, error: `Netzwerk Stream Fehler: ${err.message}`, headers: response.headers || {} });
        });

      } catch (error) {
        if (error.response) {
          resolve({
            statusCode: error.response.status,
            data: error.response.data ? error.response.data.toString() : null,
            error: `HTTP Error ${error.response.status}`,
            headers: error.response.headers || {}
          });
        } else if (error.request) {
          resolve({ statusCode: -1, error: 'Netzwerk Error: Keine Antwort erhalten.', headers: {} });
        } else {
          resolve({ statusCode: -2, error: `Anfrage-Fehler: ${error.message}`, headers: {} });
        }
      }
    });
  }

  /**
   * Ruft WFS-GetCapabilities XML ab und probiert dabei mehrere WFS-Versionen.
   */
  async fetchGetCapabilities(wfsUrl) {
    const versionsToTry = ['2.0.0', '1.1.0', '1.0.0', null]; // null für eine Anfrage ohne Versions-Parameter
    let lastError = null;

    for (const version of versionsToTry) {
      try {
        const url = this.buildGetCapabilitiesUrl(wfsUrl, version);
        console.log(`   🔍 Requesting (v${version || 'default'}): ${url}`);
        
        const response = await this.makeRequest(url);
        
        if (response.statusCode !== 200) {
          throw new Error(`HTTP ${response.statusCode}`);
        }
        
        const contentType = response.headers['content-type'] || '';
        const isXmlResponse = contentType.includes('xml') || contentType.includes('text');
        const looksLikeWfsXml = response.data.includes('WFS_Capabilities') || response.data.includes('wfs:WFS_Capabilities');

        if (isXmlResponse && looksLikeWfsXml) {
          // Erfolg!
          return {
            success: true,
            url: url,
            statusCode: response.statusCode,
            contentType: contentType,
            data: response.data,
            size: response.data.length
          };
        } else {
            // Die Antwort ist kein XML, das wie WFS aussieht. Wir probieren die nächste Version.
            lastError = `Response for v${version} does not appear to be valid WFS GetCapabilities XML`;
        }
        
      } catch (error) {
        lastError = error.error || error.message;
        // Bei Fehler zur nächsten Version übergehen
      }
    }
    
    // Wenn alle Versionen fehlschlagen
    return {
      success: false,
      url: wfsUrl,
      error: lastError || 'Unknown error after trying all versions',
      type: 'fetch_error'
    };
  }

  /**
   * Baut GetCapabilities-URL
   */
  buildGetCapabilitiesUrl(baseUrl, version = null) {
    try {
      const url = new URL(baseUrl);
      
      // Normalisiere und setze Standardparameter
      const params = new URLSearchParams();
      // Übernehme bestehende Parameter, aber überschreibe WFS-spezifische
      for (const [key, value] of url.searchParams.entries()) {
          if (key.toLowerCase() !== 'service' && key.toLowerCase() !== 'request' && key.toLowerCase() !== 'version') {
              params.append(key, value);
          }
      }
      
      params.set('service', 'WFS');
      params.set('request', 'GetCapabilities');
      if (version) {
        params.set('version', version);
      }
      
      url.search = params.toString();
      return url.toString();

    } catch (error) {
      // Fallback für ungültige Basis-URLs
      let finalUrl = baseUrl.split('?')[0];
      finalUrl += '?service=WFS&request=GetCapabilities';
      if (version) {
        finalUrl += `&version=${version}`;
      }
      return finalUrl;
    }
  }

  /**
   * Holt die Features (Geodaten) für einen bestimmten Layer von einem WFS-Stream.
   * @param {object} params - Die Parameter für die Anfrage.
   * @returns {Promise<object>} Ein Objekt mit den abgerufenen Feature-Daten.
   */
  async getFeatures({ streamUrl, layerName, wfsVersion = '2.0.0', outputFormat = null, outputFormats = [], count = 10 }) {
    // SICHERSTELLEN, dass wfsVersion ein String ist, kein Array
    const versionString = Array.isArray(wfsVersion) ? wfsVersion[0] : wfsVersion;

    const typeNameParam = versionString && versionString.startsWith('2.') ? 'typeNames' : 'typeName';
    const countParamName = versionString && versionString.startsWith('2.') ? 'count' : 'maxFeatures'; // NEU: Intelligenter Parameter-Name
    const baseUrl = streamUrl.includes('?') ? streamUrl.split('?')[0] : streamUrl;

    // Intelligente Auswahl des Output-Formats mit Priorisierung
    let preferredFormat = '';
    if (outputFormat) { // Priorität 1: Ein explizit übergebenes Format wird immer bevorzugt
        preferredFormat = outputFormat;
    } else if (outputFormats && outputFormats.length > 0) { // Priorität 2: Intelligente Auswahl aus der Liste
        const jsonFormat = outputFormats.find(f => f.toLowerCase().includes('json'));
        if (jsonFormat) {
            preferredFormat = jsonFormat;
        } else {
            preferredFormat = outputFormats[0]; // Nimm das erste verfügbare, wenn kein JSON da ist
        }
    } else { // Priorität 3: Allgemeiner Fallback
        preferredFormat = 'application/json';
    }

    const params = new URLSearchParams({
      service: 'WFS',
      request: 'GetFeature',
      version: versionString,
      [typeNameParam]: layerName,
      [countParamName]: count.toString(), // NEU: Korrekten Parameter verwenden
      outputFormat: preferredFormat
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log(`   🔍 Requesting Features: ${fullUrl}`);

    try {
      const response = await this.makeRequest(fullUrl);
      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}: ${response.data}`);
      }

      // Wenn JSON angefordert wurde, versuche es zu parsen
      if (preferredFormat.toLowerCase().includes('json')) {
        try {
          const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          return { success: true, data };
        } catch (parseError) {
          console.error(`   - Fehler beim Parsen der JSON-Antwort. Gebe Rohdaten zurück.`);
          return { success: false, error: 'Konnte die JSON-Antwort nicht parsen.', data: response.data };
        }
      } else {
        // Bei anderen Formaten (XML/GML), gib die Rohdaten als String zurück
        return { success: true, data: response.data };
      }

    } catch (error) {
      console.error(`   - Fehler bei GetFeature für ${layerName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validiert WFS-URL
   */
  validateWFSURL(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Grundlegende URL-Validierung
      if (!parsedUrl.protocol || !parsedUrl.hostname) {
        return { valid: false, error: 'Invalid URL format' };
      }
      
      // Protokoll prüfen
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, error: 'Only HTTP/HTTPS protocols supported' };
      }
      
      // Hostname prüfen
      if (parsedUrl.hostname.length === 0) {
        return { valid: false, error: 'Empty hostname' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'URL parsing failed' };
    }
  }

  /**
   * Batch-Request für mehrere URLs
   */
  async fetchMultipleGetCapabilities(urls, concurrency = 3) {
    const results = [];
    const chunks = this.chunkArray(urls, concurrency);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(url => this.fetchGetCapabilities(url));
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            url: chunk[index],
            error: result.reason.message || 'Unknown error',
            type: 'promise_rejection'
          });
        }
      });
      
      // Kurze Pause zwischen Chunks
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Teilt Array in Chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Test-Suite für WFS HTTP Client
 */
class WFSHTTPClientTestSuite {
  constructor() {
    this.client = new WFSHTTPClient();
    this.testResults = [];
  }

  /**
   * Führt alle Tests aus
   */
  async runAllTests() {
    console.log('🧪 Starte WFS HTTP Client Tests...\n');

    try {
      // Test 1: URL-Validierung
      await this.testURLValidation();

      // Test 2: GetCapabilities URL-Building
      await this.testGetCapabilitiesURLBuilding();

      // Test 3: HTTP-Request Funktionalität
      await this.testHTTPRequestFunctionality();

      // Test 4: Einzelne GetCapabilities Requests
      await this.testSingleGetCapabilitiesRequests();

      // Test 5: Batch-Requests
      await this.testBatchRequests();

      // Test 6: Fehlerbehandlung
      await this.testErrorHandling();

      // Test 7: Supabase-Integration
      await this.testSupabaseIntegration();

      // Test-Ergebnisse ausgeben
      this.printTestResults();

    } catch (error) {
      console.error('❌ Fehler beim Ausführen der Tests:', error);
    }
  }

  /**
   * Test 1: URL-Validierung
   */
  async testURLValidation() {
    console.log('📋 Test 1: URL-Validierung');
    
    try {
      const testUrls = [
        { url: 'https://example.com/wfs', expected: true },
        { url: 'http://example.com/wfs', expected: true },
        { url: 'ftp://example.com/wfs', expected: false },
        { url: 'invalid-url', expected: false },
        { url: '', expected: false }
      ];

      let allTestsPassed = true;
      
      for (const test of testUrls) {
        const result = this.client.validateWFSURL(test.url);
        const passed = result.valid === test.expected;
        
        if (!passed) {
          allTestsPassed = false;
          console.log(`   ❌ ${test.url}: Expected ${test.expected}, got ${result.valid}`);
        } else {
          console.log(`   ✅ ${test.url}: Validierung erfolgreich`);
        }
      }
      
      this.addTestResult('URL-Validierung', allTestsPassed, `${testUrls.length} URLs getestet`);
    } catch (error) {
      this.addTestResult('URL-Validierung', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 2: GetCapabilities URL-Building
   */
  async testGetCapabilitiesURLBuilding() {
    console.log('📋 Test 2: GetCapabilities URL-Building');
    
    try {
      const testCases = [
        {
          input: 'https://example.com/wfs',
          expected: 'https://example.com/wfs?request=GetCapabilities&service=WFS'
        },
        {
          input: 'https://example.com/wfs?version=2.0.0',
          expected: 'https://example.com/wfs?version=2.0.0&request=GetCapabilities&service=WFS'
        },
        {
          input: 'https://example.com/wfs?request=GetCapabilities&service=WFS',
          expected: 'https://example.com/wfs?request=GetCapabilities&service=WFS'
        }
      ];

      let allTestsPassed = true;
      
      for (const testCase of testCases) {
        const result = this.client.buildGetCapabilitiesUrl(testCase.input);
        const passed = result === testCase.expected;
        
        if (!passed) {
          allTestsPassed = false;
          console.log(`   ❌ Input: ${testCase.input}`);
          console.log(`      Expected: ${testCase.expected}`);
          console.log(`      Got: ${result}`);
        } else {
          console.log(`   ✅ ${testCase.input} -> ${result}`);
        }
      }
      
      this.addTestResult('GetCapabilities URL-Building', allTestsPassed, `${testCases.length} Test-Cases`);
    } catch (error) {
      this.addTestResult('GetCapabilities URL-Building', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 3: HTTP-Request Funktionalität
   */
  async testHTTPRequestFunctionality() {
    console.log('📋 Test 3: HTTP-Request Funktionalität');
    
    try {
      // Test mit httpbin.org (reliable test endpoint)
      const testUrl = 'https://httpbin.org/xml';
      
      const result = await this.client.makeRequest(testUrl);
      
      if (result.statusCode === 200 && result.data.includes('<?xml')) {
        console.log('   ✅ HTTP-Request erfolgreich');
        console.log(`   ✅ Status: ${result.statusCode}`);
        console.log(`   ✅ Content-Type: ${result.headers['content-type']}`);
        console.log(`   ✅ Data-Size: ${result.data.length} bytes`);
        
        this.addTestResult('HTTP-Request Funktionalität', true, 'HTTP-Request erfolgreich ausgeführt');
      } else {
        this.addTestResult('HTTP-Request Funktionalität', false, `Unerwartete Response: ${result.statusCode}`);
      }
    } catch (error) {
      this.addTestResult('HTTP-Request Funktionalität', false, `Fehler: ${error.error || error.message}`);
    }
  }

  /**
   * Test 4: Einzelne GetCapabilities Requests
   */
  async testSingleGetCapabilitiesRequests() {
    console.log('📋 Test 4: Einzelne GetCapabilities Requests');
    
    try {
      // Test mit einer wahrscheinlich funktionierenden URL
      const testUrl = TEST_WFS_URLS.likelyWorking[0];
      
      const result = await this.client.fetchGetCapabilities(testUrl);
      
      if (result.success) {
        console.log('   ✅ GetCapabilities Request erfolgreich');
        console.log(`   ✅ URL: ${result.url}`);
        console.log(`   ✅ Status: ${result.statusCode}`);
        console.log(`   ✅ Content-Type: ${result.contentType}`);
        console.log(`   ✅ Data-Size: ${result.size} bytes`);
        
        // Prüfen ob es WFS-XML ist
        if (result.data.includes('WFS_Capabilities') || result.data.includes('wfs:WFS_Capabilities')) {
          console.log('   ✅ WFS-GetCapabilities XML erkannt');
          this.addTestResult('Einzelne GetCapabilities Requests', true, 'WFS-GetCapabilities erfolgreich abgerufen');
        } else {
          console.log('   ⚠️  Response scheint kein WFS-GetCapabilities zu sein');
          this.addTestResult('Einzelne GetCapabilities Requests', false, 'Response ist kein WFS-GetCapabilities XML');
        }
      } else {
        console.log(`   ❌ Request fehlgeschlagen: ${result.error}`);
        this.addTestResult('Einzelne GetCapabilities Requests', false, `Fehler: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('Einzelne GetCapabilities Requests', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 5: Batch-Requests
   */
  async testBatchRequests() {
    console.log('📋 Test 5: Batch-Requests');
    
    try {
      // Test mit 2 URLs (kleiner Batch)
      const testUrls = TEST_WFS_URLS.likelyWorking.slice(0, 2);
      
      const results = await this.client.fetchMultipleGetCapabilities(testUrls, 2);
      
      console.log(`   📊 Batch-Request abgeschlossen: ${results.length} URLs`);
      
      let successfulRequests = 0;
      let failedRequests = 0;
      
      results.forEach((result, index) => {
        if (result.success) {
          successfulRequests++;
          console.log(`   ✅ URL ${index + 1}: Erfolgreich (${result.size} bytes)`);
        } else {
          failedRequests++;
          console.log(`   ❌ URL ${index + 1}: ${result.error}`);
        }
      });
      
      const successRate = (successfulRequests / results.length) * 100;
      console.log(`   📈 Erfolgsrate: ${successRate.toFixed(1)}%`);
      
      this.addTestResult('Batch-Requests', successfulRequests > 0, 
        `${successfulRequests}/${results.length} Requests erfolgreich (${successRate.toFixed(1)}%)`);
    } catch (error) {
      this.addTestResult('Batch-Requests', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 6: Fehlerbehandlung
   */
  async testErrorHandling() {
    console.log('📋 Test 6: Fehlerbehandlung');
    
    try {
      // Test mit ungültigen URLs
      const testUrl = TEST_WFS_URLS.invalid[0];
      
      const result = await this.client.fetchGetCapabilities(testUrl);
      
      if (!result.success) {
        console.log(`   ✅ Fehler korrekt abgefangen: ${result.error}`);
        console.log(`   ✅ Error-Type: ${result.type}`);
        
        this.addTestResult('Fehlerbehandlung', true, `Fehler korrekt behandelt: ${result.type}`);
      } else {
        this.addTestResult('Fehlerbehandlung', false, 'Ungültige URL wurde nicht als Fehler erkannt');
      }
    } catch (error) {
      this.addTestResult('Fehlerbehandlung', true, `Exception korrekt abgefangen: ${error.message}`);
    }
  }

  /**
   * Test 7: Supabase-Integration
   */
  async testSupabaseIntegration() {
    console.log('📋 Test 7: Supabase-Integration');
    
    try {
      // Test: WFS-URLs aus Datenbank lesen
      const { data: streams, error: streamsError } = await supabase
        .from('wfs_streams')
        .select('url, service_title')
        .limit(3);

      if (streamsError) {
        this.addTestResult('Supabase-Integration', false, `Fehler beim Lesen der WFS-Streams: ${streamsError.message}`);
        return;
      }

      if (streams && streams.length > 0) {
        console.log(`   ✅ ${streams.length} WFS-URLs aus Datenbank gelesen`);
        
        // Test: Eine URL aus der Datenbank testen
        const testUrl = streams[0].url;
        console.log(`   🔍 Teste URL aus DB: ${streams[0].service_title}`);
        
        const result = await this.client.fetchGetCapabilities(testUrl);
        
        if (result.success) {
          console.log(`   ✅ Datenbank-URL funktioniert: ${result.size} bytes`);
          this.addTestResult('Supabase-Integration', true, 
            `Datenbank-Integration erfolgreich: ${streams.length} URLs verfügbar, 1 getestet`);
        } else {
          console.log(`   ⚠️  Datenbank-URL funktioniert nicht: ${result.error}`);
          this.addTestResult('Supabase-Integration', true, 
            `Datenbank-Integration erfolgreich: ${streams.length} URLs verfügbar (1 nicht erreichbar)`);
        }
      } else {
        this.addTestResult('Supabase-Integration', false, 'Keine WFS-URLs in der Datenbank gefunden');
      }
    } catch (error) {
      this.addTestResult('Supabase-Integration', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Fügt ein Testergebnis hinzu
   */
  addTestResult(testName, success, message) {
    this.testResults.push({
      testName,
      success,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gibt alle Testergebnisse aus
   */
  printTestResults() {
    console.log('\n📊 Test-Ergebnisse:');
    console.log('='.repeat(60));
    
    let passedTests = 0;
    let totalTests = this.testResults.length;
    
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName}`);
      console.log(`   ${result.message}`);
      console.log(`   Zeit: ${result.timestamp}`);
      console.log('');
      
      if (result.success) passedTests++;
    });
    
    console.log('='.repeat(60));
    console.log(`📈 Gesamtergebnis: ${passedTests}/${totalTests} Tests erfolgreich`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Alle Tests erfolgreich!');
    } else {
      console.log('⚠️  Einige Tests fehlgeschlagen. Bitte überprüfen.');
    }
  }
}

// Test ausführen
if (require.main === module) {
  const testSuite = new WFSHTTPClientTestSuite();
  testSuite.runAllTests();
}

module.exports = {
  WFSHTTPClient,
  WFSHTTPClientTestSuite,
  TEST_WFS_URLS
};
