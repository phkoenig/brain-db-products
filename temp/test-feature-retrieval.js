const path = require('path');
// fs-Modul wird für diesen sauberen Zustand nicht mehr benötigt
// const fs = require('fs'); 
const { createClient } = require('@supabase/supabase-js');
const { WFSHTTPClient } = require('../tests/wfs-http-client-test.js');
const { XMLParser } = require('fast-xml-parser');

// Dotenv-Konfiguration
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// NEU: Globale Fehler-Fänger, um stille Abstürze zu verhindern und zu loggen
process.on('unhandledRejection', (reason, promise) => {
    const errorMessage = `FATAL: Unbehandelte Promise-Ablehnung! Grund: ${reason instanceof Error ? reason.stack : reason}`;
    console.error(errorMessage);
    // Versuchen, in ein potenziell vorhandenes Logfile zu schreiben
    try {
        const logFilePath = path.resolve(__dirname, 'feature-retrieval-full.log');
        fs.appendFileSync(logFilePath, `\n\n--- FATAL ERROR ---\n${errorMessage}\n`);
    } catch (e) {
        // Ignorieren, wenn das Logfile nicht existiert
    }
    process.exit(1);
});

process.on('uncaughtException', (err, origin) => {
    const errorMessage = `FATAL: Unbehandelte Ausnahme! Ursprung: ${origin}, Fehler: ${err.stack}`;
    console.error(errorMessage);
    try {
        const logFilePath = path.resolve(__dirname, 'feature-retrieval-full.log');
        fs.appendFileSync(logFilePath, `\n\n--- FATAL ERROR ---\n${errorMessage}\n`);
    } catch (e) {
        // Ignorieren
    }
    process.exit(1);
});


console.log('--- Skript-Start ---'); // Debug-Ausgabe

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class FeatureRetrievalTester {
    constructor() {
        this.httpClient = new WFSHTTPClient();
        this.xmlParser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
        this.successCount = 0;
        this.failureCount = 0;
    }

    /**
     * Schreibt eine formatierte Log-Nachricht in das File.
     */
    /* // LOGGING TEMPORÄR KOMPLETT ENTFERNT
    _writeToLog(message) {
        console.log(message);
    }
    */

    /**
     * Holt eine zufällige Stichprobe von Layern aus der Datenbank.
     * Es werden nur Layer von Streams genommen, die erfolgreich verarbeitet wurden.
     */
    async getSampleLayers(start = 1, end = 500) { // Default-Ende auf 500 gesetzt
        console.log(`📡 Rufe Layer von Position ${start} bis ${end} aus der Datenbank ab...`);
        
        // .range() ist 0-basiert und inklusiv.
        const from = start - 1;
        const to = end - 1;

        const { data, error } = await supabase
            .from('wfs_layers')
            .select(`
                *,
                wfs_streams (
                    url,
                    wfs_version,
                    inspire_konform,
                    standard_outputformate
                )
            `)
            .not('wfs_streams', 'is', null)
            .order('id', { ascending: true }) // Sortieren ist wichtig für konsistente Ranges
            .range(from, to); // KORREKTUR: .range() für Paginierung statt ID-Filter

        if (error) {
            console.error('Fehler beim Abrufen der Layer:', error);
            return [];
        }

        console.log(`✅ ${data.length} Layer für den Test ausgewählt.`);
        return data;
    }

    /**
     * Analysiert die Antwort und prüft, ob sie gültige Features oder einen Fehlerbericht enthält.
     */
    _analyzeResponse(data) {
        let jsonData = null;

        // Prüfen, ob die Daten bereits ein geparstes JSON-Objekt sind
        if (typeof data === 'object' && data !== null) {
            jsonData = data;
        } else if (typeof data === 'string') {
            // Wenn es ein String ist, versuchen, ihn als JSON zu parsen
            try {
                jsonData = JSON.parse(data);
            } catch (e) {
                // Ist kein JSON, wird später als XML behandelt
            }
        }

        // Wenn wir jetzt ein valides JSON-Objekt haben...
        if (jsonData) {
            if (jsonData.features && Array.isArray(jsonData.features)) {
                if (jsonData.features.length > 0) {
                    return { success: true, reason: `Gültiges GeoJSON mit ${jsonData.features.length} Features` };
                } else {
                    return { success: false, reason: 'Antwort war gültiges GeoJSON, enthielt aber 0 Features' };
                }
            }
        }
        
        // Wenn es kein valides GeoJSON war, als XML versuchen.
        // Dafür muss es aber ein String sein.
        if (typeof data !== 'string') {
            return { success: false, reason: 'Ungültige Antwort: Kein String für XML-Analyse und kein valides GeoJSON-Objekt' };
        }

        try {
            const parsedXml = this.xmlParser.parse(data);

            // 1. Explizit nach OGC-Fehlerberichten suchen
            const exceptionReport = parsedXml.ExceptionReport || parsedXml['ows:ExceptionReport'];
            if (exceptionReport) {
                const exception = exceptionReport.Exception || exceptionReport['ows:Exception'];
                const reason = exception?.ExceptionText || exception?.['ows:ExceptionText'] || 'OGC Exception Report erhalten';
                return { success: false, reason: reason.toString().trim() };
            }

            // 2. Prüfung auf GML-Struktur
            const featureCollection = parsedXml.FeatureCollection || parsedXml['wfs:FeatureCollection'];
            if (featureCollection) {
                 // Manchmal ist numberReturned 0, was ein Fehlschlag ist
                if (featureCollection['@_numberReturned'] === '0') {
                    return { success: false, reason: 'Antwort war gültiges GML, enthielt aber 0 Features' };
                }
                return { success: true, reason: 'Gültiges GML-Format erkannt' };
            }
        } catch (xmlError) {
             return { success: false, reason: `XML-Parsing fehlgeschlagen: ${xmlError.message}` };
        }
        
        return { success: false, reason: 'Keine validen Features oder bekannter Fehlerbericht gefunden' };
    }

    /**
     * Führt den Test für einen einzelnen Layer durch.
     */
    async testLayer(layer, index, total) {
        const stream = layer.wfs_streams;
        if (!stream) {
            console.log(`\n[${index + 1}/${total}] --------------------------------------------------`);
            console.warn(`▶️  Überspringe Layer "${layer.titel}", da kein verknüpfter Stream gefunden wurde.`);
            this.failureCount++;
            return;
        }

        const inspireLabel = stream.inspire_konform ? "INSPIRE" : "Standard";
        let requestParams;

        // NEU: Intelligente Versionsauswahl - bevorzuge immer 2.0.0, wenn verfügbar
        let wfsVersionString = '2.0.0'; // Standard annehmen
        if (stream.wfs_version && stream.wfs_version.length > 0) {
            if (stream.wfs_version.includes('2.0.0')) {
                wfsVersionString = '2.0.0';
            } else {
                wfsVersionString = stream.wfs_version[0]; // Nimm die höchste verfügbare ältere Version
            }
        }

        // DIE INSPIRE-WEICHE: Unterschiedliche Parameter je nach Konformität
        if (stream.inspire_konform) {
            requestParams = {
                streamUrl: stream.url,
                layerName: layer.name,
                wfsVersion: '2.0.0', // INSPIRE MUSS 2.0.0 sein
                outputFormat: 'text/xml; subtype=gml/3.2.1', // INSPIRE MUSS GML 3.2.1 sein
                count: 10
            };
        } else {
            // Standard-Logik: Flexibel bleiben
            requestParams = {
                streamUrl: stream.url,
                layerName: layer.name,
                wfsVersion: wfsVersionString, // Benutze die intelligent ausgewählte Version
                outputFormats: stream.standard_outputformate || [],
                count: 10
            };
        }        
        
        // Zur Protokollierung die vollständige URL rekonstruieren
        const typeNameParam = requestParams.wfsVersion.startsWith('2.') ? 'typeNames' : 'typeName';
        const countParamName = requestParams.wfsVersion.startsWith('2.') ? 'count' : 'maxFeatures';
        const baseUrl = requestParams.streamUrl.split('?')[0];
        const params = new URLSearchParams({
            service: 'WFS',
            request: 'GetFeature',
            version: requestParams.wfsVersion,
            [typeNameParam]: requestParams.layerName,
            [countParamName]: requestParams.count.toString(),
            outputFormat: requestParams.outputFormat || (requestParams.outputFormats.find(f => f.toLowerCase().includes('json')) || requestParams.outputFormats[0])
        });
        const fullRequestUrl = `${baseUrl}?${params.toString()}`;


        // Log-Eintrag vorbereiten (jetzt als direkte Konsolenausgabe)
        console.log(`\n[${index + 1}/${total}] --------------------------------------------------`);
        console.log(`▶️  Teste Layer: "${layer.titel}" (${inspireLabel})`);
        console.log(`   Layer Name (tech): ${layer.name}`);
        console.log(`   Stream URL: ${stream.url}`);
        console.log(`   Request URL: ${fullRequestUrl}`);


        try {
            const response = await this.httpClient.getFeatures(requestParams);

            if (response.error) {
                const errorMessage = `FEHLER (Anfrage): ${response.error}`;
                console.log(`   ❌ ${errorMessage}`);
                this.failureCount++;
                return;
            }
            
            const analysis = this._analyzeResponse(response.data);

            if (analysis.success) {
                const successMessage = `ERFOLG: ${analysis.reason}.`;
                console.log(`   ✅ ${successMessage}`);
                this.successCount++;
            } else {
                const failureMessage = `FEHLSCHLAG: ${analysis.reason}.`;
                console.log(`   ⚠️  ${failureMessage}`);
                
                if (!analysis.reason.includes('OGC Exception') && !analysis.reason.includes('0 Features')) {
                    const responseData = response.data || '';
                    const snippet = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
                    console.log(`      -> Antwort-Ausschnitt: ${snippet.substring(0, 500).replace(/\n/g, ' ')}`);
                }
                this.failureCount++;
            }

        } catch (error) {
            const crashMessage = `FEHLER (Absturz): ${error.message}`;
            console.log(`   💥 ${crashMessage}`);
            this.failureCount++;
        }
    }

    /**
     * Startet den gesamten Testprozess.
     */
    async run() {
        // Für diesen Testlauf fokussieren wir uns NUR auf den problematischen Layer.
        const startId = 4;
        const endId = 4;

        const layers = await this.getSampleLayers(startId, endId);
        if (layers.length === 0) {
            console.log("Der Test-Layer konnte nicht geladen werden. Skript wird beendet.");
            return;
        }

        // Die Debug-Schleife ist für einen einzelnen Test nicht mehr nötig.

        for (let i = 0; i < layers.length; i++) {
            await this.testLayer(layers[i], i, layers.length);
        }

        console.log("\n==========================================");
        console.log("📊 Test-Zusammenfassung");
        console.log("==========================================");
        console.log(`   - Getestete Layer: ${this.successCount + this.failureCount}`);
        console.log(`   - Erfolgreiche Abrufe: ${this.successCount}`);
        console.log(`   - Fehlgeschlagene Abrufe: ${this.failureCount}`);
        const total = this.successCount + this.failureCount;
        const successRate = total > 0 ? ((this.successCount / total) * 100).toFixed(1) : 0;
        console.log(`   - Erfolgsquote: ${successRate}%`);
        console.log("==========================================");
    }
}

if (require.main === module) {
    const tester = new FeatureRetrievalTester();
    tester.run().finally(async () => {
        console.log("\nSkript-Durchlauf beendet. Schließe Datenbankverbindung.");
        await supabase.end(); // NEU: Sauberes Schließen der Supabase-Verbindung
        // process.exit(0) entfernt, um natürliches Beenden zu ermöglichen.
    });
}
