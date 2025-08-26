/**
 * Ersetzt alle WFS-Dienste in der Datenbank mit den Daten aus der JSON-Datei.
 * 1. Löscht alle bestehenden WFS-Layer und -Streams.
 * 2. Liest die neue JSON-Datei ein.
 * 3. Fügt alle WFS-Dienste aus der JSON-Datei in die Datenbank ein.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase Client Setup
const supabaseUrl = 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

const JSON_FILE_PATH = path.join(__dirname, '../database/wfs_de_testdaten_update.json');

class WFSDatabaseRepopulator {
  constructor() {
    this.stats = {
      deletedLayers: 0,
      deletedStreams: 0,
      addedStreams: 0,
      skippedStreams: 0,
      errors: 0
    };
  }

  async run() {
    console.log('🚀 Starte die vollständige Neupopulierung der WFS-Datenbank...');

    await this.clearDatabase();
    await this.populateFromJSON();

    this.printFinalStats();
  }

  async clearDatabase() {
    console.log('\n🗑️  Leere die Datenbank...');

    // 1. Layer löschen (wegen Foreign-Key-Constraint)
    const { data: layers, error: layerError } = await supabase
      .from('wfs_layers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Trick to delete all

    if (layerError) {
      console.error('   ❌ Fehler beim Löschen der WFS-Layer:', layerError.message);
      this.stats.errors++;
    } else {
      this.stats.deletedLayers = layers ? layers.length : 0;
      console.log(`   ✅ ${this.stats.deletedLayers} WFS-Layer gelöscht.`);
    }

    // 2. Streams löschen
    const { data: streams, error: streamError } = await supabase
      .from('wfs_streams')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Trick to delete all

    if (streamError) {
      console.error('   ❌ Fehler beim Löschen der WFS-Streams:', streamError.message);
      this.stats.errors++;
    } else {
      this.stats.deletedStreams = streams ? streams.length : 0;
      console.log(`   ✅ ${this.stats.deletedStreams} WFS-Streams gelöscht.`);
    }
  }

  async populateFromJSON() {
    console.log(`\n📄 Lese und verarbeite JSON-Datei: ${JSON_FILE_PATH}`);

    try {
      const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf-8'));
      
      for (const bundesland of jsonData.bundeslaender) {
        console.log(`   ➡️  Verarbeite ${bundesland.name}...`);
        
        for (const service of bundesland.wfs_dienste) {
          // Überspringe Dienste ohne gültige GetCapabilities-URL
          if (!service.get_capabilities_url || !service.get_capabilities_url.toLowerCase().includes('http')) {
            console.log(`      ⚠️  Überspringe Dienst ohne gültige URL: ${service.dienstbezeichnung}`);
            this.stats.skippedStreams++;
            continue;
          }

          const streamData = {
            url: service.get_capabilities_url,
            land_name: 'Deutschland',
            land_code: 'DE',
            bundesland_oder_region: bundesland.name,
            anbieter: service.dienstbezeichnung,
            inhalt: service.datentyp,
            service_title: service.dienstbezeichnung,
            service_abstract: service.status,
            ist_aktiv: service.funktional,
            tags: [bundesland.kuerzel, service.datentyp, service.inspire_thema].filter(Boolean),
            meta: {
              lizenz: service.lizenz,
              bemerkungen: service.status,
              inspire_thema: service.inspire_thema,
              bundesland_code: bundesland.kuerzel
            },
            created_at: new Date().toISOString()
          };

          const { error } = await supabase.from('wfs_streams').insert(streamData);

          if (error) {
            console.error(`      ❌ Fehler beim Einfügen von '${service.dienstbezeichnung}':`, error.message);
            this.stats.errors++;
          } else {
            this.stats.addedStreams++;
          }
        }
      }
      console.log('\n   ✅ JSON-Verarbeitung abgeschlossen.');
    } catch (error) {
      console.error('❌ Fehler beim Lesen oder Parsen der JSON-Datei:', error.message);
      this.stats.errors++;
    }
  }

  printFinalStats() {
    console.log('\n\n📊 Zusammenfassung der Neupopulierung:');
    console.log('='.repeat(50));
    console.log(`🗑️  Gelöschte Streams: ${this.stats.deletedStreams}`);
    console.log(`🗑️  Gelöschte Layer:   ${this.stats.deletedLayers}`);
    console.log(`✨ Hinzugefügte Streams: ${this.stats.addedStreams}`);
    console.log(`⚠️  Übersprungene Streams (ungültige URL): ${this.stats.skippedStreams}`);
    console.log(`❌ Fehler: ${this.stats.errors}`);
    console.log('='.repeat(50));
    
    if (this.stats.errors === 0) {
      console.log('🎉 Datenbank erfolgreich mit neuen Daten befüllt!');
    } else {
      console.log('⚠️  Die Neupopulierung wurde mit Fehlern abgeschlossen. Bitte Logs prüfen.');
    }
  }
}

// Skript ausführen
if (require.main === module) {
  const repopulator = new WFSDatabaseRepopulator();
  repopulator.run().catch(console.error);
}
