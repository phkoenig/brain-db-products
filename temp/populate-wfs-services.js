/**
 * Populate WFS Services from JSON Test Data
 * 
 * This script reads the wfs_de_testdaten.json file and adds missing
 * WFS services to the database based on the existing entries.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

class WFSPopulator {
  constructor() {
    this.testData = null;
    this.existingUrls = new Set();
    this.missingServices = [];
    this.stats = {
      total: 0,
      existing: 0,
      missing: 0,
      added: 0,
      errors: 0
    };
  }

  /**
   * Lädt die Testdaten aus der JSON-Datei
   */
  async loadTestData() {
    try {
      const jsonPath = path.join(__dirname, '..', 'database', 'wfs_de_testdaten.json');
      const jsonContent = await fs.readFile(jsonPath, 'utf8');
      this.testData = JSON.parse(jsonContent);
      console.log('✅ Testdaten geladen:', Object.keys(this.testData).length, 'Bundesländer');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Testdaten:', error.message);
      return false;
    }
  }

  /**
   * Lädt die bereits vorhandenen URLs aus der Datenbank
   */
  async loadExistingUrls() {
    try {
      const { data, error } = await supabase
        .from('wfs_streams')
        .select('url');

      if (error) {
        console.error('❌ Fehler beim Laden der vorhandenen URLs:', error.message);
        return false;
      }

      this.existingUrls = new Set(data.map(row => row.url));
      this.stats.existing = this.existingUrls.size;
      console.log('✅ Vorhandene URLs geladen:', this.stats.existing);
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Laden der vorhandenen URLs:', error.message);
      return false;
    }
  }

  /**
   * Analysiert die Testdaten und identifiziert fehlende Services
   */
  analyzeTestData() {
    console.log('🔍 Analysiere Testdaten...');
    
    for (const [bundesland, services] of Object.entries(this.testData)) {
      for (const service of services) {
        this.stats.total++;
        
        const url = service.WFS_GetCapabilities_URL;
        if (!url || url.includes('URL via') || url.includes('Suche') || url.includes('Downloadseite')) {
          continue; // Überspringe Services ohne direkte URL
        }

        if (!this.existingUrls.has(url)) {
          this.missingServices.push({
            url: url,
            bundesland: bundesland,
            bundesland_code: this.extractBundeslandCode(service.Bundesland),
            service_title: service.Dienstbezeichnung,
            datentyp: service.Datentyp,
            lizenz: service.Lizenz,
            bemerkungen: service.Bemerkungen
          });
          this.stats.missing++;
        }
      }
    }

    console.log(`📊 Analyse abgeschlossen:`);
    console.log(`   - Gesamt: ${this.stats.total}`);
    console.log(`   - Bereits vorhanden: ${this.stats.existing}`);
    console.log(`   - Fehlend: ${this.stats.missing}`);
  }

  /**
   * Extrahiert den Bundesland-Code aus dem Bundesland-String
   */
  extractBundeslandCode(bundeslandStr) {
    if (!bundeslandStr) return null;
    
    const match = bundeslandStr.match(/\(([A-Z]{2})\)/);
    return match ? match[1] : null;
  }

  /**
   * Fügt fehlende WFS-Services zur Datenbank hinzu
   */
  async addMissingServices() {
    console.log('🚀 Füge fehlende Services hinzu...');
    
    for (const service of this.missingServices) {
      try {
        const streamData = {
          url: service.url,
          land_name: 'Deutschland',
          land_code: 'DE',
          bundesland_oder_region: service.bundesland,
          anbieter: service.bundesland,
          inhalt: service.datentyp ? service.datentyp.substring(0, 100) : null,
          service_title: service.service_title,
          service_abstract: `${service.datentyp} - ${service.bundesland}`,
          wfs_version: '2.0.0', // Standard, wird beim ersten Request aktualisiert
          layer_anzahl: 0, // Wird beim ersten Request aktualisiert
          ist_aktiv: false, // Wird auf true gesetzt nach erfolgreichem Request
          inspire_konform: true, // Standard für INSPIRE-Services
          inspire_diensttyp: 'WFS',
          tags: [service.datentyp, service.bundesland],
          meta: {
            lizenz: service.lizenz,
            bemerkungen: service.bemerkungen,
            bundesland_code: service.bundesland_code
          },
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('wfs_streams')
          .insert(streamData)
          .select();

        if (error) {
          console.error(`❌ Fehler beim Hinzufügen von ${service.url}:`, error.message);
          this.stats.errors++;
        } else {
          console.log(`✅ Hinzugefügt: ${service.service_title} (${service.bundesland})`);
          this.stats.added++;
        }

        // Kurze Pause zwischen den Inserts
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Exception beim Hinzufügen von ${service.url}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Zeigt eine Zusammenfassung der Ergebnisse
   */
  showSummary() {
    console.log('\n📈 Zusammenfassung:');
    console.log('============================================================');
    console.log(`1. ✅ Testdaten geladen: ${Object.keys(this.testData).length} Bundesländer`);
    console.log(`2. ✅ Vorhandene URLs geladen: ${this.stats.existing}`);
    console.log(`3. ✅ Analyse abgeschlossen: ${this.stats.total} Services geprüft`);
    console.log(`4. ✅ Fehlende Services identifiziert: ${this.stats.missing}`);
    console.log(`5. ✅ Neue Services hinzugefügt: ${this.stats.added}`);
    if (this.stats.errors > 0) {
      console.log(`6. ⚠️  Fehler aufgetreten: ${this.stats.errors}`);
    }
    console.log('============================================================');
    console.log(`📊 Gesamtergebnis: ${this.stats.added}/${this.stats.missing} fehlende Services hinzugefügt`);
  }

  /**
   * Führt den gesamten Populate-Prozess aus
   */
  async run() {
    console.log('🚀 Starte WFS-Services Population...\n');
    
    try {
      // 1. Testdaten laden
      if (!(await this.loadTestData())) return;
      
      // 2. Vorhandene URLs laden
      if (!(await this.loadExistingUrls())) return;
      
      // 3. Testdaten analysieren
      this.analyzeTestData();
      
      // 4. Fehlende Services hinzufügen
      if (this.missingServices.length > 0) {
        await this.addMissingServices();
      } else {
        console.log('🎉 Alle Services sind bereits in der Datenbank vorhanden!');
      }
      
      // 5. Zusammenfassung anzeigen
      this.showSummary();
      
    } catch (error) {
      console.error('❌ Kritischer Fehler:', error.message);
    }
  }
}

// Skript ausführen
if (require.main === module) {
  const populator = new WFSPopulator();
  populator.run();
}

module.exports = WFSPopulator;
