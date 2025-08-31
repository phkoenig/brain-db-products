// Supabase Client für WFS-Layer Daten
// Verwendet die MCP-Integration für den Datenbankzugriff

export interface WFSLayer {
  id: string;
  name: string;
  title: string;
  abstract?: string;
  bundesland_oder_region?: string;
  feature_typ?: string;
  inspire_konform?: boolean;
  schluesselwoerter?: string[];
  inspire_thema_codes?: string[];
  geometrietyp?: string;
  wfs_stream?: {
    name: string;
    url: string;
  };
}

export interface WFSStream {
  id: string;
  url: string;
  bundesland_oder_region?: string;
  anbieter?: string;
  service_title?: string;
  ist_aktiv: boolean;
  inspire_konform: boolean;
}

// Funktion zum Laden aller WFS-Layer mit Stream-Informationen
export async function fetchWFSLayers(): Promise<WFSLayer[]> {
  try {
    // TODO: MCP Supabase Integration implementieren
    // Für jetzt: Mock-Daten zurückgeben
    
    const mockData: WFSLayer[] = [
      {
        id: "1",
        name: "gewaesser:Standgewaesser_Arbeitsstand",
        title: "Standgewaesser_Arbeitsstand",
        bundesland_oder_region: "Bayern",
        feature_typ: "Gewässernetz",
        inspire_konform: false,
        schluesselwoerter: ["Gewässer", "Standgewässer"],
        inspire_thema_codes: [],
        geometrietyp: "Polygon"
      },
      {
        id: "2",
        name: "gewaesser:Fliessgewaessernetz_Arbeitsstand",
        title: "Fliessgewaessernetz_Arbeitsstand",
        bundesland_oder_region: "Niedersachsen",
        feature_typ: "Gewässernetz",
        inspire_konform: false,
        schluesselwoerter: ["Gewässer", "Fließgewässer"],
        inspire_thema_codes: [],
        geometrietyp: "Line"
      },
      {
        id: "3",
        name: "app:bezirksstrassen",
        title: "app:bezirksstrassen",
        bundesland_oder_region: "Baden-Württemberg",
        feature_typ: "Verwaltungsgrenzen",
        inspire_konform: false,
        schluesselwoerter: ["Straßen", "Verwaltung"],
        inspire_thema_codes: [],
        geometrietyp: "Line"
      },
      {
        id: "4",
        name: "LAGB_Bodendaten_B1_OpenData:Nutzung_zum_Zeitpunkt_der_Bodenschätzung",
        title: "Nutzung_zum_Zeitpunkt_der_Bodenschätzung",
        bundesland_oder_region: "Brandenburg",
        feature_typ: "Bodennutzung",
        inspire_konform: false,
        schluesselwoerter: ["Nutzung", "Boden"],
        inspire_thema_codes: [],
        geometrietyp: "Point"
      },
      {
        id: "5",
        name: "LAGB_Bodendaten_B1_OpenData:Bodenart_des_Oberbodens__VBK50_",
        title: "Bodenart_des_Oberbodens__VBK50_",
        bundesland_oder_region: "Hessen",
        feature_typ: "Bodennutzung",
        inspire_konform: false,
        schluesselwoerter: ["Boden", "Oberboden"],
        inspire_thema_codes: [],
        geometrietyp: "Polygon"
      }
    ];

    return mockData;
  } catch (error) {
    console.error('Fehler beim Laden der WFS-Layer:', error);
    throw new Error('Fehler beim Laden der WFS-Layer');
  }
}

// Funktion zum Laden der Bundesländer
export async function fetchBundeslaender(): Promise<string[]> {
  try {
    // TODO: MCP Supabase Integration implementieren
    return [
      "Baden-Württemberg",
      "Bayern", 
      "Brandenburg",
      "Bremen",
      "Hamburg",
      "Hessen",
      "Mecklenburg-Vorpommern",
      "Niedersachsen",
      "Nordrhein-Westfalen",
      "Rheinland-Pfalz",
      "Saarland",
      "Sachsen",
      "Sachsen-Anhalt",
      "Schleswig-Holstein",
      "Thüringen"
    ];
  } catch (error) {
    console.error('Fehler beim Laden der Bundesländer:', error);
    throw new Error('Fehler beim Laden der Bundesländer');
  }
}

// Funktion zum Laden der Feature-Typen
export async function fetchFeatureTypen(): Promise<string[]> {
  try {
    // TODO: MCP Supabase Integration implementieren
    return [
      "Flurstücke",
      "Gebäudeumrisse", 
      "Straßennetz",
      "Gewässernetz",
      "Adressen",
      "Verwaltungsgrenzen",
      "Bodennutzung",
      "Schutzgebiete"
    ];
  } catch (error) {
    console.error('Fehler beim Laden der Feature-Typen:', error);
    throw new Error('Fehler beim Laden der Feature-Typen');
  }
}
