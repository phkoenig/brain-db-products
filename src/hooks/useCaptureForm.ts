import { useState, useCallback } from 'react';
import { ProductFormData } from '@/types/products';

// Initial empty form data mit neuen Präfix-Feldnamen
const initialFormData: ProductFormData = {
  // Source Information (Chrome Extension)
  source_url: '',
  
  // PRODUKT-Spalte
  produkt_kategorie: [],
  produkt_hersteller: '',
  produkt_name_modell: '',
  produkt_produktlinie_serie: '',
  produkt_code_id: '',
  produkt_anwendungsbereich: '',
  produkt_beschreibung: '',
  produkt_hersteller_webseite: '',
  produkt_hersteller_produkt_url: '',
  
  // PARAMETER-Spalte
  parameter_masse: '',
  parameter_farbe: '',
  parameter_hauptmaterial: '',
  parameter_oberflaeche: '',
  parameter_gewicht_pro_einheit: '',
  parameter_feuerwiderstand: '',
  parameter_waermeleitfaehigkeit: '',
  parameter_u_wert: '',
  parameter_schalldaemmung: '',
  parameter_wasserbestaendigkeit: '',
  parameter_dampfdiffusion: '',
  parameter_einbauart: '',
  parameter_wartung: '',
  parameter_umweltzertifikat: '',
  
  // DOKUMENTE-Spalte
  dokumente_datenblatt: '',
  dokumente_technisches_merkblatt: '',
  dokumente_produktkatalog: '',
  dokumente_weitere_dokumente: '',
  dokumente_bim_cad_technische_zeichnungen: '',
  
  // HÄNDLER-Spalte
  haendler_haendlername: '',
  haendler_haendler_webseite: '',
  haendler_haendler_produkt_url: '',
  haendler_verfuegbarkeit: '',
  haendler_einheit: '',
  haendler_preis: '',
  haendler_preis_pro_einheit: '',
  
  // ERFAHRUNG-Spalte
  erfahrung_einsatz_in_projekt: '',
  erfahrung_muster_bestellt: '',
  erfahrung_muster_abgelegt: '',
  erfahrung_bewertung: '',
  erfahrung_bemerkungen_notizen: '',
  
  // ERFASSUNG-Spalte
  erfassung_quell_url: '',
  erfassung_erfassungsdatum: '',
  erfassung_erfassung_fuer: 'Deutschland',
  erfassung_extraktions_log: '',
  
  // AI & Processing (behalten für Kompatibilität)
  ocr_text_raw: '',
  notes: '',
  
  // Alternative Retailer (erweiterte Funktionalität)
  alternative_retailer_name: '',
  alternative_retailer_url: '',
  alternative_retailer_price: '',
  alternative_retailer_unit: '',
  alternative_retailer_price_per_unit: '',
  alternative_retailer_availability: '',
  alternative_retailer_ai_research_status: 'pending',
  alternative_retailer_ai_research_progress: '',
};

export function useCaptureForm() {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update a single field
  const updateField = useCallback((field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<ProductFormData>) => {
    console.log("useCaptureForm: updateFields called with:", updates);
    setFormData(prev => {
      const newData = {
        ...prev,
        ...updates
      };
      console.log("useCaptureForm: Previous form data:", prev);
      console.log("useCaptureForm: New form data:", newData);
      return newData;
    });
    setIsDirty(true);
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setIsDirty(false);
  }, []);

  // Load data from capture (when capture_id is provided)
  const loadFromCapture = useCallback((captureData: { url: string; screenshot_url: string; thumbnail_url: string; created_at: string }) => {
    updateFields({
      erfassung_quell_url: captureData.url,
      source_url: captureData.url,
      erfassung_erfassungsdatum: new Date(captureData.created_at).toLocaleString('de-DE'),
    });
  }, [updateFields]);

  // Validate form data
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!formData.produkt_hersteller?.trim()) {
      errors.push('Hersteller ist erforderlich');
    }
    
    if (!formData.produkt_name_modell?.trim()) {
      errors.push('Produktname ist erforderlich');
    }
    
    if (!formData.produkt_kategorie || formData.produkt_kategorie.length === 0) {
      errors.push('Kategorie ist erforderlich');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Convert form data to Product format for database
  const toProductData = () => {
    return {
      // Source Information (Chrome Extension)
      source_url: formData.source_url || null,
      
      // PRODUKT-Spalte
      produkt_kategorie: formData.produkt_kategorie && formData.produkt_kategorie.length > 0 ? formData.produkt_kategorie : null,
      produkt_hersteller: formData.produkt_hersteller || null,
      produkt_name_modell: formData.produkt_name_modell || null,
      produkt_produktlinie_serie: formData.produkt_produktlinie_serie || null,
      produkt_code_id: formData.produkt_code_id || null,
      produkt_anwendungsbereich: formData.produkt_anwendungsbereich || null,
      produkt_beschreibung: formData.produkt_beschreibung || null,
      produkt_hersteller_webseite: formData.produkt_hersteller_webseite || null,
      produkt_hersteller_produkt_url: formData.produkt_hersteller_produkt_url || null,
      
      // PARAMETER-Spalte
      parameter_masse: formData.parameter_masse || null,
      parameter_farbe: formData.parameter_farbe || null,
      parameter_hauptmaterial: formData.parameter_hauptmaterial || null,
      parameter_oberflaeche: formData.parameter_oberflaeche || null,
      parameter_gewicht_pro_einheit: formData.parameter_gewicht_pro_einheit || null,
      parameter_feuerwiderstand: formData.parameter_feuerwiderstand || null,
      parameter_waermeleitfaehigkeit: formData.parameter_waermeleitfaehigkeit || null,
      parameter_u_wert: formData.parameter_u_wert || null,
      parameter_schalldaemmung: formData.parameter_schalldaemmung || null,
      parameter_wasserbestaendigkeit: formData.parameter_wasserbestaendigkeit || null,
      parameter_dampfdiffusion: formData.parameter_dampfdiffusion || null,
      parameter_einbauart: formData.parameter_einbauart || null,
      parameter_wartung: formData.parameter_wartung || null,
      parameter_umweltzertifikat: formData.parameter_umweltzertifikat || null,
      
      // DOKUMENTE-Spalte
      dokumente_datenblatt: formData.dokumente_datenblatt || null,
      dokumente_technisches_merkblatt: formData.dokumente_technisches_merkblatt || null,
      dokumente_produktkatalog: formData.dokumente_produktkatalog || null,
      dokumente_weitere_dokumente: formData.dokumente_weitere_dokumente || null,
      dokumente_bim_cad_technische_zeichnungen: formData.dokumente_bim_cad_technische_zeichnungen || null,
      
      // HÄNDLER-Spalte
      haendler_haendlername: formData.haendler_haendlername || null,
      haendler_haendler_webseite: formData.haendler_haendler_webseite || null,
      haendler_haendler_produkt_url: formData.haendler_haendler_produkt_url || null,
      haendler_verfuegbarkeit: formData.haendler_verfuegbarkeit || null,
      haendler_einheit: formData.haendler_einheit || null,
      haendler_preis: formData.haendler_preis ? parseFloat(formData.haendler_preis) : null,
      haendler_preis_pro_einheit: formData.haendler_preis_pro_einheit ? parseFloat(formData.haendler_preis_pro_einheit) : null,
      
      // ERFAHRUNG-Spalte
      erfahrung_einsatz_in_projekt: formData.erfahrung_einsatz_in_projekt || null,
      erfahrung_muster_bestellt: formData.erfahrung_muster_bestellt || null,
      erfahrung_muster_abgelegt: formData.erfahrung_muster_abgelegt || null,
      erfahrung_bewertung: formData.erfahrung_bewertung || null,
      erfahrung_bemerkungen_notizen: formData.erfahrung_bemerkungen_notizen || null,
      
      // ERFASSUNG-Spalte
      erfassung_quell_url: formData.erfassung_quell_url || null,
      erfassung_erfassungsdatum: formData.erfassung_erfassungsdatum || null,
      erfassung_erfassung_fuer: formData.erfassung_erfassung_fuer || 'Deutschland',
      erfassung_extraktions_log: formData.erfassung_extraktions_log || null,
      
      // AI & Processing (behalten für Kompatibilität)
      ocr_text_raw: formData.ocr_text_raw || null,
      notes: formData.notes || null,
      
      // Alternative Retailer (erweiterte Funktionalität)
      alternative_retailer_name: formData.alternative_retailer_name || null,
      alternative_retailer_url: formData.alternative_retailer_url || null,
      alternative_retailer_price: formData.alternative_retailer_price ? parseFloat(formData.alternative_retailer_price) : null,
      alternative_retailer_unit: formData.alternative_retailer_unit || null,
      alternative_retailer_price_per_unit: formData.alternative_retailer_price_per_unit ? parseFloat(formData.alternative_retailer_price_per_unit) : null,
      alternative_retailer_availability: formData.alternative_retailer_availability || null,
      alternative_retailer_ai_research_status: formData.alternative_retailer_ai_research_status || 'pending',
      alternative_retailer_ai_research_progress: formData.alternative_retailer_ai_research_progress ? parseInt(formData.alternative_retailer_ai_research_progress) : 0,
      
      // Source information (Chrome Extension)
      source_type: 'chrome_extension',
    };
  };

  return {
    formData,
    isDirty,
    isSaving,
    updateField,
    updateFields,
    resetForm,
    loadFromCapture,
    validateForm,
    toProductData,
    setIsSaving,
  };
}