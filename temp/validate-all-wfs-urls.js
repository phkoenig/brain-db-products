/**
 * Validiert alle WFS-URLs in der Datenbank
 */

const WFSURLValidator = require('./wfs-url-validator');
const { createClient } = require('@supabase/supabase-js');

// Supabase Client Setup
const supabaseUrl = 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = 'sb_secret_0zmZF23GtaJ-pvpBX9pdHA_tCP8YWia';
const supabase = createClient(supabaseUrl, supabaseKey);

class WFSURLBatchValidator {
  constructor() {
    this.validator = new WFSURLValidator();
    this.stats = {
      total: 0,
      processed: 0,
      valid: 0,
      invalid: 0,
      errors: 0
    };
  }

  async validateAllWFSURLs() {
    console.log('🚀 Starte Validierung aller WFS-URLs...\n');

    try {
      // Alle WFS-Streams aus der Datenbank lesen
      const { data: streams, error } = await supabase
        .from('wfs_streams')
        .select('id, url, service_title')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fehler beim Lesen der WFS-Streams:', error.message);
        return;
      }

      this.stats.total = streams.length;
      console.log(`📊 Gefunden: ${this.stats.total} WFS-Streams\n`);

      // URLs in Batches verarbeiten
      const batchSize = 5;
      for (let i = 0; i < streams.length; i += batchSize) {
        const batch = streams.slice(i, i + batchSize);
        console.log(`📦 Verarbeite Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(streams.length / batchSize)}`);
        
        await this.processBatch(batch);
        
        // Pause zwischen Batches
        if (i + batchSize < streams.length) {
          console.log('   ⏳ Pause zwischen Batches...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.printFinalStats();

    } catch (error) {
      console.error('❌ Fehler bei der Batch-Validierung:', error.message);
    }
  }

  async processBatch(streams) {
    const promises = streams.map(stream => this.validateSingleURL(stream));
    await Promise.all(promises);
  }

  async validateSingleURL(stream) {
    // Erstelle für jede URL eine NEUE, saubere Validator-Instanz, um Race Conditions zu vermeiden.
    const validator = new WFSURLValidator();

    try {
      console.log(`🔍 Validiere: ${stream.service_title || stream.url}`);
      
      // URL validieren
      const validationResult = await validator.validateWFSURL(stream.url);
      
      // Ergebnisse in Datenbank speichern
      const { error } = await supabase
        .from('wfs_streams')
        .update({
          url_syntax_valid: validationResult.url_syntax_valid,
          server_reachable: validationResult.server_reachable,
          xml_response_valid: validationResult.xml_response_valid,
          last_validation_check: validationResult.last_validation_check,
          validation_notes: validationResult.validation_notes.join('; ')
        })
        .eq('id', stream.id);

      if (error) {
        console.log(`   ❌ Fehler beim Speichern: ${error.message}`);
        this.stats.errors++;
      } else {
        if (validationResult.overall_valid) {
          console.log(`   ✅ Gültig`);
          this.stats.valid++;
        } else {
          console.log(`   ❌ Ungültig: ${validationResult.validation_notes.join(', ')}`);
          this.stats.invalid++;
        }
      }

      this.stats.processed++;
      
      // Validator zurücksetzen für nächste URL
      // this.validator.reset(); // This line is no longer needed as validator is local

    } catch (error) {
      console.log(`   ❌ Exception bei der Validierung von ${stream.url}: ${error.message}`);
      this.stats.errors++;
      this.stats.processed++;
    }
  }

  printFinalStats() {
    console.log('\n\n📊 Validierung abgeschlossen!');
    console.log('='.repeat(50));
    console.log(`📈 Gesamt: ${this.stats.total} URLs`);
    console.log(`✅ Gültig: ${this.stats.valid} URLs`);
    console.log(`❌ Ungültig: ${this.stats.invalid} URLs`);
    console.log(`⚠️  Fehler: ${this.stats.errors} URLs`);
    
    if (this.stats.total > 0) {
        const successRate = ((this.stats.valid / this.stats.total) * 100).toFixed(1);
        console.log(`📊 Erfolgsrate: ${successRate}%`);
    }
    
    console.log('='.repeat(50));
  }
}

// Führe Validierung aus
if (require.main === module) {
  const batchValidator = new WFSURLBatchValidator();
  batchValidator.validateAllWFSURLs()
    .catch(console.error)
    .finally(() => {
        console.log("\nSkript beendet.");
        process.exit(0); // Expliziter Exit-Befehl
    });
}

module.exports = WFSURLBatchValidator;