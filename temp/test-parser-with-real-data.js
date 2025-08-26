/**
 * Real-World Test Suite für den WFSCapabilitiesParser
 * 
 * Dieses Skript testet den WFSCapabilitiesParser gegen alle WFS-Streams,
 * die in der Datenbank als "xml_response_valid = true" markiert sind.
 * 
 * ZIELE:
 * 1. Die Robustheit des Parsers unter realen Bedingungen prüfen.
 * 2. Die Fähigkeit zur Extraktion von Layer-Namen und -Titeln bewerten.
 * 3. Eine Zusammenfassung der Erfolgs- und Fehlerraten erstellen.
 */

const { createClient } = require('@supabase/supabase-js');
const { WFSCapabilitiesParser } = require('../src/lib/wfs-parser.js'); // NEUER PFAD ZUM ROBUSTEN PARSER
const { WFSHTTPClient } = require('../tests/wfs-http-client-test.js');
require('dotenv').config({ path: './.env.local' });

/**
 * Real-World Test Suite für den WFSCapabilitiesParser
 * 
 * Dieses Skript testet den WFSCapabilitiesParser gegen alle WFS-Streams,
 * die in der Datenbank als "xml_response_valid = true" markiert sind.
 * 
 * ZIELE:
 * 1. Die Robustheit des Parsers unter realen Bedingungen prüfen.
 * 2. Die Fähigkeit zur Extraktion von Layer-Namen und -Titeln bewerten.
 * 3. Eine Zusammenfassung der Erfolgs- und Fehlerraten erstellen.
 */
class RealWorldParserTest {
    constructor() {
        this.supabase = this.initializeSupabase();
        this.parser = new WFSCapabilitiesParser();
        this.httpClient = new WFSHTTPClient();
        this.stats = {
            total: 0,
            successful: 0,
            failed: 0,
            totalLayers: 0,
            streamsWithLayers: 0,
            errors: []
        };
    }

    /**
     * Initialisiert den Supabase-Client mit Admin-Rechten für den Server-Betrieb.
     */
    initializeSupabase() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        // WICHTIG: Service Role Key für Backend-Skripte verwenden
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Fehler: Supabase URL oder Service Role Key nicht in .env.local gefunden.');
            process.exit(1);
        }

        return createClient(supabaseUrl, supabaseServiceKey);
    }

    /**
     * Holt alle validen WFS-Streams aus der Datenbank.
     */
    async getValidStreams() {
        console.log('📡 Rufe als valide markierte WFS-Streams aus der Datenbank ab...');
        const { data, error } = await this.supabase
            .from('wfs_streams')
            .select('id, url')
            .eq('xml_response_valid', true);

        if (error) {
            console.error('Fehler beim Abrufen der WFS-Streams:', error.message);
            return [];
        }
        console.log(`✅ ${data.length} valide Streams gefunden.`);
        return data;
    }

    /**
     * Führt den Test für einen einzelnen Stream durch.
     */
    async testStream(stream) {
        console.log(`\n--------------------------------------------------`);
        console.log(`🚀 Teste Stream ID ${stream.id}: ${stream.url}`);
        
        let xmlDataResponse;
        try {
            // Die Methode 'fetchGetCapabilities' wurde verbessert und probiert
            // jetzt selbstständig mehrere WFS-Versionen durch.
            // Wir müssen hier keine Parameter mehr anhängen.
            xmlDataResponse = await this.httpClient.fetchGetCapabilities(stream.url);

            if (!xmlDataResponse.success) {
                // Wenn der HTTP-Request selbst fehlschlägt
                throw new Error(`HTTP-Client-Fehler: ${xmlDataResponse.error}`);
            }

            const xmlData = xmlDataResponse.data;
            if (!xmlData) {
                throw new Error('Leere XML-Antwort erhalten.');
            }

            const parsedData = this.parser.parse(xmlData); // NEUE, EINFACHERE PARSE-METHODE

            if (parsedData.success) {
                console.log(`   ✅ XML erfolgreich geparst.`);
                if (parsedData.layerCount > 0) {
                    this.stats.successful++;
                    this.stats.streamsWithLayers++;
                    this.stats.totalLayers += parsedData.layerCount;
                    console.log(`   ✨ ${parsedData.layerCount} Layer gefunden!`);
                    
                    // Logge die ersten 3 Layer-Namen als Beispiel
                    parsedData.layers.slice(0, 3).forEach((layer, index) => {
                        console.log(`      - Layer ${index + 1}: ${layer.title || layer.name}`);
                    });
                    if (parsedData.layerCount > 3) {
                        console.log(`      ... und ${parsedData.layerCount - 3} weitere.`);
                    }
                } else {
                    this.stats.successful++;
                    console.log(`   ⚠️  XML gültig, aber keine Layer gefunden.`);
                }
            } else {
                throw new Error(`Parser-Fehler: ${parsedData.error}`);
            }

        } catch (error) {
            this.stats.failed++;
            const errorMessage = error.message;
            this.stats.errors.push({ id: stream.id, url: stream.url, error: errorMessage });
            console.error(`   ❌ FEHLER: ${errorMessage}`);
        }
    }

    /**
     * Gibt eine Zusammenfassung der Testergebnisse aus.
     */
    printSummary() {
        console.log(`\n==================================================`);
        console.log(`📊 PARSER-TEST ZUSAMMENFASSUNG`);
        console.log(`==================================================`);
        console.log(`   - Getestete Streams insgesamt: ${this.stats.total}`);
        console.log(`   - Erfolgreich geparst: ${this.stats.successful}`);
        console.log(`   - Fehlgeschlagen: ${this.stats.failed}`);
        console.log(`   - Erfolgsrate: ${this.stats.total > 0 ? ((this.stats.successful / this.stats.total) * 100).toFixed(1) : 0}%`);
        console.log(`--------------------------------------------------`);
        console.log(`   - Streams mit Layern: ${this.stats.streamsWithLayers}`);
        console.log(`   - Extrahierte Layer insgesamt: ${this.stats.totalLayers}`);
        if (this.stats.streamsWithLayers > 0) {
            console.log(`   - Layer pro erfolgreichem Stream (Schnitt): ${(this.stats.totalLayers / this.stats.streamsWithLayers).toFixed(1)}`);
        }
        console.log(`==================================================`);

        if (this.stats.failed > 0) {
            console.log(`\n📋 FEHLERDETAILS:`);
            this.stats.errors.forEach(err => {
                console.log(`   - Stream ID ${err.id} (${err.url}): ${err.error}`);
            });
        }
    }

    /**
     * Startet die gesamte Test-Suite.
     */
    async run() {
        console.log('🚀 Starte den Real-World-Test des WFS-Parsers...');
        const streams = await this.getValidStreams();
        this.stats.total = streams.length;

        if (streams.length === 0) {
            console.log('Keine validen Streams zum Testen gefunden. Skript wird beendet.');
            return;
        }

        for (const stream of streams) {
            await this.testStream(stream);
        }

        this.printSummary();
    }
}

// Skript ausführen, wenn es direkt aufgerufen wird
if (require.main === module) {
    const tester = new RealWorldParserTest();
    tester.run()
        .catch(console.error)
        .finally(() => {
            console.log("\nSkript beendet.");
            process.exit(0);
        });
}
