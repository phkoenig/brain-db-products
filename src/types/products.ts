export interface Product {
  // Primary Key & Timestamps
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  
  // Source Information (Chrome Extension)
  source_type?: string;
  source_url?: string;
  screenshot_path?: string;
  thumbnail_path?: string;
  
  // PRODUKT-Spalte
  produkt_kategorie?: string[];
  produkt_hersteller?: string;
  produkt_name_modell?: string;
  produkt_produktlinie_serie?: string;
  produkt_code_id?: string;
  produkt_anwendungsbereich?: string;
  produkt_beschreibung?: string;
  produkt_hersteller_webseite?: string;
  produkt_hersteller_produkt_url?: string;
  
  // PARAMETER-Spalte
  parameter_masse?: string;
  parameter_farbe?: string;
  parameter_hauptmaterial?: string;
  parameter_oberflaeche?: string;
  parameter_gewicht_pro_einheit?: string;
  parameter_feuerwiderstand?: string;
  parameter_waermeleitfaehigkeit?: string;
  parameter_u_wert?: string;
  parameter_schalldaemmung?: string;
  parameter_wasserbestaendigkeit?: string;
  parameter_dampfdiffusion?: string;
  parameter_einbauart?: string;
  parameter_wartung?: string;
  parameter_umweltzertifikat?: string;
  
  // DOKUMENTE-Spalte
  dokumente_datenblatt?: string;
  dokumente_technisches_merkblatt?: string;
  dokumente_produktkatalog?: string;
  dokumente_weitere_dokumente?: string;
  dokumente_bim_cad_technische_zeichnungen?: string;
  
  // HÄNDLER-Spalte
  haendler_haendlername?: string;
  haendler_haendler_webseite?: string;
  haendler_haendler_produkt_url?: string;
  haendler_verfuegbarkeit?: string;
  haendler_einheit?: string;
  haendler_preis?: number;
  haendler_preis_pro_einheit?: number;
  
  // ERFAHRUNG-Spalte
  erfahrung_einsatz_in_projekt?: string;
  erfahrung_muster_bestellt?: string;
  erfahrung_muster_abgelegt?: string;
  erfahrung_bewertung?: string;
  erfahrung_bemerkungen_notizen?: string;
  
  // ERFASSUNG-Spalte
  erfassung_quell_url?: string;
  erfassung_erfassungsdatum?: string;
  erfassung_erfassung_fuer?: string;
  erfassung_extraktions_log?: string;
  
  // AI & Processing (behalten für Kompatibilität)
  ocr_text_raw?: string;
  parsed_fields?: any; // JSONB
  ai_confidence?: any; // JSONB
  manual_reviewed?: boolean;
  notes?: string;
  
  // Alternative Retailer (erweiterte Funktionalität)
  alternative_retailer_name?: string;
  alternative_retailer_url?: string;
  alternative_retailer_price?: number;
  alternative_retailer_unit?: string;
  alternative_retailer_price_per_unit?: number;
  alternative_retailer_availability?: string;
  alternative_retailer_ai_research_status?: string;
  alternative_retailer_ai_research_progress?: number;
}

// Form data für React-Formulare - alle Felder als string außer Arrays
export type ProductFormData = {
  [K in keyof Omit<Product, 
    'id' | 'created_at' | 'updated_at' | 'user_id' | 
    'parsed_fields' | 'ai_confidence' | 'manual_reviewed' |
    'haendler_preis' | 'haendler_preis_pro_einheit' |
    'alternative_retailer_price' | 'alternative_retailer_price_per_unit' | 'alternative_retailer_ai_research_progress'
  >]: K extends 'produkt_kategorie' ? string[] : string;
} & {
  // Numerische Felder als string für Formulare
  haendler_preis?: string;
  haendler_preis_pro_einheit?: string;
  alternative_retailer_price?: string;
  alternative_retailer_price_per_unit?: string;
  alternative_retailer_ai_research_progress?: string;
};