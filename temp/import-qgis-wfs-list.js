const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');

// Dotenv-Konfiguration, um Umgebungsvariablen zu laden
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Fehler: Supabase URL oder Secret Key nicht in .env.local gefunden.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class QGISImporter {
    constructor(xmlFilePath) {
        this.xmlFilePath = xmlFilePath;
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
        });
    }

    _cleanUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.toLowerCase().startsWith('http')) {
            return null;
        }
        try {
            const urlObj = new URL(rawUrl);
            let baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
            // Entferne abschließende Schrägstriche für Konsistenz
            if (baseUrl.endsWith('/')) {
                baseUrl = baseUrl.slice(0, -1);
            }
            return baseUrl;
        } catch (error) {
            console.warn(`Ungültige URL gefunden und übersprungen: ${rawUrl}`);
            return null;
        }
    }

    async _getExistingUrls() {
        console.log('📡 Rufe bestehende URLs aus der Datenbank ab...');
        const { data, error } = await supabase.from('wfs_streams').select('url');
        if (error) {
            console.error('Fehler beim Abrufen der URLs:', error);
            return new Set();
        }
        const urlSet = new Set(data.map(item => this._cleanUrl(item.url)).filter(Boolean));
        console.log(`✅ ${urlSet.size} bestehende URLs gefunden.`);
        return urlSet;
    }

    async runImport() {
        console.log(`🚀 Starte den Import aus: ${this.xmlFilePath}`);

        const existingUrls = await this._getExistingUrls();
        let newStreamsFound = 0;
        let duplicateStreamsSkipped = 0;
        let invalidUrlsSkipped = 0;

        try {
            const xmlFileContent = fs.readFileSync(this.xmlFilePath, 'utf-8');
            const parsedXml = this.parser.parse(xmlFileContent);
            const connections = parsedXml.qgsWFSConnections.wfs;

            if (!connections || !Array.isArray(connections)) {
                console.error("Konnte keine gültigen WFS-Verbindungen in der XML-Datei finden.");
                return;
            }

            console.log(`🔍 ${connections.length} Verbindungen in der XML-Datei gefunden. Verarbeite...`);
            const streamsToInsert = [];

            for (const conn of connections) {
                const rawUrl = conn['@_url'];
                const name = conn['@_name'];
                
                // Ignoriere OGC API Features, da wir nur WFS verarbeiten
                if (conn['@_version'] === 'OGC_API_FEATURES') {
                    console.warn(`⏭️  Überspringe OGC API Feature Stream: "${name}"`);
                    invalidUrlsSkipped++;
                    continue;
                }

                const cleanedUrl = this._cleanUrl(rawUrl);

                if (!cleanedUrl) {
                    invalidUrlsSkipped++;
                    continue;
                }

                if (existingUrls.has(cleanedUrl)) {
                    duplicateStreamsSkipped++;
                } else {
                    newStreamsFound++;
                    streamsToInsert.push({
                        url: cleanedUrl,
                        service_title: name || 'Unbenannter Dienst (QGIS Import)',
                        land_name: 'Unbekannt', // PFLICHTFELD: Standardwert setzen
                        bundesland_name: 'Unbekannt', // PFLICHTFELD: Standardwert setzen
                        tags: ['qgis-import-2025'],
                        ist_aktiv: true, // Standardmäßig als aktiv annehmen
                        meta: { import_source: 'QGIS_XML_2025' }
                    });
                    // Füge die neue URL zum Set hinzu, um Duplikate innerhalb der XML-Datei zu vermeiden
                    existingUrls.add(cleanedUrl); 
                }
            }

            if (streamsToInsert.length > 0) {
                console.log(`➕ Füge ${streamsToInsert.length} neue WFS-Streams zur Datenbank hinzu...`);
                const { error } = await supabase.from('wfs_streams').insert(streamsToInsert);
                if (error) {
                    console.error("Fehler beim Einfügen der neuen Streams:", error);
                } else {
                    console.log("✅ Neue Streams erfolgreich hinzugefügt.");
                }
            } else {
                console.log("ℹ️  Keine neuen Streams zum Hinzufügen gefunden.");
            }

        } catch (error) {
            console.error("Ein Fehler ist während des Imports aufgetreten:", error);
        } finally {
            console.log("\n==========================================");
            console.log("📊 Import-Zusammenfassung");
            console.log("==========================================");
            console.log(`   - Neue Streams gefunden: ${newStreamsFound}`);
            console.log(`   - Übersprungene Duplikate: ${duplicateStreamsSkipped}`);
            console.log(`   - Ungültige/Ignorierte URLs: ${invalidUrlsSkipped}`);
            console.log("==========================================");
        }
    }
}

if (require.main === module) {
    const importer = new QGISImporter(path.resolve(__dirname, '../database/QGSI_WFS_VERBINDUNGEN_2025.xml'));
    importer.runImport().finally(() => {
        console.log("\nSkript beendet.");
        process.exit(0); // Sorgt für ein sauberes Beenden des Prozesses
    });
}
