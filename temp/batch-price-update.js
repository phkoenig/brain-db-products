const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Batch Price Update Script für alle 17 Produkte
const productIds = [
  "38e948a3-7e97-441c-98ec-43a60393fb1d", // ILVE P12W Standherd Professional Plus 120 cm
  "65cb9b09-b032-4a45-a2c2-3a5051d227b1", // Aufsatzwaschbecken O-544
  "03e52784-f81f-4f74-8668-c65f3b60d1ef", // Murano Smalto Aquamarine J
  "675ffdc2-e24f-4455-9f11-52172999b5dc", // Eiche Antik Smoky Horse Fossil Grey geräuchert
  "0552e34d-03d6-4b65-949b-0d2e93f2f9d3", // StoneArt BS-533 weiß 180x140 glänzend
  "81341d5c-d876-4241-8ddf-75fde77ef487", // Cleanet Riva Wand-Dusch-WC mit WC-Sitz
  "41414d35-d72f-4dbf-a2f0-77c7cba1e05d", // Saxoboard Gefälledämmung für Boden und Dach
  "406900df-1c66-4865-a8bf-96b97b15758b", // Gefälledämmung für Boden und Dach
  "041ab4db-9d05-4939-b6d2-7609bdb9df83", // Taupebeton Terra CCN-3004 120x120 Matt R10 9 mm
  "87d16532-7d33-4a5d-9f4d-a76a911f5787", // puren VIP B2 Vakuumdämmplatte WLS 007 N543-00577-GRP
  "9a5e609e-98be-493c-a4e0-81f25ff59dd6", // BauderVIP TE
  "59863aca-d71d-4214-94c7-a5a94a5b56be", // ME by Starck Wand-WC mit HygieneFlush
  "67fac280-759e-4c04-8852-7cb6415d9e9c", // KMDA 7272 FR-U Silence
  "447fc02c-30b1-451e-b0dc-c9cc57e20bf6", // Smeg FAB30RPG5
  "b5fc74e5-2d76-438a-83b3-56f9995ba2eb", // Steel Ascot Dunstabzugshaube AKL120
  "ee410854-ba66-40c8-803c-18882752a795", // Test Hersteller Produkt
  "9ae7c19b-3d16-40ea-8bf8-a83cc061de09"  // Test Händler Produkt
];

async function updateAllProductPrices() {
  try {
    console.log('🔄 Starting batch price update for all 17 products...');
    console.log('---');

    let successCount = 0;
    let errorCount = 0;

    // Für jedes Produkt das Preis-Update ausführen
    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      
      console.log(`[${i + 1}/${productIds.length}] 🔄 Updating product: ${productId}`);

      try {
        // Preis-Update API aufrufen
        const response = await fetch('http://localhost:3000/api/extraction/update-primary-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId })
        });

        const result = await response.json();

        if (result.success) {
          console.log(`   ✅ Success: ${result.data.oldPrice || 'null'} → ${result.data.newPrice} ${result.data.newUnit}`);
          successCount++;
        } else {
          console.log(`   ❌ Error: ${result.error}`);
          errorCount++;
        }

      } catch (error) {
        console.log(`   ❌ Network Error: ${error.message}`);
        errorCount++;
      }

      console.log('   ---');
      
      // Kleine Pause zwischen den Requests (Rate Limiting)
      if (i < productIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Zusammenfassung
    console.log('🎯 BATCH UPDATE COMPLETED');
    console.log(`📊 Total Products: ${productIds.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Success Rate: ${((successCount / productIds.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Batch update failed:', error);
  }
}

// Script ausführen
updateAllProductPrices(); 