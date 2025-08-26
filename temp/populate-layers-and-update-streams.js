const { createClient } = require('@supabase/supabase-js');
const { WFSCapabilitiesParser } = require('../src/lib/wfs-parser.js');
const { WFSHTTPClient } = require('../tests/wfs-http-client-test.js');
require('dotenv').config({ path: './.env.local' });

/**
 * Befüllt die wfs_layers Tabelle und aktualisiert die wfs_streams Tabelle.
 * 
 * Dieses Skript führt folgende Schritte aus:
 * 1. Holt alle WFS-Streams, die erfolgreich geparst werden konnten (basierend auf dem letzten Testlauf).
 * 2. Löscht zur Sicherheit alle bestehenden Layer, um Duplikate zu vermeiden.
 * 3. Iteriert über jeden erfolgreichen Stream.
 * 4. Ruft die GetCapabilities-XML erneut ab.
 * 5. Parst das XML mit dem erweiterten Parser, um Service- und Layer-Daten zu extrahieren.
 * 6. Aktualisiert den Eintrag in der `wfs_streams` Tabelle mit den neuen Service-Metadaten.
 * 7. Fügt alle gefundenen Layer in die `wfs_layers` Tabelle ein.
 */
class DatabasePopulator {
    constructor() {
        this.supabase = this.initializeSupabase();
        this.parser = new WFSCapabilitiesParser();
        this.httpClient = new WFSHTTPClient();
        this.stats = {
            streamsProcessed: 0,
            layersAdded: 0,
            streamsUpdated: 0,
            errors: 0
        };
        // Liste der IDs von Streams, die im letzten Test erfolgreich waren
        this.successfulStreamIds = [
            "f91420a1-5fa6-407e-b203-3fdf779a7732", "520dd512-2bbe-4065-beeb-69fec5df32e1",
            "27bcb149-bf5e-445b-b317-6c91e8d2aa32", "c254e5e0-4082-485c-9757-b28b59ac23f5",
            "3346020a-7889-4e34-92db-f7f2ec16e82c", "66a8e08c-1efa-4c2b-8fed-46946e27a2dc",
            "2cff1923-4015-433c-9e2e-b64b4532a0bc", "402a7f83-6a3c-4d9b-85a0-ad1f30bca056",
            "791d68a9-9152-4bc1-a6cd-e8d37ba630fc", "0d1b7fce-2587-431d-9d61-12f2e6607016",
            "4a9d0d7b-105e-4a28-908b-ac1b14f6e404", "abbd46a2-febd-443d-9e42-3c8eb2df2e0f",
            "81012e6d-c3a2-4f3f-a42a-64209460289d", "3c5f36d1-6146-41bc-a513-cb759104afcd",
            "25a0954c-24d3-4829-b971-cb776680dcbf", "edddbd06-026c-4548-a481-af9425b46499",
            "d2c8ad3b-be07-4458-a86f-56f6c0bfe92c", "a48626fb-2909-4232-a04a-51ae80c20929",
            "506fa518-944f-4d5f-99db-bebc9982b73b", "225a402e-3f6e-4cc7-842a-a32a1609ab2e",
            "fc4701f4-e2a6-4c6a-a423-58b4b1203cec"
        ];
    }

    initializeSupabase() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Fehler: Supabase URL oder Service Key nicht in .env.local gefunden.');
            process.exit(1);
        }
        return createClient(supabaseUrl, supabaseServiceKey);
    }

    async getSuccessfulStreams() {
        console.log('📡 Rufe die 21 erfolgreichen WFS-Streams ab...');
        const { data, error } = await this.supabase
            .from('wfs_streams')
            .select('id, url')
            .in('id', this.successfulStreamIds);

        if (error) {
            console.error('Fehler beim Abrufen der WFS-Streams:', error.message);
            return [];
        }
        console.log(`✅ ${data.length} Streams gefunden.`);
        return data;
    }

    async clearExistingLayers() {
        console.log('\n🗑️  Lösche alle bestehenden Layer, um Redundanz zu vermeiden...');
        const { error } = await this.supabase.from('wfs_layers').delete().gt('wfs_id', '00000000-0000-0000-0000-000000000000'); // Workaround to delete all
        if (error) {
            console.error('Fehler beim Löschen der Layer:', error.message);
        } else {
            console.log('✅ Bestehende Layer erfolgreich gelöscht.');
        }
    }

    async processStream(stream) {
        this.stats.streamsProcessed++;
        console.log(`\n--------------------------------------------------`);
        console.log(`[${this.stats.streamsProcessed}/${this.successfulStreamIds.length}] ⚙️  Verarbeite Stream: ${stream.url}`);
        
        const xmlResponse = await this.httpClient.fetchGetCapabilities(stream.url);

        if (!xmlResponse.success) {
            console.error(`   ❌ Fehler beim Abrufen der XML: ${xmlResponse.error}`);
            this.stats.errors++;
            return;
        }

        const parsedData = this.parser.parse(xmlResponse.data);

        if (!parsedData.success) {
            console.error(`   ❌ Fehler beim Parsen der XML: ${parsedData.error}`);
            this.stats.errors++;
            return;
        }

        // 1. Stream-Tabelle aktualisieren
        const streamUpdateData = {
            service_title: parsedData.service.title,
            service_abstract: parsedData.service.abstract,
            wfs_version: parsedData.service.version,
            provider_name: parsedData.service.providerName,
            provider_site: parsedData.service.providerSite,
            layer_anzahl: parsedData.layerCount,
            updated_at: new Date().toISOString()
        };

        const { error: updateError } = await this.supabase
            .from('wfs_streams')
            .update(streamUpdateData)
            .eq('id', stream.id);

        if (updateError) {
            console.error(`   ❌ Fehler beim Aktualisieren des Streams: ${updateError.message}`);
            this.stats.errors++;
        } else {
            console.log(`   ✅ Stream-Metadaten aktualisiert.`);
            this.stats.streamsUpdated++;
        }

        // 2. Layer-Tabelle befüllen
        if (parsedData.layerCount > 0) {
            const layersToInsert = parsedData.layers.map(layer => ({
                wfs_id: stream.id,
                name: layer.name,
                titel: layer.title,
                abstract: layer.abstract,
                default_crs: layer.defaultCRS,
                bbox: layer.bbox,
                weitere_crs: layer.otherCRS,
                outputformate: layer.outputFormats
            }));

            const { error: insertError } = await this.supabase
                .from('wfs_layers')
                .insert(layersToInsert);

            if (insertError) {
                console.error(`   ❌ Fehler beim Einfügen der Layer: ${insertError.message}`);
                this.stats.errors++;
            } else {
                console.log(`   ✨ ${layersToInsert.length} Layer erfolgreich in die Datenbank eingefügt.`);
                this.stats.layersAdded += layersToInsert.length;
            }
        }
    }

    printSummary() {
        console.log(`\n==================================================`);
        console.log(`📊 DATENBANK-BEFÜLLUNG ZUSAMMENFASSUNG`);
        console.log(`==================================================`);
        console.log(`   - Verarbeitete Streams: ${this.stats.streamsProcessed}`);
        console.log(`   - Aktualisierte Streams: ${this.stats.streamsUpdated}`);
        console.log(`   - Neu hinzugefügte Layer: ${this.stats.layersAdded}`);
        console.log(`   - Aufgetretene Fehler: ${this.stats.errors}`);
        console.log(`==================================================`);
    }

    async run() {
        await this.clearExistingLayers();
        const streams = await this.getSuccessfulStreams();

        for (const stream of streams) {
            await this.processStream(stream);
        }

        this.printSummary();
    }
}

if (require.main === module) {
    const populator = new DatabasePopulator();
    populator.run()
        .catch(console.error)
        .finally(() => {
            console.log("\nSkript beendet.");
            process.exit(0);
        });
}
