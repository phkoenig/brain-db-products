/**
 * WFS-GetCapabilities Parser Tests
 * 
 * Testet die Funktionalität zum Parsen von WFS-GetCapabilities XML-Dokumenten
 * und die Extraktion von Service- und Layer-Metadaten.
 * 
 * IMPLEMENTIERT: Robuste Soft-Logic für verschiedene XML-Strukturen
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpmhwyjiuodsvjowddsm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWh3eWppdW9kc3Zqb3dkZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjY0NDQsImV4cCI6MjA2NDIwMjQ0NH0.x0WGKEQfTmv5MSR3e7YGgg_bvec2niphg6ZSho-T-6E';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test XML-Daten (vereinfachte GetCapabilities-Beispiele)
const TEST_GETCAPABILITIES_XML = {
  // WFS 2.0.0 Beispiel
  wfs20: `<?xml version="1.0" encoding="UTF-8"?>
<wfs:WFS_Capabilities version="2.0.0" 
    xmlns:wfs="http://www.opengis.net/wfs/2.0"
    xmlns:ows="http://www.opengis.net/ows/1.1"
    xmlns:xlink="http://www.w3.org/1999/xlink">
  <ows:ServiceIdentification>
    <ows:Title>INSPIRE-WFS Flurstücke/Grundstücke ALKIS BB</ows:Title>
    <ows:Abstract>INSPIRE-konformer WFS für Flurstücke und Grundstücke in Brandenburg</ows:Abstract>
    <ows:ServiceType>WFS</ows:ServiceType>
    <ows:ServiceTypeVersion>2.0.0</ows:ServiceTypeVersion>
  </ows:ServiceIdentification>
  <ows:ServiceProvider>
    <ows:ProviderName>Land Brandenburg</ows:ProviderName>
    <ows:ProviderSite xlink:href="https://www.brandenburg.de"/>
  </ows:ServiceProvider>
  <wfs:FeatureTypeList>
    <wfs:FeatureType>
      <wfs:Name>cp:CadastralParcel</wfs:Name>
      <wfs:Title>Flurstücke/Grundstücke</wfs:Title>
      <wfs:Abstract>INSPIRE Cadastral Parcels</wfs:Abstract>
      <wfs:DefaultCRS>urn:ogc:def:crs:EPSG::25833</wfs:DefaultCRS>
      <wfs:OtherCRS>urn:ogc:def:crs:EPSG::4326</wfs:OtherCRS>
      <wfs:OutputFormats>
        <wfs:Format>application/gml+xml; version=3.2</wfs:Format>
        <wfs:Format>application/json</wfs:Format>
      </wfs:OutputFormats>
      <wfs:WGS84BoundingBox>
        <ows:LowerCorner>11.0 51.0</ows:LowerCorner>
        <ows:UpperCorner>15.0 53.5</ows:UpperCorner>
      </wfs:WGS84BoundingBox>
    </wfs:FeatureType>
  </wfs:FeatureTypeList>
</wfs:WFS_Capabilities>`,

  // WFS 1.1.0 Beispiel
  wfs11: `<?xml version="1.0" encoding="UTF-8"?>
<wfs:WFS_Capabilities version="1.1.0" 
    xmlns:wfs="http://www.opengis.net/wfs"
    xmlns:ows="http://www.opengis.net/ows"
    xmlns:xlink="http://www.w3.org/1999/xlink">
  <ows:ServiceIdentification>
    <ows:Title>ALKIS Berlin Flurstücke</ows:Title>
    <ows:Abstract>ALKIS Flurstücksdaten für Berlin</ows:Abstract>
    <ows:ServiceType>WFS</ows:ServiceType>
    <ows:ServiceTypeVersion>1.1.0</ows:ServiceTypeVersion>
  </ows:ServiceIdentification>
  <ows:ServiceProvider>
    <ows:ProviderName>Senatsverwaltung für Stadtentwicklung Berlin</ows:ProviderName>
    <ows:ProviderSite xlink:href="https://www.stadtentwicklung.berlin.de"/>
  </ows:ServiceProvider>
  <wfs:FeatureTypeList>
    <wfs:FeatureType>
      <wfs:Name>alkis:Flurstueck</wfs:Name>
      <wfs:Title>ALKIS Flurstücke</wfs:Title>
      <wfs:Abstract>Flurstücksdaten aus ALKIS</wfs:Abstract>
      <wfs:SRS>EPSG:25833</wfs:SRS>
      <wfs:LatLongBoundingBox minx="13.0" miny="52.3" maxx="13.8" maxy="52.7"/>
    </wfs:FeatureType>
  </wfs:FeatureTypeList>
</wfs:WFS_Capabilities>`,

  // Fehlerhaftes XML
  invalid: `<invalid>xml</invalid>`
};

/**
 * WFS-GetCapabilities Parser Klasse mit robuster Soft-Logic
 * 
 * FEATURES:
 * - Mehrere XML-Pfade für jedes Feld
 * - Namespace-Varianten (wfs:, ows:, unpräfixiert)
 * - Fallback-Strategien
 * - Intelligente Feldzuordnung
 * - Robuste Fehlerbehandlung
 */
class WFSCapabilitiesParser {
  constructor() {
    this.xmlParser = null;
    this.initParser();
  }

  /**
   * Initialisiert den XML-Parser
   */
  initParser() {
    try {
      // Echten XML-Parser für die Validierung initialisieren
      const parser = new XMLParser();
      
      this.xmlParser = {
        parse: (xml) => {
          // Wir verwenden den echten Parser, um die XML-Struktur zu validieren.
          // Wenn das XML ungültig ist, wirft fast-xml-parser einen Fehler,
          // der von den aufrufenden Methoden (parseServiceMetadata, etc.) gefangen wird.
          parser.parse(xml);
          
          // Wenn die Validierung erfolgreich ist, geben wir die rohen XML-Daten
          // für die bestehenden Regex-Funktionen zurück.
          return { success: true, data: xml };
        }
      };
    } catch (error) {
      console.error('Fehler beim Initialisieren des XML-Parsers:', error);
    }
  }

  /**
   * ROBUSTE SOFT-LOGIC: Extrahiert Service-Titel mit mehreren Fallback-Strategien
   */
  extractServiceTitle(xml) {
    // Strategie 1: OWS Namespace (Standard)
    let title = this.extractWithPatterns(xml, [
      /<ows:Title[^>]*>(.*?)<\/ows:Title>/s,
      /<Title[^>]*>(.*?)<\/Title>/s
    ]);
    
    if (title) return title;

    // Strategie 2: WFS Namespace
    title = this.extractWithPatterns(xml, [
      /<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s
    ]);
    
    if (title) return title;

    // Strategie 3: ServiceIdentification (verschachtelt)
    title = this.extractWithPatterns(xml, [
      /<ServiceIdentification[^>]*>.*?<Title[^>]*>(.*?)<\/Title>/s,
      /<ows:ServiceIdentification[^>]*>.*?<ows:Title[^>]*>(.*?)<\/ows:Title>/s
    ]);
    
    if (title) return title;

    // Strategie 4: Service-Name als Fallback
    title = this.extractWithPatterns(xml, [
      /<ServiceName[^>]*>(.*?)<\/ServiceName>/s,
      /<wfs:ServiceName[^>]*>(.*?)<\/wfs:ServiceName>/s
    ]);
    
    return title || 'Unbekannter WFS-Service';
  }

  /**
   * ROBUSTE SOFT-LOGIC: Extrahiert Service-Abstract mit mehreren Fallback-Strategien
   */
  extractServiceAbstract(xml) {
    // Strategie 1: OWS Namespace (Standard)
    let abstract = this.extractWithPatterns(xml, [
      /<ows:Abstract[^>]*>(.*?)<\/ows:Abstract>/s,
      /<Abstract[^>]*>(.*?)<\/Abstract>/s
    ]);
    
    if (abstract) return abstract;

    // Strategie 2: WFS Namespace
    abstract = this.extractWithPatterns(xml, [
      /<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s
    ]);
    
    if (abstract) return abstract;

    // Strategie 3: ServiceIdentification (verschachtelt)
    abstract = this.extractWithPatterns(xml, [
      /<ServiceIdentification[^>]*>.*?<Abstract[^>]*>(.*?)<\/Abstract>/s,
      /<ows:ServiceIdentification[^>]*>.*?<ows:Abstract[^>]*>(.*?)<\/ows:Abstract>/s
    ]);
    
    return abstract || 'Keine Beschreibung verfügbar';
  }

  /**
   * ROBUSTE SOFT-LOGIC: Extrahiert WFS-Version mit mehreren Fallback-Strategien
   */
  extractWFSVersion(xml) {
    // Strategie 1: Version-Attribut im WFS_Capabilities Tag
    let version = this.extractWithPatterns(xml, [
      /<wfs:WFS_Capabilities[^>]*version="([^"]+)"/,
      /<WFS_Capabilities[^>]*version="([^"]+)"/,
      /<Capabilities[^>]*version="([^"]+)"/
    ]);
    
    if (version) return version;

    // Strategie 2: ServiceTypeVersion
    version = this.extractWithPatterns(xml, [
      /<ows:ServiceTypeVersion[^>]*>(.*?)<\/ows:ServiceTypeVersion>/s,
      /<ServiceTypeVersion[^>]*>(.*?)<\/ServiceTypeVersion>/s
    ]);
    
    if (version) return version;

    // Strategie 3: Version aus ServiceType
    version = this.extractWithPatterns(xml, [
      /<ows:ServiceTypeVersion[^>]*>(.*?)<\/ows:ServiceTypeVersion>/s
    ]);
    
    // Fallback: Standard-Version basierend auf XML-Struktur
    if (xml.includes('WGS84BoundingBox') || xml.includes('DefaultCRS')) {
      return '2.0.0';
    } else if (xml.includes('LatLongBoundingBox') || xml.includes('SRS')) {
      return '1.1.0';
    }
    
    return '1.1.0'; // Standard-Fallback
  }

  /**
   * ROBUSTE SOFT-LOGIC: Extrahiert Provider-Name mit mehreren Fallback-Strategien
   */
  extractProviderName(xml) {
    // Strategie 1: OWS Namespace (Standard)
    let provider = this.extractWithPatterns(xml, [
      /<ows:ProviderName[^>]*>(.*?)<\/ows:ProviderName>/s,
      /<ProviderName[^>]*>(.*?)<\/ProviderName>/s
    ]);
    
    if (provider) return provider;

    // Strategie 2: ServiceProvider (verschachtelt)
    provider = this.extractWithPatterns(xml, [
      /<ServiceProvider[^>]*>.*?<ProviderName[^>]*>(.*?)<\/ProviderName>/s,
      /<ows:ServiceProvider[^>]*>.*?<ows:ProviderName[^>]*>(.*?)<\/ows:ProviderName>/s
    ]);
    
    if (provider) return provider;

    // Strategie 3: Organisation-Name als Fallback
    provider = this.extractWithPatterns(xml, [
      /<OrganisationName[^>]*>(.*?)<\/OrganisationName>/s,
      /<ows:OrganisationName[^>]*>(.*?)<\/ows:OrganisationName>/s
    ]);
    
    return provider || 'Unbekannter Anbieter';
  }

  /**
   * ROBUSTE SOFT-LOGIC: Extrahiert Provider-Site mit mehreren Fallback-Strategien
   */
  extractProviderSite(xml) {
    // Strategie 1: xlink:href Attribut
    let site = this.extractWithPatterns(xml, [
      /<ows:ProviderSite[^>]*xlink:href="([^"]+)"/,
      /<ProviderSite[^>]*xlink:href="([^"]+)"/,
      /<ows:ProviderSite[^>]*href="([^"]+)"/
    ]);
    
    if (site) return site;

    // Strategie 2: ProviderSite ohne xlink
    site = this.extractWithPatterns(xml, [
      /<ows:ProviderSite[^>]*>(.*?)<\/ows:ProviderSite>/s,
      /<ProviderSite[^>]*>(.*?)<\/ProviderSite>/s
    ]);
    
    return site || null;
  }

  /**
   * ROBUSTE SOFT-LOGIC: Extrahiert Land-Informationen mit intelligenter Zuordnung
   */
  extractLandInfo(xml) {
    // Strategie 1: Aus Service-Titel und Abstract ableiten
    const title = this.extractServiceTitle(xml);
    const abstract = this.extractServiceAbstract(xml);
    const provider = this.extractProviderName(xml);
    
    const landInfo = this.detectLandFromText(title + ' ' + abstract + ' ' + provider);
    
    // Strategie 2: Aus Bounding Box ableiten (falls verfügbar)
    if (!landInfo.land_code) {
      const bbox = this.extractBoundingBox(xml);
      if (bbox) {
        const bboxLandInfo = this.detectLandFromBoundingBox(bbox);
        if (bboxLandInfo.land_code) {
          return bboxLandInfo;
        }
      }
    }
    
    return landInfo;
  }

  /**
   * Intelligente Land-Erkennung aus Text
   */
  detectLandFromText(text) {
    const lowerText = text.toLowerCase();
    
    // Deutschland
    if (lowerText.includes('deutschland') || lowerText.includes('germany') || 
        lowerText.includes('berlin') || lowerText.includes('brandenburg') ||
        lowerText.includes('nrw') || lowerText.includes('rheinland-pfalz') ||
        lowerText.includes('bayern') || lowerText.includes('baden-württemberg')) {
      return {
        land_code: 'DE',
        land_name: 'Deutschland',
        bundesland_oder_region: this.extractBundeslandFromText(text)
      };
    }
    
    // Österreich
    if (lowerText.includes('österreich') || lowerText.includes('austria') ||
        lowerText.includes('wien') || lowerText.includes('salzburg') ||
        lowerText.includes('tirol') || lowerText.includes('steiermark')) {
      return {
        land_code: 'AT',
        land_name: 'Österreich',
        bundesland_oder_region: this.extractBundeslandFromText(text)
      };
    }
    
    // Schweiz
    if (lowerText.includes('schweiz') || lowerText.includes('switzerland') ||
        lowerText.includes('zürich') || lowerText.includes('bern') ||
        lowerText.includes('genf') || lowerText.includes('basel')) {
      return {
        land_code: 'CH',
        land_name: 'Schweiz',
        bundesland_oder_region: this.extractBundeslandFromText(text)
      };
    }
    
    // Frankreich
    if (lowerText.includes('frankreich') || lowerText.includes('france') ||
        lowerText.includes('paris') || lowerText.includes('lyon') ||
        lowerText.includes('marseille') || lowerText.includes('toulouse')) {
      return {
        land_code: 'FR',
        land_name: 'Frankreich',
        bundesland_oder_region: this.extractBundeslandFromText(text)
      };
    }
    
    // Fallback
    return {
      land_code: 'DE',
      land_name: 'Deutschland',
      bundesland_oder_region: 'Unbekannt'
    };
  }

  /**
   * Extrahiert Bundesland/Region aus Text
   */
  extractBundeslandFromText(text) {
    const lowerText = text.toLowerCase();
    
    // Deutschland
    if (lowerText.includes('berlin')) return 'Berlin';
    if (lowerText.includes('brandenburg')) return 'Brandenburg';
    if (lowerText.includes('nrw') || lowerText.includes('nordrhein-westfalen')) return 'Nordrhein-Westfalen';
    if (lowerText.includes('rheinland-pfalz')) return 'Rheinland-Pfalz';
    if (lowerText.includes('bayern')) return 'Bayern';
    if (lowerText.includes('baden-württemberg')) return 'Baden-Württemberg';
    if (lowerText.includes('sachsen')) return 'Sachsen';
    if (lowerText.includes('thüringen')) return 'Thüringen';
    if (lowerText.includes('mecklenburg-vorpommern')) return 'Mecklenburg-Vorpommern';
    if (lowerText.includes('schleswig-holstein')) return 'Schleswig-Holstein';
    if (lowerText.includes('niedersachsen')) return 'Niedersachsen';
    if (lowerText.includes('hamburg')) return 'Hamburg';
    if (lowerText.includes('bremen')) return 'Bremen';
    if (lowerText.includes('saarland')) return 'Saarland';
    if (lowerText.includes('hessen')) return 'Hessen';
    
    // Österreich
    if (lowerText.includes('wien')) return 'Wien';
    if (lowerText.includes('salzburg')) return 'Salzburg';
    if (lowerText.includes('tirol')) return 'Tirol';
    if (lowerText.includes('steiermark')) return 'Steiermark';
    if (lowerText.includes('oberösterreich')) return 'Oberösterreich';
    if (lowerText.includes('niederösterreich')) return 'Niederösterreich';
    if (lowerText.includes('kärnten')) return 'Kärnten';
    if (lowerText.includes('vorarlberg')) return 'Vorarlberg';
    if (lowerText.includes('burgenland')) return 'Burgenland';
    
    // Schweiz
    if (lowerText.includes('zürich')) return 'Zürich';
    if (lowerText.includes('bern')) return 'Bern';
    if (lowerText.includes('genf')) return 'Genf';
    if (lowerText.includes('basel')) return 'Basel';
    if (lowerText.includes('luzern')) return 'Luzern';
    if (lowerText.includes('st. gallen')) return 'St. Gallen';
    
    // Frankreich
    if (lowerText.includes('paris')) return 'Île-de-France';
    if (lowerText.includes('lyon')) return 'Auvergne-Rhône-Alpes';
    if (lowerText.includes('marseille')) return 'Provence-Alpes-Côte d\'Azur';
    if (lowerText.includes('toulouse')) return 'Occitanie';
    
    return 'Unbekannt';
  }

  /**
   * Intelligente Land-Erkennung aus Bounding Box
   */
  detectLandFromBoundingBox(bbox) {
    if (!bbox || !bbox.lower || !bbox.upper) return null;
    
    const [minLon, minLat] = bbox.lower;
    const [maxLon, maxLat] = bbox.upper;
    
    // Deutschland (ungefähre BBox)
    if (minLon >= 5.0 && maxLon <= 16.0 && minLat >= 47.0 && maxLat <= 55.0) {
      return {
        land_code: 'DE',
        land_name: 'Deutschland',
        bundesland_oder_region: 'Aus BBox abgeleitet'
      };
    }
    
    // Österreich (ungefähre BBox)
    if (minLon >= 9.0 && maxLon <= 18.0 && minLat >= 46.0 && maxLat <= 49.0) {
      return {
        land_code: 'AT',
        land_name: 'Österreich',
        bundesland_oder_region: 'Aus BBox abgeleitet'
      };
    }
    
    // Schweiz (ungefähre BBox)
    if (minLon >= 5.0 && maxLon <= 11.0 && minLat >= 45.0 && maxLat <= 48.0) {
      return {
        land_code: 'CH',
        land_name: 'Schweiz',
        bundesland_oder_region: 'Aus BBox abgeleitet'
      };
    }
    
    // Frankreich (ungefähre BBox)
    if (minLon >= -5.0 && maxLon <= 10.0 && minLat >= 41.0 && maxLat <= 51.0) {
      return {
        land_code: 'FR',
        land_name: 'Frankreich',
        bundesland_oder_region: 'Aus BBox abgeleitet'
      };
    }
    
    return null;
  }

  /**
   * Hilfsfunktion: Extrahiert mit mehreren Patterns
   */
  extractWithPatterns(xml, patterns) {
    for (const pattern of patterns) {
      const match = xml.match(pattern);
      if (match) {
        // Wenn das Pattern eine Gruppe hat, gib den ersten Match zurück
        if (match.length > 1) {
          return match[1].trim();
        }
        // Sonst den gesamten Match
        return match[0].trim();
      }
    }
    return null;
  }

  /**
   * Parst WFS-GetCapabilities XML und extrahiert Service-Metadaten
   */
  parseServiceMetadata(xml) {
    try {
      if (!this.xmlParser) {
        throw new Error('XML-Parser nicht initialisiert');
      }

      // Validiert das XML mit dem echten Parser
      this.xmlParser.parse(xml);
      
      // Land-Informationen extrahieren
      const landInfo = this.extractLandInfo(xml);
      
      // Service-Metadaten extrahieren
      const serviceMetadata = {
        serviceTitle: this.extractServiceTitle(xml),
        serviceAbstract: this.extractServiceAbstract(xml),
        wfsVersion: this.extractWFSVersion(xml),
        providerName: this.extractProviderName(xml),
        providerSite: this.extractProviderSite(xml),
        supportedCRS: this.extractSupportedCRS(xml),
        outputFormats: this.extractOutputFormats(xml),
        bboxWGS84: this.extractBoundingBox(xml),
        // NEUE FELDER für Datenbank
        land_code: landInfo.land_code,
        land_name: landInfo.land_name,
        bundesland_oder_region: landInfo.bundesland_oder_region
      };

      return {
        success: true,
        serviceMetadata,
        rawXml: xml
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        rawXml: xml
      };
    }
  }

  /**
   * Parst WFS-GetCapabilities XML und extrahiert Layer-Informationen
   */
  parseLayerMetadata(xml) {
    try {
      if (!this.xmlParser) {
        throw new Error('XML-Parser nicht initialisiert');
      }

      // Validiert das XML mit dem echten Parser
      this.xmlParser.parse(xml);
      
      // Layer-Metadaten extrahieren
      const layers = this.extractLayers(xml);
      
      return {
        success: true,
        layers,
        layerCount: layers.length,
        rawXml: xml
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        rawXml: xml
      };
    }
  }

  /**
   * Extrahiert unterstützte CRS aus XML
   */
  extractSupportedCRS(xml) {
    const crsMatches = xml.match(/<wfs:(?:DefaultCRS|SRS)>(.*?)<\/wfs:(?:DefaultCRS|SRS)>/g);
    if (!crsMatches) return [];
    
    return crsMatches.map(match => {
      const crsMatch = match.match(/>(.*?)</);
      return crsMatch ? crsMatch[1] : null;
    }).filter(Boolean);
  }

  /**
   * Extrahiert Output-Formate aus XML
   */
  extractOutputFormats(xml) {
    const formatMatches = xml.match(/<wfs:Format>(.*?)<\/wfs:Format>/g);
    if (!formatMatches) return [];
    
    return formatMatches.map(match => {
      const formatMatch = match.match(/>(.*?)</);
      return formatMatch ? formatMatch[1] : null;
    }).filter(Boolean);
  }

  /**
   * Extrahiert Bounding Box aus XML
   */
  extractBoundingBox(xml) {
    // WFS 2.0.0 Format
    const wfs20Match = xml.match(/<wfs:WGS84BoundingBox>.*?<ows:LowerCorner>(.*?)<\/ows:LowerCorner>.*?<ows:UpperCorner>(.*?)<\/ows:UpperCorner>/s);
    if (wfs20Match) {
      return {
        lower: wfs20Match[1].split(' ').map(Number),
        upper: wfs20Match[2].split(' ').map(Number),
        crs: 'EPSG:4326'
      };
    }

    // WFS 1.1.0 Format
    const wfs11Match = xml.match(/<wfs:LatLongBoundingBox[^>]*minx="([^"]+)"[^>]*miny="([^"]+)"[^>]*maxx="([^"]+)"[^>]*maxy="([^"]+)"/);
    if (wfs11Match) {
      return {
        lower: [parseFloat(wfs11Match[1]), parseFloat(wfs11Match[2])],
        upper: [parseFloat(wfs11Match[3]), parseFloat(wfs11Match[4])],
        crs: 'EPSG:4326'
      };
    }

    return null;
  }

  /**
   * Extrahiert Layer-Informationen aus XML
   */
  extractLayers(xml) {
    const layers = [];
    
    // WFS-Version erkennen
    const wfsVersion = this.extractWFSVersion(xml);
    const isWFS20 = wfsVersion === '2.0.0';
    
    // Layer extrahieren
    const featureTypeMatches = xml.match(/<wfs:FeatureType>(.*?)<\/wfs:FeatureType>/gs);
    if (featureTypeMatches) {
      featureTypeMatches.forEach(layerXml => {
        let layer;
        
        if (isWFS20) {
          // WFS 2.0.0 Layer
          layer = {
            name: this.extractLayerName(layerXml),
            title: this.extractLayerTitle(layerXml),
            abstract: this.extractLayerAbstract(layerXml),
            defaultCRS: this.extractLayerDefaultCRS(layerXml),
            otherCRS: this.extractLayerOtherCRS(layerXml),
            outputFormats: this.extractLayerOutputFormats(layerXml),
            bbox: this.extractLayerBoundingBox(layerXml)
          };
        } else {
          // WFS 1.1.0 Layer
          layer = {
            name: this.extractLayerName(layerXml),
            title: this.extractLayerTitle(layerXml),
            abstract: this.extractLayerAbstract(layerXml),
            defaultCRS: this.extractLayerSRS(layerXml),
            otherCRS: [],
            outputFormats: [],
            bbox: this.extractLayerLatLongBoundingBox(layerXml)
          };
        }
        
        if (layer.name) layers.push(layer);
      });
    }

    return layers;
  }

  /**
   * Extrahiert Layer-Name
   */
  extractLayerName(xml) {
    const nameMatch = xml.match(/<wfs:Name[^>]*>(.*?)<\/wfs:Name>/s);
    return nameMatch ? nameMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Titel
   */
  extractLayerTitle(xml) {
    const titleMatch = xml.match(/<wfs:Title[^>]*>(.*?)<\/wfs:Title>/s);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Abstract
   */
  extractLayerAbstract(xml) {
    const abstractMatch = xml.match(/<wfs:Abstract[^>]*>(.*?)<\/wfs:Abstract>/s);
    return abstractMatch ? abstractMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Default-CRS (WFS 2.0.0)
   */
  extractLayerDefaultCRS(xml) {
    const crsMatch = xml.match(/<wfs:DefaultCRS[^>]*>(.*?)<\/wfs:DefaultCRS>/s);
    return crsMatch ? crsMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-SRS (WFS 1.1.0)
   */
  extractLayerSRS(xml) {
    const srsMatch = xml.match(/<wfs:SRS[^>]*>(.*?)<\/wfs:SRS>/s);
    return srsMatch ? srsMatch[1].trim() : null;
  }

  /**
   * Extrahiert Layer-Other-CRS (WFS 2.0.0)
   */
  extractLayerOtherCRS(xml) {
    const crsMatches = xml.match(/<wfs:OtherCRS[^>]*>(.*?)<\/wfs:OtherCRS>/gs);
    if (!crsMatches) return [];
    
    return crsMatches.map(match => {
      const crsMatch = match.match(/>(.*?)</);
      return crsMatch ? crsMatch[1].trim() : null;
    }).filter(Boolean);
  }

  /**
   * Extrahiert Layer-Output-Formate
   */
  extractLayerOutputFormats(xml) {
    const formatMatches = xml.match(/<wfs:Format[^>]*>(.*?)<\/wfs:Format>/gs);
    if (!formatMatches) return [];
    
    return formatMatches.map(match => {
      const formatMatch = match.match(/>(.*?)</);
      return formatMatch ? formatMatch[1].trim() : null;
    }).filter(Boolean);
  }

  /**
   * Extrahiert Layer-Bounding-Box (WFS 2.0.0)
   */
  extractLayerBoundingBox(xml) {
    const bboxMatch = xml.match(/<wfs:WGS84BoundingBox>.*?<ows:LowerCorner>(.*?)<\/ows:LowerCorner>.*?<ows:UpperCorner>(.*?)<\/ows:UpperCorner>/s);
    if (bboxMatch) {
      return {
        lower: bboxMatch[1].split(' ').map(Number),
        upper: bboxMatch[2].split(' ').map(Number),
        crs: 'EPSG:4326'
      };
    }
    return null;
  }

  /**
   * Extrahiert Layer-LatLong-Bounding-Box (WFS 1.1.0)
   */
  extractLayerLatLongBoundingBox(xml) {
    const bboxMatch = xml.match(/<wfs:LatLongBoundingBox[^>]*minx="([^"]+)"[^>]*miny="([^"]+)"[^>]*maxx="([^"]+)"[^>]*maxy="([^"]+)"/);
    if (bboxMatch) {
      return {
        lower: [parseFloat(bboxMatch[1]), parseFloat(bboxMatch[2])],
        upper: [parseFloat(bboxMatch[3]), parseFloat(bboxMatch[4])],
        crs: 'EPSG:4326'
      };
    }
    return null;
  }
}

/**
 * Test-Suite für WFS-Parser
 */
class WFSParserTestSuite {
  constructor() {
    this.parser = new WFSCapabilitiesParser();
    this.testResults = [];
  }

  /**
   * Führt alle Tests aus
   */
  async runAllTests() {
    console.log('🧪 Starte WFS-GetCapabilities Parser Tests...\n');

    try {
      // Test 1: Parser-Initialisierung
      await this.testParserInitialization();

      // Test 2: WFS 2.0.0 Service-Metadaten
      await this.testWFS20ServiceMetadata();

      // Test 3: WFS 1.1.0 Service-Metadaten
      await this.testWFS11ServiceMetadata();

      // Test 4: WFS 2.0.0 Layer-Metadaten
      await this.testWFS20LayerMetadata();

      // Test 5: WFS 1.1.0 Layer-Metadaten
      await this.testWFS11LayerMetadata();

      // Test 6: Fehlerbehandlung
      await this.testErrorHandling();

      // Test 7: Supabase-Integration
      await this.testSupabaseIntegration();

      // Test-Ergebnisse ausgeben
      this.printTestResults();

    } catch (error) {
      console.error('❌ Fehler beim Ausführen der Tests:', error);
    }
  }

  /**
   * Test 1: Parser-Initialisierung
   */
  async testParserInitialization() {
    console.log('📋 Test 1: Parser-Initialisierung');
    
    try {
      const parser = new WFSCapabilitiesParser();
      
      if (parser.xmlParser) {
        this.addTestResult('Parser-Initialisierung', true, 'XML-Parser erfolgreich initialisiert');
      } else {
        this.addTestResult('Parser-Initialisierung', false, 'XML-Parser konnte nicht initialisiert werden');
      }
    } catch (error) {
      this.addTestResult('Parser-Initialisierung', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 2: WFS 2.0.0 Service-Metadaten
   */
  async testWFS20ServiceMetadata() {
    console.log('📋 Test 2: WFS 2.0.0 Service-Metadaten');
    
    try {
      const result = this.parser.parseServiceMetadata(TEST_GETCAPABILITIES_XML.wfs20);
      
      if (result.success) {
        const metadata = result.serviceMetadata;
        
        const checks = [
          metadata.serviceTitle === 'INSPIRE-WFS Flurstücke/Grundstücke ALKIS BB',
          metadata.serviceAbstract === 'INSPIRE-konformer WFS für Flurstücke und Grundstücke in Brandenburg',
          metadata.wfsVersion === '2.0.0',
          metadata.providerName === 'Land Brandenburg',
          metadata.providerSite === 'https://www.brandenburg.de',
          metadata.supportedCRS.length > 0,
          metadata.outputFormats.length > 0,
          metadata.bboxWGS84 !== null
        ];

        const allChecksPassed = checks.every(check => check === true);
        
        this.addTestResult(
          'WFS 2.0.0 Service-Metadaten', 
          allChecksPassed, 
          allChecksPassed ? 'Alle Service-Metadaten korrekt extrahiert' : 'Fehler bei der Extraktion von Service-Metadaten'
        );

        if (allChecksPassed) {
          console.log('   ✅ Service-Titel:', metadata.serviceTitle);
          console.log('   ✅ WFS-Version:', metadata.wfsVersion);
          console.log('   ✅ Provider:', metadata.providerName);
          console.log('   ✅ BBox:', JSON.stringify(metadata.bboxWGS84));
        } else {
          console.log('   ❌ Service-Titel:', metadata.serviceTitle);
          console.log('   ❌ Service-Abstract:', metadata.serviceAbstract);
          console.log('   ❌ WFS-Version:', metadata.wfsVersion);
          console.log('   ❌ Provider:', metadata.providerName);
          console.log('   ❌ Provider-Site:', metadata.providerSite);
        }
      } else {
        this.addTestResult('WFS 2.0.0 Service-Metadaten', false, `Fehler: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('WFS 2.0.0 Service-Metadaten', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 3: WFS 1.1.0 Service-Metadaten
   */
  async testWFS11ServiceMetadata() {
    console.log('📋 Test 3: WFS 1.1.0 Service-Metadaten');
    
    try {
      const result = this.parser.parseServiceMetadata(TEST_GETCAPABILITIES_XML.wfs11);
      
      if (result.success) {
        const metadata = result.serviceMetadata;
        
        const checks = [
          metadata.serviceTitle === 'ALKIS Berlin Flurstücke',
          metadata.serviceAbstract === 'ALKIS Flurstücksdaten für Berlin',
          metadata.wfsVersion === '1.1.0',
          metadata.providerName === 'Senatsverwaltung für Stadtentwicklung Berlin',
          metadata.providerSite === 'https://www.stadtentwicklung.berlin.de'
        ];

        const allChecksPassed = checks.every(check => check === true);
        
        this.addTestResult(
          'WFS 1.1.0 Service-Metadaten', 
          allChecksPassed, 
          allChecksPassed ? 'Alle Service-Metadaten korrekt extrahiert' : 'Fehler bei der Extraktion von Service-Metadaten'
        );

        if (allChecksPassed) {
          console.log('   ✅ Service-Titel:', metadata.serviceTitle);
          console.log('   ✅ WFS-Version:', metadata.wfsVersion);
          console.log('   ✅ Provider:', metadata.providerName);
        } else {
          console.log('   ❌ Service-Titel:', metadata.serviceTitle);
          console.log('   ❌ Service-Abstract:', metadata.serviceAbstract);
          console.log('   ❌ WFS-Version:', metadata.wfsVersion);
          console.log('   ❌ Provider:', metadata.providerName);
          console.log('   ❌ Provider-Site:', metadata.providerSite);
        }
      } else {
        this.addTestResult('WFS 1.1.0 Service-Metadaten', false, `Fehler: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('WFS 1.1.0 Service-Metadaten', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 4: WFS 2.0.0 Layer-Metadaten
   */
  async testWFS20LayerMetadata() {
    console.log('📋 Test 4: WFS 2.0.0 Layer-Metadaten');
    
    try {
      const result = this.parser.parseLayerMetadata(TEST_GETCAPABILITIES_XML.wfs20);
      
      if (result.success) {
        const layers = result.layers;
        
        if (layers.length > 0) {
          const layer = layers[0];
          
          const checks = [
            layer.name === 'cp:CadastralParcel',
            layer.title === 'Flurstücke/Grundstücke',
            layer.abstract === 'INSPIRE Cadastral Parcels',
            layer.defaultCRS === 'urn:ogc:def:crs:EPSG::25833',
            layer.otherCRS.length > 0,
            layer.outputFormats.length > 0,
            layer.bbox !== null
          ];

          const allChecksPassed = checks.every(check => check === true);
          
          this.addTestResult(
            'WFS 2.0.0 Layer-Metadaten', 
            allChecksPassed, 
            allChecksPassed ? `${layers.length} Layer korrekt extrahiert` : 'Fehler bei der Extraktion von Layer-Metadaten'
          );

          if (allChecksPassed) {
            console.log('   ✅ Layer-Name:', layer.name);
            console.log('   ✅ Layer-Titel:', layer.title);
            console.log('   ✅ Default-CRS:', layer.defaultCRS);
            console.log('   ✅ Output-Formate:', layer.outputFormats.length);
          }
        } else {
          this.addTestResult('WFS 2.0.0 Layer-Metadaten', false, 'Keine Layer gefunden');
        }
      } else {
        this.addTestResult('WFS 2.0.0 Layer-Metadaten', false, `Fehler: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('WFS 2.0.0 Layer-Metadaten', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 5: WFS 1.1.0 Layer-Metadaten
   */
  async testWFS11LayerMetadata() {
    console.log('📋 Test 5: WFS 1.1.0 Layer-Metadaten');
    
    try {
      const result = this.parser.parseLayerMetadata(TEST_GETCAPABILITIES_XML.wfs11);
      
      if (result.success) {
        const layers = result.layers;
        
        if (layers.length > 0) {
          const layer = layers[0];
          
          const checks = [
            layer.name === 'alkis:Flurstueck',
            layer.title === 'ALKIS Flurstücke',
            layer.abstract === 'Flurstücksdaten aus ALKIS',
            layer.defaultCRS === 'EPSG:25833',
            layer.bbox !== null
          ];

          const allChecksPassed = checks.every(check => check === true);
          
          this.addTestResult(
            'WFS 1.1.0 Layer-Metadaten', 
            allChecksPassed, 
            allChecksPassed ? `${layers.length} Layer korrekt extrahiert` : 'Fehler bei der Extraktion von Layer-Metadaten'
          );

          if (allChecksPassed) {
            console.log('   ✅ Layer-Name:', layer.name);
            console.log('   ✅ Layer-Titel:', layer.title);
            console.log('   ✅ SRS:', layer.defaultCRS);
          } else {
            console.log('   ❌ Layer-Name:', layer.name);
            console.log('   ❌ Layer-Titel:', layer.title);
            console.log('   ❌ Layer-Abstract:', layer.abstract);
            console.log('   ❌ SRS:', layer.defaultCRS);
            console.log('   ❌ BBox:', layer.bbox);
          }
        } else {
          this.addTestResult('WFS 1.1.0 Layer-Metadaten', false, 'Keine Layer gefunden');
        }
      } else {
        this.addTestResult('WFS 1.1.0 Layer-Metadaten', false, `Fehler: ${result.error}`);
      }
    } catch (error) {
      this.addTestResult('WFS 1.1.0 Layer-Metadaten', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Test 6: Fehlerbehandlung
   */
  async testErrorHandling() {
    console.log('📋 Test 6: Fehlerbehandlung');
    
    try {
      // Test mit ungültigem XML
      const result = this.parser.parseServiceMetadata(TEST_GETCAPABILITIES_XML.invalid);
      
      if (!result.success) {
        this.addTestResult('Fehlerbehandlung', true, 'Ungültiges XML korrekt abgefangen');
      } else {
        this.addTestResult('Fehlerbehandlung', false, 'Ungültiges XML wurde nicht abgefangen');
      }
    } catch (error) {
      this.addTestResult('Fehlerbehandlung', true, `Fehler korrekt abgefangen: ${error.message}`);
    }
  }

  /**
   * Test 7: Supabase-Integration
   */
  async testSupabaseIntegration() {
    console.log('📋 Test 7: Supabase-Integration');
    
    try {
      // Test: WFS-Streams aus Datenbank lesen
      const { data: streams, error: streamsError } = await supabase
        .from('wfs_streams')
        .select('*')
        .limit(5);

      if (streamsError) {
        this.addTestResult('Supabase-Integration', false, `Fehler beim Lesen der WFS-Streams: ${streamsError.message}`);
        return;
      }

      if (streams && streams.length > 0) {
        console.log(`   ✅ ${streams.length} WFS-Streams aus Datenbank gelesen`);
        
        // Test: WFS-Layers aus Datenbank lesen
        const { data: layers, error: layersError } = await supabase
          .from('wfs_layers')
          .select('*')
          .limit(5);

        if (layersError) {
          this.addTestResult('Supabase-Integration', false, `Fehler beim Lesen der WFS-Layers: ${layersError.message}`);
          return;
        }

        if (layers && layers.length > 0) {
          console.log(`   ✅ ${layers.length} WFS-Layers aus Datenbank gelesen`);
          this.addTestResult('Supabase-Integration', true, `Datenbank-Integration erfolgreich: ${streams.length} Streams, ${layers.length} Layers`);
        } else {
          this.addTestResult('Supabase-Integration', false, 'Keine WFS-Layers in der Datenbank gefunden');
        }
      } else {
        this.addTestResult('Supabase-Integration', false, 'Keine WFS-Streams in der Datenbank gefunden');
      }
    } catch (error) {
      this.addTestResult('Supabase-Integration', false, `Fehler: ${error.message}`);
    }
  }

  /**
   * Fügt ein Testergebnis hinzu
   */
  addTestResult(testName, success, message) {
    this.testResults.push({
      testName,
      success,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gibt alle Testergebnisse aus
   */
  printTestResults() {
    console.log('\n📊 Test-Ergebnisse:');
    console.log('='.repeat(60));
    
    let passedTests = 0;
    let totalTests = this.testResults.length;
    
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName}`);
      console.log(`   ${result.message}`);
      console.log(`   Zeit: ${result.timestamp}`);
      console.log('');
      
      if (result.success) passedTests++;
    });
    
    console.log('='.repeat(60));
    console.log(`📈 Gesamtergebnis: ${passedTests}/${totalTests} Tests erfolgreich`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Alle Tests erfolgreich!');
    } else {
      console.log('⚠️  Einige Tests fehlgeschlagen. Bitte überprüfen.');
    }
  }
}

// Test ausführen
if (require.main === module) {
  const testSuite = new WFSParserTestSuite();
  testSuite.runAllTests();
}

module.exports = {
  WFSCapabilitiesParser,
  WFSParserTestSuite,
  TEST_GETCAPABILITIES_XML
};
