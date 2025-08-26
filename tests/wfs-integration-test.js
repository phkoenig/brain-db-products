/**
 * WFS Integration Tests
 * 
 * Testet die Integration zwischen WFS HTTP Client und Parser
 * für vollständige WFS-GetCapabilities Verarbeitung.
 */

const { createClient } = require('@supabase/supabase-js');
const { WFSCapabilitiesParser } = require('./wfs-parser-test');
const { WFSHTTPClient } = require('./wfs-http-client-test');
const WFSURLValidator = require('../temp/wfs-url-validator');

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * WFS Integration Service Klasse
 */
class WFSIntegrationService {
  constructor() {
    this.httpClient = new WFSHTTPClient();
    this.parser = new WFSCapabilitiesParser();
  }

  /**
   * Vollständige WFS-GetCapabilities Verarbeitung
   */
  async processWFSGetCapabilities(wfsUrl) {
    try {
      console.log(`🔄 Verarbeite WFS: ${wfsUrl}`);
      
      // Schritt 1: GetCapabilities XML abrufen
      const httpResult = await this.httpClient.fetchGetCapabilities(wfsUrl);
      
      if (!httpResult.success) {
        return {
          success: false,
          step: 'http_fetch',
          error: httpResult.error,
          url: wfsUrl
        };
      }
      
      console.log(`   ✅ XML abgerufen: ${httpResult.size} bytes`);
      
      // Schritt 2: Service-Metadaten parsen
      const serviceResult = this.parser.parseServiceMetadata(httpResult.data);
      
      if (!serviceResult.success) {
        return {
          success: false,
          step: 'service_parsing',
          error: serviceResult.error,
          url: wfsUrl,
          httpResult: httpResult
        };
      }
      
      console.log(`   ✅ Service-Metadaten extrahiert`);
      
      // Schritt 3: Layer-Metadaten parsen
      const layerResult = this.parser.parseLayerMetadata(httpResult.data);
      
      if (!layerResult.success) {
        return {
          success: false,
          step: 'layer_parsing',
          error: layerResult.error,
          url: wfsUrl,
          httpResult: httpResult,
          serviceResult: serviceResult
        };
      }
      
      console.log(`   ✅ Layer-Metadaten extrahiert: ${layerResult.layerCount} Layer`);
      
      // Schritt 4: Vollständiges Ergebnis zusammenstellen
      return {
        success: true,
        url: wfsUrl,
        httpResult: httpResult,
        serviceMetadata: serviceResult.serviceMetadata,
        layers: layerResult.layers,
        layerCount: layerResult.layerCount,
        processingTime: Date.now()
      };
      
    } catch (error) {
      return {
        success: false,
        step: 'integration_error',
        error: error.message,
        url: wfsUrl
      };
    }
  }

  /**
   * Batch-Verarbeitung mehrerer WFS-URLs
   */
  async processMultipleWFS(urls, concurrency = 2) {
    const results = [];
    const chunks = this.chunkArray(urls, concurrency);
    
    console.log(`🔄 Starte Batch-Verarbeitung: ${urls.length} URLs in ${chunks.length} Chunks`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   📦 Verarbeite Chunk ${i + 1}/${chunks.length} (${chunk.length} URLs)`);
      
      const chunkPromises = chunk.map(url => this.processWFSGetCapabilities(url));
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            step: 'promise_rejection',
            error: result.reason.message || 'Unknown error',
            url: chunk[index]
          });
        }
      });
      
      // Pause zwischen Chunks
      if (i < chunks.length - 1) {
        console.log(`   ⏳ Pause zwischen Chunks...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  /**
   * Speichert WFS-Daten in Supabase
   */
  async saveWFSToDatabase(integrationResult) {
    try {
      if (!integrationResult.success) {
        return {
          success: false,
          error: 'Integration result not successful',
          integrationResult: integrationResult
        };
      }
      
      const { serviceMetadata, layers, url } = integrationResult;
      
      // WFS-Stream in Datenbank speichern/aktualisieren
      const streamData = {
        url: url,
        service_title: serviceMetadata.serviceTitle,
        service_abstract: serviceMetadata.serviceAbstract,
        wfs_version: serviceMetadata.wfsVersion,
        provider_name: serviceMetadata.providerName,
        provider_site: serviceMetadata.providerSite,
        unterstuetzte_crs: serviceMetadata.supportedCRS,
        standard_outputformate: serviceMetadata.outputFormats,
        bbox_wgs84: serviceMetadata.bboxWGS84,
        layer_anzahl: layers.length,
        zuletzt_geprueft: new Date().toISOString(),
        ist_aktiv: true
      };
      
      // Prüfen ob WFS-Stream bereits existiert
      const { data: existingStream } = await supabase
        .from('wfs_streams')
        .select('id')
        .eq('url', url)
        .single();
      
      let streamId;
      
      if (existingStream) {
        // Update existing stream
        const { data: updatedStream, error: updateError } = await supabase
          .from('wfs_streams')
          .update(streamData)
          .eq('url', url)
          .select('id')
          .single();
        
        if (updateError) {
          throw new Error(`Fehler beim Update WFS-Stream: ${updateError.message}`);
        }
        
        streamId = updatedStream.id;
        console.log(`   ✅ WFS-Stream aktualisiert: ${streamId}`);
      } else {
        // Insert new stream
        const { data: newStream, error: insertError } = await supabase
          .from('wfs_streams')
          .insert(streamData)
          .select('id')
          .single();
        
        if (insertError) {
          throw new Error(`Fehler beim Insert WFS-Stream: ${insertError.message}`);
        }
        
        streamId = newStream.id;
        console.log(`   ✅ WFS-Stream erstellt: ${streamId}`);
      }
      
      // Layer in Datenbank speichern
      const layerResults = [];
      
      for (const layer of layers) {
        const layerData = {
          wfs_id: streamId,
          name: layer.name,
          titel: layer.title,
          abstract: layer.abstract,
          default_crs: layer.defaultCRS,
          weitere_crs: layer.otherCRS,
          outputformate: layer.outputFormats,
          bbox_wgs84: layer.bbox
        };
        
        // Prüfen ob Layer bereits existiert
        const { data: existingLayer } = await supabase
          .from('wfs_layers')
          .select('id')
          .eq('wfs_id', streamId)
          .eq('name', layer.name)
          .single();
        
        if (existingLayer) {
          // Update existing layer
          const { error: updateError } = await supabase
            .from('wfs_layers')
            .update(layerData)
            .eq('id', existingLayer.id);
          
          if (updateError) {
            console.warn(`   ⚠️  Fehler beim Update Layer ${layer.name}: ${updateError.message}`);
          } else {
            layerResults.push({ action: 'updated', layer: layer.name });
          }
        } else {
          // Insert new layer
          const { error: insertError } = await supabase
            .from('wfs_layers')
            .insert(layerData);
          
          if (insertError) {
            console.warn(`   ⚠️  Fehler beim Insert Layer ${layer.name}: ${insertError.message}`);
          } else {
            layerResults.push({ action: 'created', layer: layer.name });
          }
        }
      }
      
      return {
        success: true,
        streamId: streamId,
        streamAction: existingStream ? 'updated' : 'created',
        layersProcessed: layerResults.length,
        layerResults: layerResults
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        integrationResult: integrationResult
      };
    }
  }

  /**
   * Vollständige Pipeline: Abrufen, Parsen und Speichern
   */
  async fullWFSProcessingPipeline(wfsUrl) {
    try {
      console.log(`🚀 Starte vollständige WFS-Pipeline: ${wfsUrl}`);
      
      // Schritt 1: Integration (Abrufen + Parsen)
      const integrationResult = await this.processWFSGetCapabilities(wfsUrl);
      
      if (!integrationResult.success) {
        return {
          success: false,
          step: 'integration',
          error: integrationResult.error,
          url: wfsUrl
        };
      }
      
      // Schritt 2: Datenbank-Speicherung
      const dbResult = await this.saveWFSToDatabase(integrationResult);
      
      if (!dbResult.success) {
        return {
          success: false,
          step: 'database_save',
          error: dbResult.error,
          url: wfsUrl,
          integrationResult: integrationResult
        };
      }
      
      return {
        success: true,
        url: wfsUrl,
        integrationResult: integrationResult,
        databaseResult: dbResult,
        totalProcessingTime: Date.now()
      };
      
    } catch (error) {
      return {
        success: false,
        step: 'pipeline_error',
        error: error.message,
        url: wfsUrl
      };
    }
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
 * Test-Suite für WFS Integration
 */
class WFSIntegrationTestSuite {
  constructor() {
    this.service = new WFSIntegrationService();
    this.testResults = [];
  }

  /**
   * Führt alle Tests aus
   */
  async runAllTests() {
    console.log('🧪 Starte WFS Integration Tests...\n');

    try {
      // Test 1: Integration Service Initialisierung
      await this.testServiceInitialization();

      // Test 2: Vollständige WFS-Verarbeitung
      await this.testFullWFSProcessing();

      // Test 3: Datenbank-Speicherung
      await this.testDatabaseSaving();

      // Test 4: Vollständige Pipeline
      await this.testFullPipeline();

      // Test 5: Batch-Verarbeitung
      await this.testBatchProcessing();

      // Test 6: Fehlerbehandlung
      await this.testErrorHandling();

      // Test 7: Supabase-Integration
      await this.testSupabaseIntegration();

      // Test 8: WFS-URL-Validierung
      await this.testWFSURLValidation();

      // Test-Ergebnisse ausgeben
      this.printTestResults();

    } catch (error) {
      console.error('❌ Fehler beim Ausführen der Tests:', error);
    }
  }

  /**
   * Test 1: Integration Service Initialisierung
   */
  async testServiceInitialization() {
    console.log('📋 Test 1: Integration Service Initialisierung');
    
    try {
      const service = new WFSIntegrationService();
      
      if (service.httpClient && service.parser) {
        console.log('   ✅ HTTP Client initialisiert');
        console.log('   ✅ Parser initialisiert');
        this.addTestResult('Integration Service Initialisierung', true, 'Service erfolgreich initialisiert');
      } else {
        this.addTestResult('Integration Service Initialisierung', false, 'Service-Komponenten fehlen');
      }
    } catch (error) {
      this.addTestResult('Integration Service Initialisierung', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 2: Vollständige WFS-Verarbeitung
   */
  async testFullWFSProcessing() {
    console.log('📋 Test 2: Vollständige WFS-Verarbeitung');
    
    try {
      // Test mit einer funktionierenden URL
      const testUrl = 'https://inspire.brandenburg.de/services/cp_alkis_wfs?request=GetCapabilities&service=WFS';
      
      const result = await this.service.processWFSGetCapabilities(testUrl);
      
      if (result.success) {
        console.log('   ✅ WFS-Verarbeitung erfolgreich');
        console.log(`   ✅ Service-Titel: ${result.serviceMetadata.serviceTitle}`);
        console.log(`   ✅ WFS-Version: ${result.serviceMetadata.wfsVersion}`);
        console.log(`   ✅ Layer-Anzahl: ${result.layerCount}`);
        
        this.addTestResult('Vollständige WFS-Verarbeitung', true, 
          `WFS erfolgreich verarbeitet: ${result.layerCount} Layer`);
      } else {
        console.log(`   ❌ WFS-Verarbeitung fehlgeschlagen: ${result.error}`);
        this.addTestResult('Vollständige WFS-Verarbeitung', false, 
          `Fehler in Schritt ${result.step}: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('Vollständige WFS-Verarbeitung', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 3: Datenbank-Speicherung
   */
  async testDatabaseSaving() {
    console.log('📋 Test 3: Datenbank-Speicherung');
    
    try {
      // Mock-Integration-Result für Test
      const mockResult = {
        success: true,
        url: 'https://test.example.com/wfs',
        serviceMetadata: {
          serviceTitle: 'Test WFS Service',
          serviceAbstract: 'Test Abstract',
          wfsVersion: '2.0.0',
          providerName: 'Test Provider',
          providerSite: 'https://test.example.com',
          supportedCRS: ['EPSG:25833'],
          outputFormats: ['application/gml+xml'],
          bboxWGS84: { lower: [11.0, 51.0], upper: [15.0, 53.5], crs: 'EPSG:4326' }
        },
        layers: [
          {
            name: 'test:layer',
            title: 'Test Layer',
            abstract: 'Test Layer Abstract',
            defaultCRS: 'EPSG:25833',
            otherCRS: ['EPSG:4326'],
            outputFormats: ['application/gml+xml'],
            bbox: { lower: [11.0, 51.0], upper: [15.0, 53.5], crs: 'EPSG:4326' }
          }
        ],
        layerCount: 1
      };
      
      const result = await this.service.saveWFSToDatabase(mockResult);
      
      if (result.success) {
        console.log('   ✅ Datenbank-Speicherung erfolgreich');
        console.log(`   ✅ Stream-Aktion: ${result.streamAction}`);
        console.log(`   ✅ Layer verarbeitet: ${result.layersProcessed}`);
        
        this.addTestResult('Datenbank-Speicherung', true, 
          `Datenbank-Speicherung erfolgreich: ${result.layersProcessed} Layer`);
      } else {
        console.log(`   ❌ Datenbank-Speicherung fehlgeschlagen: ${result.error}`);
        this.addTestResult('Datenbank-Speicherung', false, `Fehler: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('Datenbank-Speicherung', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 4: Vollständige Pipeline
   */
  async testFullPipeline() {
    console.log('📋 Test 4: Vollständige Pipeline');
    
    try {
      // Test mit einer funktionierenden URL
      const testUrl = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_flurstuecke';
      
      const result = await this.service.fullWFSProcessingPipeline(testUrl);
      
      if (result.success) {
        console.log('   ✅ Vollständige Pipeline erfolgreich');
        console.log(`   ✅ Integration: ${result.integrationResult.layerCount} Layer`);
        console.log(`   ✅ Datenbank: ${result.databaseResult.layersProcessed} Layer gespeichert`);
        
        this.addTestResult('Vollständige Pipeline', true, 
          `Pipeline erfolgreich: ${result.integrationResult.layerCount} Layer verarbeitet`);
      } else {
        console.log(`   ❌ Pipeline fehlgeschlagen in Schritt ${result.step}: ${result.error}`);
        this.addTestResult('Vollständige Pipeline', false, 
          `Fehler in Schritt ${result.step}: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('Vollständige Pipeline', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 5: Batch-Verarbeitung
   */
  async testBatchProcessing() {
    console.log('📋 Test 5: Batch-Verarbeitung');
    
    try {
      // Verwende funktionierende WFS-URLs aus der Datenbank
      const { data: workingWFS } = await supabase
        .from('wfs_streams')
        .select('url, service_title')
        .eq('ist_aktiv', true)
        .limit(2);

      if (!workingWFS || workingWFS.length === 0) {
        this.addTestResult('Batch-Verarbeitung', false, 'Keine funktionierenden WFS-Services gefunden');
        return;
      }

      const urls = workingWFS.map(wfs => wfs.url);
      const result = await this.service.processMultipleWFS(urls, 2);
      
      if (result.length > 0) {
        let successfulResults = 0;
        let failedResults = 0;
        
        result.forEach((item, index) => {
          if (item.success) {
            successfulResults++;
            console.log(`   ✅ URL ${index + 1}: ${item.layerCount} Layer verarbeitet`);
          } else {
            failedResults++;
            console.log(`   ❌ URL ${index + 1}: ${item.error}`);
          }
        });
        
        const successRate = (successfulResults / result.length) * 100;
        this.addTestResult('Batch-Verarbeitung', successfulResults > 0, 
          `${successfulResults}/${result.length} URLs erfolgreich (${successRate.toFixed(1)}%)`);
      } else {
        this.addTestResult('Batch-Verarbeitung', false, 'Keine Ergebnisse aus der Batch-Verarbeitung');
      }
    } catch (error) {
      this.addTestResult('Batch-Verarbeitung', false, `Exception: ${error.message}`);
    }
  }

  /**
   * Test 6: Fehlerbehandlung
   */
  async testErrorHandling() {
    console.log('📋 Test 6: Fehlerbehandlung');
    
    try {
      // Test mit ungültiger URL
      const testUrl = 'https://invalid-wfs-url-that-does-not-exist.com/wfs';
      
      const result = await this.service.processWFSGetCapabilities(testUrl);
      
      if (!result.success) {
        console.log(`   ✅ Fehler korrekt abgefangen: ${result.error}`);
        console.log(`   ✅ Fehler-Schritt: ${result.step}`);
        
        this.addTestResult('Fehlerbehandlung', true, `Fehler korrekt behandelt: ${result.step}`);
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
      // Test: WFS-Streams aus Datenbank lesen
      const { data: streams, error: streamsError } = await supabase
        .from('wfs_streams')
        .select('id, url, service_title, layer_anzahl')
        .limit(5);

      if (streamsError) {
        this.addTestResult('Supabase-Integration', false, `Fehler beim Lesen der WFS-Streams: ${streamsError.message}`);
        return;
      }

      if (streams && streams.length > 0) {
        console.log(`   ✅ ${streams.length} WFS-Streams aus Datenbank gelesen`);
        
        // Test: WFS-Layers aus Datenbank lesen
        const { data: layers, error: layersError } = await supabase
          .from('wfs_layers')
          .select('id, name, titel, wfs_id')
          .limit(10);

        if (layersError) {
          this.addTestResult('Supabase-Integration', false, `Fehler beim Lesen der WFS-Layers: ${layersError.message}`);
          return;
        }

        if (layers && layers.length > 0) {
          console.log(`   ✅ ${layers.length} WFS-Layers aus Datenbank gelesen`);
          
          // Statistiken berechnen
          const totalLayers = layers.length;
          const uniqueStreams = new Set(layers.map(l => l.wfs_id)).size;
          
          this.addTestResult('Supabase-Integration', true, 
            `Datenbank-Integration erfolgreich: ${streams.length} Streams, ${totalLayers} Layers in ${uniqueStreams} Services`);
        } else {
          this.addTestResult('Supabase-Integration', false, 'Keine WFS-Layers in der Datenbank gefunden');
        }
      } else {
        this.addTestResult('Supabase-Integration', false, 'Keine WFS-Streams in der Datenbank gefunden');
      }
    } catch (error) {
      this.addTestResult('Supabase-Integration', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 8: WFS-URL-Validierung
   */
  async testWFSURLValidation() {
    console.log('📋 Test 8: WFS-URL-Validierung');
    
    try {
      const validator = new WFSURLValidator();
      
      // Validiere eine bekannte WFS-URL
      const testURL = 'https://inspire.brandenburg.de/services/cp_alkis_wfs?request=GetCapabilities&service=WFS';
      const validationResult = await validator.validateWFSURL(testURL);
      
      console.log(`   ✅ URL-Validierung abgeschlossen:`);
      console.log(`      - Syntax: ${validationResult.url_syntax_valid ? '✅' : '❌'}`);
      console.log(`      - Server: ${validationResult.server_reachable ? '✅' : '❌'}`);
      console.log(`      - XML: ${validationResult.xml_response_valid ? '✅' : '❌'}`);
      console.log(`      - Gesamt: ${validationResult.overall_valid ? '✅' : '❌'}`);
      
      // Speichere Validierungsergebnisse in der Datenbank
      const { data, error } = await supabase
        .from('wfs_streams')
        .update({
          url_syntax_valid: validationResult.url_syntax_valid,
          server_reachable: validationResult.server_reachable,
          xml_response_valid: validationResult.xml_response_valid,
          last_validation_check: validationResult.last_validation_check,
          validation_notes: validationResult.validation_notes.join('; ')
        })
        .eq('url', testURL)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Konnte Validierungsergebnisse nicht speichern: ${error.message}`);
      } else {
        console.log(`   ✅ Validierungsergebnisse in Datenbank gespeichert`);
      }
      
      this.addTestResult('WFS-URL-Validierung', validationResult.overall_valid, 
        `URL-Validierung abgeschlossen: Syntax=${validationResult.url_syntax_valid}, Server=${validationResult.server_reachable}, XML=${validationResult.xml_response_valid}`);
      
      return validationResult.overall_valid;
    } catch (error) {
      this.addTestResult('WFS-URL-Validierung', false, `Fehler: ${error.message}`);
      return false;
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
  const testSuite = new WFSIntegrationTestSuite();
  testSuite.runAllTests();
}

module.exports = {
  WFSIntegrationService,
  WFSIntegrationTestSuite
};
