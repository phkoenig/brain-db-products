const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// INSPIRE-WFS-URLs aus der CSV-Datei (nur WFS, keine ATOM)
const INSPIRE_WFS_2025 = [
  // Baden-Württemberg
  { url: 'https://owsproxy.lgl-bw.de/owsproxy/wfs/WFS_INSP_BW_Flst_ALKIS?service=WFS&request=GetCapabilities', bundesland: 'Baden-Württemberg', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE BY 2.0' },
  { url: 'https://owsproxy.lgl-bw.de/owsproxy/wfs/WFS_INSP_BW_Gebaeude_ALKIS?service=WFS&request=GetCapabilities', bundesland: 'Baden-Württemberg', datenthema: 'Gebäude', lizenz: 'DL-DE BY 2.0' },
  
  // Bayern
  { url: 'https://geoservices.bayern.de/inspire-ows/v1/alkis/cp/dls/wfs?service=WFS&request=GetCapabilities', bundesland: 'Bayern', datenthema: 'Flurstücke/Grundstücke', lizenz: 'Beschränkt, Nutzungsbedingungen des LDBV beachten' },
  { url: 'https://geoservices.bayern.de/inspire-ows/v1/alkis/bu/dls/wfs?service=WFS&request=GetCapabilities', bundesland: 'Bayern', datenthema: 'Gebäude', lizenz: 'Beschränkt, Nutzungsbedingungen des LDBV beachten' },
  
  // Berlin
  { url: 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_flurstueck?service=WFS&request=GetCapabilities', bundesland: 'Berlin', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE Zero 2.0' },
  { url: 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt/s_wfs_alkis_gebaeude?service=WFS&request=GetCapabilities', bundesland: 'Berlin', datenthema: 'Gebäude', lizenz: 'DL-DE Zero 2.0' },
  
  // Brandenburg
  { url: 'https://inspire.brandenburg.de/services/cp_alkis_wfs?service=WFS&request=GetCapabilities', bundesland: 'Brandenburg', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE BY 2.0' },
  { url: 'https://inspire.brandenburg.de/services/bu_alkis_wfs?service=WFS&request=GetCapabilities', bundesland: 'Brandenburg', datenthema: 'Gebäude', lizenz: 'DL-DE BY 2.0' },
  
  // Bremen
  { url: 'https://geodienste.bremen.de/wfs_alkis?service=WFS&request=GetCapabilities', bundesland: 'Bremen', datenthema: 'Flurstücke/Gebäude', lizenz: 'CC BY 4.0 (Kombinierter Dienst)' },
  
  // Hamburg
  { url: 'https://geodienste.hamburg.de/HH_WFS_INSPIRE_Flurstuecke?service=WFS&request=GetCapabilities', bundesland: 'Hamburg', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE BY 2.0' },
  { url: 'https://geodienste.hamburg.de/HH_WFS_INSPIRE_Gebaeude_2D_ALKIS?service=WFS&request=GetCapabilities', bundesland: 'Hamburg', datenthema: 'Gebäude', lizenz: 'DL-DE BY 2.0' },
  
  // Hessen
  { url: 'https://inspire-hessen.de/ows/services/org.2.753259a3-2469-4a16-a8a6-f1a02b897b0d_wfs?service=WFS&request=GetCapabilities', bundesland: 'Hessen', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE Zero 2.0' },
  { url: 'https://inspire-hessen.de/ows/services/org.2.162ae5d1-e615-42d4-913a-4e207b53a067_wfs?service=WFS&request=GetCapabilities', bundesland: 'Hessen', datenthema: 'Gebäude', lizenz: 'DL-DE Zero 2.0' },
  
  // Mecklenburg-Vorpommern
  { url: 'https://www.geodaten-mv.de/dienste/inspire_cp_alkis_download?service=WFS&request=GetCapabilities', bundesland: 'Mecklenburg-Vorpommern', datenthema: 'Flurstücke/Grundstücke', lizenz: 'CC BY 4.0' },
  { url: 'https://www.geodaten-mv.de/dienste/inspire_bu_core2d_alkis_download?service=WFS&request=GetCapabilities', bundesland: 'Mecklenburg-Vorpommern', datenthema: 'Gebäude', lizenz: 'CC BY 4.0' },
  
  // Niedersachsen
  { url: 'https://www.inspire.niedersachsen.de/doorman/noauth/alkis-dls-cp?service=WFS&request=GetCapabilities', bundesland: 'Niedersachsen', datenthema: 'Flurstücke/Grundstücke', lizenz: 'Open Data' },
  { url: 'https://www.inspire.niedersachsen.de/doorman/noauth/alkis-dls-bu-2d?service=WFS&request=GetCapabilities', bundesland: 'Niedersachsen', datenthema: 'Gebäude', lizenz: 'Open Data' },
  
  // Nordrhein-Westfalen
  { url: 'https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-flurstuecke_alkis?service=WFS&request=GetCapabilities', bundesland: 'Nordrhein-Westfalen', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE Zero 2.0' },
  { url: 'https://www.wfs.nrw.de/geobasis/wfs_nw_inspire-gebaeude-2d_alkis?service=WFS&request=GetCapabilities', bundesland: 'Nordrhein-Westfalen', datenthema: 'Gebäude', lizenz: 'DL-DE Zero 2.0' },
  
  // Rheinland-Pfalz
  { url: 'https://geo5.service24.rlp.de/wfs/alkis_rp.fcgi?service=WFS&request=GetCapabilities', bundesland: 'Rheinland-Pfalz', datenthema: 'Flurstücke/Gebäude', lizenz: 'DL-DE BY 2.0 (Vereinfachter, kombinierter Dienst)' },
  
  // Saarland
  { url: 'https://geoportal.saarland.de/gdi-sl/inspirewfs_Flurstuecke_Grundstuecke_ALKIS?service=WFS&request=GetCapabilities', bundesland: 'Saarland', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE BY 2.0' },
  { url: 'https://geoportal.saarland.de/gdi-sl/inspirewfs_Gebaeude_2D_ALKIS?service=WFS&request=GetCapabilities', bundesland: 'Saarland', datenthema: 'Gebäude', lizenz: 'DL-DE BY 2.0' },
  
  // Sachsen
  { url: 'https://geodienste.sachsen.de/aaa/public_inspire/alkis/cp/dls/wfs?service=WFS&request=GetCapabilities', bundesland: 'Sachsen', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE BY 2.0' },
  { url: 'https://geodienste.sachsen.de/aaa/public_inspire/alkis/bu/dls/wfs?service=WFS&request=GetCapabilities', bundesland: 'Sachsen', datenthema: 'Gebäude', lizenz: 'DL-DE BY 2.0' },
  
  // Sachsen-Anhalt
  { url: 'https://geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_WFS_ALKIS_CP/guest?service=WFS&request=GetCapabilities', bundesland: 'Sachsen-Anhalt', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE BY 2.0' },
  { url: 'https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_BU_WFS?service=WFS&request=GetCapabilities', bundesland: 'Sachsen-Anhalt', datenthema: 'Gebäude', lizenz: 'DL-DE BY 2.0' },
  
  // Schleswig-Holstein
  { url: 'https://sgx.geodaten-sh.de/sgx_dienste/wfs/inspire_cp_alkis?service=WFS&request=GetCapabilities', bundesland: 'Schleswig-Holstein', datenthema: 'Flurstücke/Grundstücke', lizenz: 'CC BY 4.0' },
  { url: 'https://sgx.geodaten-sh.de/sgx_dienste/wfs/inspire_bu_2d_alkis?service=WFS&request=GetCapabilities', bundesland: 'Schleswig-Holstein', datenthema: 'Gebäude', lizenz: 'CC BY 4.0' },
  
  // Thüringen
  { url: 'https://www.geoproxy.geoportal-th.de/geoproxy/services/INSPIREcp_wfs?service=WFS&request=GetCapabilities', bundesland: 'Thüringen', datenthema: 'Flurstücke/Grundstücke', lizenz: 'DL-DE BY 2.0' },
  { url: 'https://www.geoproxy.geoportal-th.de/geoproxy/services/INSPIREbu_wfs?service=WFS&request=GetCapabilities', bundesland: 'Thüringen', datenthema: 'Gebäude', lizenz: 'DL-DE BY 2.0' }
];

/**
 * Verbesserte Duplikat-Erkennung mit präziserer Logik
 */
function isDuplicate(newUrl, existingUrl, newBundesland, existingBundesland) {
  // Entferne Query-Parameter für Vergleich
  const cleanNewUrl = newUrl.split('?')[0];
  const cleanExistingUrl = existingUrl.split('?')[0];
  
  // 1. Direkte Übereinstimmung
  if (cleanNewUrl === cleanExistingUrl) {
    return { isDuplicate: true, reason: 'Exakte URL-Übereinstimmung' };
  }
  
  // 2. Stamm-URL Vergleich (nur wenn gleiches Bundesland)
  if (newBundesland === existingBundesland) {
    const newStem = cleanNewUrl.replace(/\/[^\/]*$/, '');
    const existingStem = cleanExistingUrl.replace(/\/[^\/]*$/, '');
    
    if (newStem === existingStem) {
      return { isDuplicate: true, reason: 'Gleiche Stamm-URL im gleichen Bundesland' };
    }
  }
  
  // 3. Service-Pattern Vergleich (nur bei spezifischen Mustern)
  const newService = extractServicePattern(cleanNewUrl);
  const existingService = extractServicePattern(cleanExistingUrl);
  
  if (newService && existingService && newService === existingService && newBundesland === existingBundesland) {
    return { isDuplicate: true, reason: 'Gleiches Service-Pattern im gleichen Bundesland' };
  }
  
  return { isDuplicate: false, reason: null };
}

/**
 * Extrahiert Service-Pattern aus URL
 */
function extractServicePattern(url) {
  const patterns = [
    /alkis.*wfs/i,
    /inspire.*wfs/i,
    /wfs.*alkis/i,
    /gebaeude.*wfs/i,
    /flurstueck.*wfs/i
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(url)) {
      return pattern.source;
    }
  }
  
  return null;
}

/**
 * Holt alle vorhandenen WFS-URLs aus der Datenbank
 */
async function getExistingUrls() {
  const { data, error } = await supabase
    .from('wfs_streams')
    .select('url, bundesland_oder_region, service_title');
    
  if (error) {
    console.error('Fehler beim Abrufen der vorhandenen URLs:', error);
    return [];
  }
  
  return data;
}

/**
 * Fügt neue WFS-Streams hinzu
 */
async function addNewWFSStreams() {
  console.log('🔄 Starte Import der INSPIRE-WFS-URLs 2025 (verbesserte Duplikat-Erkennung)...');
  
  // Hole vorhandene URLs
  const existingStreams = await getExistingUrls();
  console.log(`📊 ${existingStreams.length} vorhandene WFS-Streams gefunden`);
  
  const newStreams = [];
  const duplicates = [];
  const errors = [];
  
  // Prüfe jede neue URL
  for (const newStream of INSPIRE_WFS_2025) {
    let isDuplicateFound = false;
    
    // Prüfe auf Duplikate
    for (const existingStream of existingStreams) {
      const duplicateCheck = isDuplicate(
        newStream.url, 
        existingStream.url, 
        newStream.bundesland, 
        existingStream.bundesland_oder_region
      );
      
      if (duplicateCheck.isDuplicate) {
        duplicates.push({
          new: newStream,
          existing: existingStream,
          reason: duplicateCheck.reason
        });
        isDuplicateFound = true;
        break;
      }
    }
    
    if (!isDuplicateFound) {
      newStreams.push(newStream);
    }
  }
  
  console.log(`📋 ${newStreams.length} neue WFS-Streams gefunden`);
  console.log(`🔄 ${duplicates.length} Duplikate erkannt`);
  
  // Füge neue Streams hinzu
  for (const stream of newStreams) {
    try {
      const { data, error } = await supabase
        .from('wfs_streams')
        .insert({
          url: stream.url,
          land_name: 'Deutschland',
          bundesland_oder_region: stream.bundesland,
          service_title: `INSPIRE-WFS ${stream.bundesland} ${stream.datenthema}`,
          inhalt: stream.datenthema,
          anmerkungen: stream.lizenz,
          ist_aktiv: true,
          inspire_konform: true,
          inspire_diensttyp: 'WFS',
          zuletzt_geprueft: new Date().toISOString()
        });
        
      if (error) {
        errors.push({
          stream: stream,
          error: error.message
        });
        console.error(`❌ Fehler beim Hinzufügen von ${stream.url}:`, error.message);
      } else {
        console.log(`✅ Hinzugefügt: ${stream.bundesland} - ${stream.datenthema}`);
      }
    } catch (error) {
      errors.push({
        stream: stream,
        error: error.message
      });
      console.error(`❌ Exception beim Hinzufügen von ${stream.url}:`, error.message);
    }
  }
  
  // Zusammenfassung
  console.log('\n📊 Import-Zusammenfassung:');
  console.log(`✅ Neue Streams hinzugefügt: ${newStreams.length - errors.length}`);
  console.log(`🔄 Duplikate übersprungen: ${duplicates.length}`);
  console.log(`❌ Fehler: ${errors.length}`);
  
  if (duplicates.length > 0) {
    console.log('\n🔄 Übersprungene Duplikate:');
    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. ${dup.new.bundesland} - ${dup.new.datenthema}`);
      console.log(`   Neue URL: ${dup.new.url}`);
      console.log(`   Vorhanden: ${dup.existing.url} (${dup.existing.bundesland_oder_region})`);
      console.log(`   Grund: ${dup.reason}\n`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Fehler beim Import:');
    errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.stream.bundesland} - ${err.stream.datenthema}`);
      console.log(`   URL: ${err.stream.url}`);
      console.log(`   Fehler: ${err.error}\n`);
    });
  }
  
  return {
    added: newStreams.length - errors.length,
    duplicates: duplicates.length,
    errors: errors.length
  };
}

// Führe Import aus
addNewWFSStreams()
  .then(result => {
    console.log('\n🎉 Import abgeschlossen!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fataler Fehler beim Import:', error);
    process.exit(1);
  });
