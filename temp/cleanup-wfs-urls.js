/**
 * Bereinigt alle WFS-URLs in der Datenbank, indem Query-Parameter entfernt werden.
 * Ziel: Nur die Stamm-URL des Dienstes speichern.
 */

const { createClient } = require('@supabase/supabase-js');
const { URL } = require('url');

// Supabase Client Setup
const supabaseUrl = 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = 'sb_secret_0zmZF23GtaJ-pvpBX9pdHA_tCP8YWia';
const supabase = createClient(supabaseUrl, supabaseKey);

class WFSURLCleaner {
  constructor() {
    this.stats = {
      processed: 0,
      changed: 0,
      unchanged: 0,
      errors: 0
    };
  }

  async run() {
    console.log('🚀 Starte die Bereinigung der WFS-URLs...');

    try {
      const { data: streams, error } = await supabase
        .from('wfs_streams')
        .select('id, url');

      if (error) {
        throw new Error(`Fehler beim Abrufen der Streams: ${error.message}`);
      }

      console.log(`📊 ${streams.length} WFS-Streams gefunden. Verarbeite...`);

      for (const stream of streams) {
        await this.cleanAndupdateURL(stream);
      }

      this.printSummary();

    } catch (error) {
      console.error('❌ Ein schwerwiegender Fehler ist aufgetreten:', error.message);
    }
  }

  async cleanAndupdateURL(stream) {
    this.stats.processed++;
    try {
      const originalUrl = stream.url;
      const urlObj = new URL(originalUrl);
      
      // Entferne alle Query-Parameter
      const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

      // Entferne eventuelle Trailing Slashes
      const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

      if (originalUrl !== cleanUrl) {
        const { error } = await supabase
          .from('wfs_streams')
          .update({ url: cleanUrl })
          .eq('id', stream.id);

        if (error) {
          console.error(`   ❌ Fehler beim Update von ID ${stream.id}: ${error.message}`);
          this.stats.errors++;
        } else {
          console.log(`   ✏️  Aktualisiert: ${originalUrl} -> ${cleanUrl}`);
          this.stats.changed++;
        }
      } else {
        this.stats.unchanged++;
      }
    } catch (error) {
      console.error(`   ⚠️  Fehler bei der Verarbeitung der URL '${stream.url}': ${error.message}`);
      this.stats.errors++;
    }
  }

  printSummary() {
    console.log('\n\n📊 Zusammenfassung der URL-Bereinigung:');
    console.log('='.repeat(50));
    console.log(`🔎 Verarbeitete URLs: ${this.stats.processed}`);
    console.log(`✏️  Geänderte URLs:    ${this.stats.changed}`);
    console.log(`✅ Unveränderte URLs: ${this.stats.unchanged}`);
    console.log(`❌ Fehler:            ${this.stats.errors}`);
    console.log('='.repeat(50));
    console.log('🎉 Bereinigung abgeschlossen!');
  }
}

// Skript ausführen
if (require.main === module) {
  const cleaner = new WFSURLCleaner();
  cleaner.run();
}
