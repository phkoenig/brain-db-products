"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Progress } from "@/ui/components/Progress";
import { Select } from "@/ui/components/Select";
import { FeatherSearch } from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { FeatherEdit3 } from "@subframe/core";
import { FeatherPenLine } from "@subframe/core";
import { TextArea } from "@/ui/components/TextArea";
import { Table } from "@/ui/components/Table";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { Button } from "@/ui/components/Button";
import { FeatherFactory } from "@subframe/core";
import { FeatherShoppingCart } from "@subframe/core";
import { FeatherGlobe } from "@subframe/core";
import { useExtraction } from "@/hooks/useExtraction";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { useCaptures } from "@/hooks/useCaptures";
import { SPALTEN_FELDER } from "@/lib/extraction/constants";
import { MultiSelectWithSearch } from "@/ui/components/MultiSelectWithSearch";
import { Capture } from "@/types/captures";

function Extractor() {
  const [spaltenProgress, setSpaltenProgress] = useState({
    produkt: 0,
    parameter: 0,
    dokumente: 0,
    haendler: 0,
    erfahrung: 0,
    erfassung: 0,
  });

  const [formData, setFormData] = useState({
    // PRODUKT-Spalte
    produkt_kategorie: [] as string[],
    produkt_hersteller: "",
    produkt_name_modell: "",
    produkt_produktlinie_serie: "",
    produkt_code_id: "",
    produkt_anwendungsbereich: "",
    produkt_beschreibung: "",
    produkt_hersteller_webseite: "",
    produkt_hersteller_produkt_url: "",
    // PARAMETER-Spalte
    parameter_masse: "",
    parameter_farbe: "",
    parameter_hauptmaterial: "",
    parameter_oberflaeche: "",
    parameter_gewicht_pro_einheit: "",
    parameter_feuerwiderstand: "",
    parameter_waermeleitfaehigkeit: "",
    parameter_u_wert: "",
    parameter_schalldaemmung: "",
    parameter_wasserbestaendigkeit: "",
    parameter_dampfdiffusion: "",
    parameter_einbauart: "",
    parameter_wartung: "",
    parameter_umweltzertifikat: "",
    // DOKUMENTE-Spalte
    dokumente_datenblatt: "",
    dokumente_technisches_merkblatt: "",
    dokumente_produktkatalog: "",
    dokumente_weitere_dokumente: "",
    dokumente_bim_cad_technische_zeichnungen: "",
    // HÄNDLER-Spalte
    haendler_haendlername: "",
    haendler_haendler_webseite: "",
    haendler_haendler_produkt_url: "",
    haendler_verfuegbarkeit: "",
    haendler_einheit: "",
    haendler_preis: "",
    haendler_preis_pro_einheit: "",
    haendler_weitere_haendler_und_preise: [] as { name: string; website: string; productUrl: string; price: string; unit: string }[],
    // ERFAHRUNG-Spalte
    erfahrung_einsatz_in_projekt: "",
    erfahrung_muster_bestellt: "",
    erfahrung_muster_abgelegt: "",
    erfahrung_bewertung: "",
    erfahrung_bemerkungen_notizen: "",
    // ERFASSUNG-Spalte
    erfassung_quell_url: "",
    erfassung_erfassungsdatum: "",
    erfassung_erfassung_fuer: "Deutschland",
    erfassung_extraktions_log: "",
  });

  const { categories, loading: categoriesLoading, getGroupedCategories } = useMaterialCategories();
  const { loadCaptureById } = useCaptures();
  const [currentUrl, setCurrentUrl] = useState("");
  const [extractionLog, setExtractionLog] = useState("");
  const [currentCapture, setCurrentCapture] = useState<Capture | null>(null);
  const [captureLoading, setCaptureLoading] = useState(false);

  // Transform categories for MultiSelectWithSearch
  const multiSelectOptions = useMemo(() => {
    return categories.map(category => ({
      id: category.id,
      label: category.label,
      group: category.main_category
    }));
  }, [categories]);

  // Helper function to update form field and recalculate progress
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      updateAllProgress(newData);
      return newData;
    });
  };

  // Hilfsfunktion um URLs zu öffnen
  const openUrl = (url: string) => {
    if (url) {
      // Prüfen ob URL bereits ein Protokoll hat
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }
      window.open(fullUrl, '_blank');
    }
  };

  const updateProgress = (fields: string[], data: any) => {
    const filledFields = fields.filter((field) => !!data[field]);
    return (filledFields.length / fields.length) * 100;
  };
  
  const updateAllProgress = (data: any) => {
    setSpaltenProgress({
      produkt: updateProgress(SPALTEN_FELDER.produkt, data),
      parameter: updateProgress(SPALTEN_FELDER.parameter, data),
      dokumente: updateProgress(SPALTEN_FELDER.dokumente, data),
      haendler: updateProgress(SPALTEN_FELDER.haendler, data),
      erfahrung: updateProgress(SPALTEN_FELDER.erfahrung, data),
      erfassung: updateProgress(SPALTEN_FELDER.erfassung, data),
    });
  };
  
  const startSpaltenExtraction = useCallback(async (spalte: string, url: string) => {
    const felder = SPALTEN_FELDER[spalte];
    if (!felder) return null;

    setExtractionLog((prev) => prev + `\n=== STARTE ${spalte.toUpperCase()}-ANALYSE ===`);
    
    try {
      const response = await fetch("/api/extraction/spalten-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          spalte,
          felder,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Spalten-Analyse ${spalte} Antwort:`, result);
        
        // Zeige den generierten Prompt im Log an
        if (result.generatedPrompt) {
          const promptPreview = result.generatedPrompt.length > 800 
            ? result.generatedPrompt.substring(0, 800) + '\n\n[... Prompt gekürzt - Vollständiger Prompt in Browser-Console ...]'
            : result.generatedPrompt;
          
          setExtractionLog((prev) => prev + `\n\n📝 GENERIERTER ${spalte.toUpperCase()}-PROMPT:\n${'='.repeat(60)}\n${promptPreview}\n${'='.repeat(60)}\n`);
          console.log(`📝 Vollständiger ${spalte.toUpperCase()}-Prompt:`, result.generatedPrompt);
        }
        
        // Die API gibt { success: true, data: {...} } zurück
        const data = result.data || result;
        
        const updates = {};
        Object.entries(data).forEach(([field, fieldData]) => {
          // fieldData kann ein Objekt mit { value, confidence, reasoning } sein
          // oder direkt ein Wert
          if (fieldData) {
            let value = '';
            if (typeof fieldData === 'object' && fieldData.value !== undefined) {
              value = fieldData.value;
            } else if (typeof fieldData === 'string') {
              value = fieldData;
            }
            
            // Nur nicht-leere Werte setzen
            if (value !== null && value !== undefined && value !== '') {
              // Spezielle Behandlung für verschiedene Datentypen
              if (field === 'produkt_kategorie') {
                // Kategorie-Arrays behandeln
                let categoryValues = [];
                if (Array.isArray(value)) {
                  categoryValues = value.filter(v => v && v.trim && v.trim());
                } else if (typeof value === 'string') {
                  try {
                    const parsed = JSON.parse(value);
                    categoryValues = Array.isArray(parsed) ? parsed : [value.trim()];
                  } catch {
                    categoryValues = [value.trim()];
                  }
                }
                
                // Backup: Labels zu IDs mappen falls AI Labels zurückgegeben hat
                const mappedCategories = categoryValues.map(cat => {
                  const trimmedCat = cat.trim();
                  // Prüfe ob bereits eine ID vorliegt (Format: XX.XX)
                  if (/^[A-Z]{2}\.[A-Z]{2}$/.test(trimmedCat)) {
                    return trimmedCat; // Bereits eine ID
                  }
                  // Suche nach Label in den verfügbaren Kategorien
                  const foundCategory = categories.find(c => 
                    c.label.toLowerCase() === trimmedCat.toLowerCase()
                  );
                  if (foundCategory) {
                    console.log(`📝 Kategorie-Mapping: "${trimmedCat}" → "${foundCategory.id}"`);
                    return foundCategory.id;
                  }
                  console.warn(`⚠️ Unbekannte Kategorie: "${trimmedCat}"`);
                  return trimmedCat; // Fallback: Original-Wert beibehalten
                });
                
                updates[field] = mappedCategories.filter(c => c);
              } else if (Array.isArray(value)) {
                // Andere Arrays
                updates[field] = value.filter(v => v !== null && v !== undefined && v !== '');
              } else if (typeof value === 'string' && value.trim()) {
                // String-Werte
                updates[field] = value.trim();
              } else if (typeof value === 'number') {
                // Numerische Werte
                updates[field] = value;
              } else if (typeof value === 'boolean') {
                // Boolean-Werte
                updates[field] = value;
              }
              
              // Nur loggen wenn tatsächlich ein Wert gesetzt wurde
              if (updates[field] !== undefined) {
                console.log(`Setze ${field} = "${JSON.stringify(updates[field])}"`);
              }
            }
          }
        });
        
        console.log('Updates für Formular:', updates);
        
        setFormData((prev) => {
            const newData = { ...prev, ...updates };
            updateAllProgress(newData);
            return newData;
        });
        
        setExtractionLog((prev) => prev + `\n🎯 KI-ANTWORT erhalten - ${Object.keys(updates).length} Felder extrahiert`);
        setExtractionLog((prev) => prev + `\n✅ ${spalte.toUpperCase()}-Analyse abgeschlossen\n`);
        
        // Gib die extrahierten Daten zurück
        return { data: updates };
      }
    } catch (error) {
      setExtractionLog((prev) => prev + `\n❌ Fehler bei ${spalte}-Analyse: ${error.message}`);
      return null;
    }
  }, []);

  const handleManufacturerClick = useCallback(async () => {
    if (!currentUrl) return;
    
    // Sofort URL-Felder setzen BEVOR KI-Analyse startet
    handleFormChange('erfassung_quell_url', currentUrl);
    try {
      handleFormChange('produkt_hersteller_webseite', new URL(currentUrl).origin);
    } catch (e) {
      handleFormChange('produkt_hersteller_webseite', currentUrl);
    }
    handleFormChange('produkt_hersteller_produkt_url', currentUrl);
    
    setExtractionLog("=== STARTE HERSTELLER-ANALYSE ===\n");
    setExtractionLog((prev) => prev + `✅ URLs sofort gesetzt:\n`);
    setExtractionLog((prev) => prev + `  • Quell-URL: ${currentUrl}\n`);
    try {
      setExtractionLog((prev) => prev + `  • Hersteller-Webseite: ${new URL(currentUrl).origin}\n`);
    } catch (e) {
      setExtractionLog((prev) => prev + `  • Hersteller-Webseite: ${currentUrl}\n`);
    }
    setExtractionLog((prev) => prev + `  • Hersteller-Produkt-URL: ${currentUrl}\n\n`);
    
    // STUFE 1: Genaue Produkt-Identifikation auf Basis der URL
    setExtractionLog((prev) => prev + "🚀 STUFE 1: PRODUKT-IDENTIFIKATION (produkt, parameter)...\n");
    
    const stage1Promises = [
      startSpaltenExtraction("produkt", currentUrl),
      startSpaltenExtraction("parameter", currentUrl)
    ];
    
    const stage1Results = await Promise.all(stage1Promises);
    
    // Extrahiere Produktdaten direkt aus den KI-Ergebnissen
    let manufacturer = "";
    let productName = "";
    let productCode = "";
    
    // Debug: Logge die kompletten stage1Results
    console.log('🔍 DEBUG: stage1Results =', stage1Results);
    
    // Durchsuche die Ergebnisse nach Produktdaten
    stage1Results.forEach(result => {
      console.log('🔍 DEBUG: Processing result =', result);
      if (result && result.data) {
        console.log('🔍 DEBUG: result.data =', result.data);
        Object.entries(result.data).forEach(([field, value]) => {
          console.log(`🔍 DEBUG: field="${field}", value="${value}"`);
          if (value) {
            if (field === 'produkt_hersteller' && value) manufacturer = value;
            if (field === 'produkt_name_modell' && value) productName = value;
            if (field === 'produkt_code_id' && value) productCode = value;
          }
        });
      }
    });
    
    // STUFE 2: Nachgelagerte Suche nach Dokumenten und Händlern (mit Web-Suche)
    setExtractionLog((prev) => prev + "\n🔍 STUFE 2: DOKUMENTE & HÄNDLER-SUCHE (mit Web-Suche)...\n");
    
    // Direkt erweiterte Suchen starten (ohne setTimeout)
    try {
      // Debug: Logge die Werte
      setExtractionLog((prev) => prev + `🔍 DEBUG: manufacturer="${manufacturer}", productName="${productName}", productCode="${productCode}"\n`);
      
      if (manufacturer && productName) {
        setExtractionLog((prev) => prev + `📋 Kontext für erweiterte Suche: ${manufacturer} - ${productName}\n`);
        
        // PHASE 2A: Erweiterte Dokumente-Suche mit Web-Suche
        setExtractionLog((prev) => prev + "\n📄 PHASE 2A: DOKUMENTE-SUCHE (mit Web-Suche)...\n");
        try {
          const documentsResponse = await fetch("/api/extraction/enhanced-documents-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: currentUrl,
              manufacturer,
              productName,
              productCode
            }),
          });
          
          if (documentsResponse.ok) {
            const documentsResult = await documentsResponse.json();
            console.log('Enhanced Documents Search Result:', documentsResult);
            
            // Verarbeite die Ergebnisse
            if (documentsResult.data) {
              const updates = {};
              Object.entries(documentsResult.data).forEach(([field, fieldData]) => {
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const value = fieldData.value;
                  if (value && value !== '') {
                    updates[field] = value;
                    console.log(`Setze ${field} = "${value}"`);
                  }
                }
              });
              
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData);
                return newData;
              });
              
              setExtractionLog((prev) => prev + `🎯 Erweiterte Dokumente-Suche: ${Object.keys(updates).length} Dokumente gefunden\n`);
            }
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche\n`);
          }
        } catch (error) {
          console.error('Enhanced Documents Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche: ${error.message}\n`);
        }
        
        // PHASE 2B: Erweiterte Händler-Suche mit Web-Suche
        setExtractionLog((prev) => prev + "\n🏪 PHASE 2B: HÄNDLER-SUCHE (mit Web-Suche) - NEUE ERWEITERTE API...\n");
        try {
          const retailersResponse = await fetch("/api/extraction/enhanced-retailers-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: currentUrl,
              manufacturer,
              productName,
              productCode,
              buttonType: 'haendler' // Da wir in handleResellerClick sind
            }),
          });
          
          if (retailersResponse.ok) {
            const retailersResult = await retailersResponse.json();
            console.log('Enhanced Retailers Search Result:', retailersResult);
            
            // Logge die Rohdaten für Debugging
            setExtractionLog((prev) => prev + `🔍 ROHDATEN von erweiterter Händler-Suche:\n`);
            setExtractionLog((prev) => prev + `   ${JSON.stringify(retailersResult.data, null, 2)}\n\n`);
            
            // Verarbeite die Ergebnisse
            if (retailersResult.data) {
              const updates = {};
              
              // DEBUG: Logge jeden Schritt der Verarbeitung
              setExtractionLog((prev) => prev + `🔍 DEBUG: Verarbeite ${Object.keys(retailersResult.data).length} Felder\n`);
              
              Object.entries(retailersResult.data).forEach(([field, fieldData]) => {
                setExtractionLog((prev) => prev + `🔍 DEBUG: Verarbeite Feld "${field}" = ${JSON.stringify(fieldData)}\n`);
                
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const value = fieldData.value;
                  if (value && value !== '') {
                    updates[field] = value;
                    setExtractionLog((prev) => prev + `✅ Setze ${field} = "${value}"\n`);
                  }
                }
              });
              
              setExtractionLog((prev) => prev + `🔍 DEBUG: Finale Updates = ${JSON.stringify(updates, null, 2)}\n`);
              
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData);
                return newData;
              });
              setExtractionLog((prev) => prev + `🎯 Erweiterte Händler-Suche: ${Object.keys(updates).length} Felder aktualisiert\n`);
            }
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche\n`);
          }
        } catch (error) {
          console.error('Enhanced Retailers Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche: ${error.message}\n`);
        }
        
      } else {
        // Fallback: Normale Suchen ohne Kontext
        setExtractionLog((prev) => prev + "⚠️ Kein Produkt-Kontext verfügbar - verwende ALTE STANDARD-SUCHE\n");
        await startSpaltenExtraction("dokumente", currentUrl);
        await startSpaltenExtraction("haendler", currentUrl);
      }
    } catch (error) {
      console.error('Enhanced Search Error:', error);
      setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Suche: ${error.message}\n`);
    }
    
    setExtractionLog((prev) => prev + "\n=== HÄNDLER-ANALYSE ABGESCHLOSSEN ===");
  }, [currentUrl, startSpaltenExtraction]);

  const handleResellerClick = useCallback(async () => {
    if (!currentUrl) return;
    
    // Sofort URL-Felder setzen BEVOR KI-Analyse startet
    handleFormChange('erfassung_quell_url', currentUrl);
    try {
      handleFormChange('haendler_haendler_webseite', new URL(currentUrl).origin);
    } catch (e) {
      handleFormChange('haendler_haendler_webseite', currentUrl);
    }
    handleFormChange('haendler_haendler_produkt_url', currentUrl);
    
    setExtractionLog("=== STARTE HÄNDLER-ANALYSE ===\n");
    setExtractionLog((prev) => prev + `✅ URLs sofort gesetzt:\n`);
    setExtractionLog((prev) => prev + `  • Quell-URL: ${currentUrl}\n`);
    try {
      setExtractionLog((prev) => prev + `  • Händler-Webseite: ${new URL(currentUrl).origin}\n`);
    } catch (e) {
      setExtractionLog((prev) => prev + `  • Händler-Webseite: ${currentUrl}\n`);
    }
    setExtractionLog((prev) => prev + `  • Händler-Produkt-URL: ${currentUrl}\n\n`);
    
    // STUFE 1: Genaue Produkt-Identifikation auf Basis der URL
    setExtractionLog((prev) => prev + "🚀 STUFE 1: PRODUKT-IDENTIFIKATION (produkt, parameter)...\n");
    
    const stage1Promises = [
      startSpaltenExtraction("produkt", currentUrl),
      startSpaltenExtraction("parameter", currentUrl)
    ];
    
    const stage1Results = await Promise.all(stage1Promises);
    
    // Extrahiere Produktdaten direkt aus den KI-Ergebnissen
    let manufacturer = "";
    let productName = "";
    let productCode = "";
    
    // Debug: Logge die kompletten stage1Results
    console.log('🔍 DEBUG: stage1Results =', stage1Results);
    
    // Durchsuche die Ergebnisse nach Produktdaten
    stage1Results.forEach(result => {
      console.log('🔍 DEBUG: Processing result =', result);
      if (result && result.data) {
        console.log('🔍 DEBUG: result.data =', result.data);
        Object.entries(result.data).forEach(([field, value]) => {
          console.log(`🔍 DEBUG: field="${field}", value="${value}"`);
          if (value) {
            if (field === 'produkt_hersteller' && value) manufacturer = value;
            if (field === 'produkt_name_modell' && value) productName = value;
            if (field === 'produkt_code_id' && value) productCode = value;
          }
        });
      }
    });
    
    // STUFE 2: Nachgelagerte Suche nach Dokumenten und Händlern (mit Web-Suche)
    setExtractionLog((prev) => prev + "\n🔍 STUFE 2: DOKUMENTE & HÄNDLER-SUCHE (mit Web-Suche)...\n");
    
    // Direkt erweiterte Suchen starten (ohne setTimeout)
    try {
      // Debug: Logge die Werte
      setExtractionLog((prev) => prev + `🔍 DEBUG: manufacturer="${manufacturer}", productName="${productName}", productCode="${productCode}"\n`);
      
      if (manufacturer && productName) {
        setExtractionLog((prev) => prev + `📋 Kontext für erweiterte Suche: ${manufacturer} - ${productName}\n`);
        
        // PHASE 2A: Erweiterte Dokumente-Suche mit Web-Suche
        setExtractionLog((prev) => prev + "\n📄 PHASE 2A: DOKUMENTE-SUCHE (mit Web-Suche)...\n");
        try {
          const documentsResponse = await fetch("/api/extraction/enhanced-documents-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: currentUrl,
              manufacturer,
              productName,
              productCode
            }),
          });
          
          if (documentsResponse.ok) {
            const documentsResult = await documentsResponse.json();
            console.log('Enhanced Documents Search Result:', documentsResult);
            
            // Verarbeite die Ergebnisse
            if (documentsResult.data) {
              const updates = {};
              Object.entries(documentsResult.data).forEach(([field, fieldData]) => {
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const value = fieldData.value;
                  if (value && value !== '') {
                    updates[field] = value;
                    console.log(`Setze ${field} = "${value}"`);
                  }
                }
              });
              
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData);
                return newData;
              });
              
              setExtractionLog((prev) => prev + `🎯 Erweiterte Dokumente-Suche: ${Object.keys(updates).length} Dokumente gefunden\n`);
            }
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche\n`);
          }
        } catch (error) {
          console.error('Enhanced Documents Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche: ${error.message}\n`);
        }
        
        // PHASE 2B: Erweiterte Händler-Suche mit Web-Suche
        setExtractionLog((prev) => prev + "\n🏪 PHASE 2B: HÄNDLER-SUCHE (mit Web-Suche) - NEUE ERWEITERTE API...\n");
        try {
          const retailersResponse = await fetch("/api/extraction/enhanced-retailers-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: currentUrl,
              manufacturer,
              productName,
              productCode,
              buttonType: 'haendler' // Da wir in handleResellerClick sind
            }),
          });
          
          if (retailersResponse.ok) {
            const retailersResult = await retailersResponse.json();
            console.log('Enhanced Retailers Search Result:', retailersResult);
            
            // Logge die Rohdaten für Debugging
            setExtractionLog((prev) => prev + `🔍 ROHDATEN von erweiterter Händler-Suche:\n`);
            setExtractionLog((prev) => prev + `   ${JSON.stringify(retailersResult.data, null, 2)}\n\n`);
            
            // Verarbeite die Ergebnisse
            if (retailersResult.data) {
              const updates = {};
              
              // DEBUG: Logge jeden Schritt der Verarbeitung
              setExtractionLog((prev) => prev + `🔍 DEBUG: Verarbeite ${Object.keys(retailersResult.data).length} Felder\n`);
              
              Object.entries(retailersResult.data).forEach(([field, fieldData]) => {
                setExtractionLog((prev) => prev + `🔍 DEBUG: Verarbeite Feld "${field}" = ${JSON.stringify(fieldData)}\n`);
                
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const value = fieldData.value;
                  if (value && value !== '') {
                    updates[field] = value;
                    setExtractionLog((prev) => prev + `✅ Feld "${field}" gesetzt: ${Array.isArray(value) ? `${value.length} Einträge` : value}\n`);
                  }
                }
              });
              
              // Spezielle Behandlung für weitere Händler
              if (updates.haendler_weitere_haendler_und_preise && Array.isArray(updates.haendler_weitere_haendler_und_preise)) {
                const existingRetailers = formData.haendler_weitere_haendler_und_preise || [];
                const newRetailers = updates.haendler_weitere_haendler_und_preise;
                const allRetailers = [...existingRetailers, ...newRetailers];
                updates.haendler_weitere_haendler_und_preise = allRetailers;
                setExtractionLog((prev) => prev + `🏪 ${newRetailers.length} weitere Händler gefunden: ${newRetailers.map(r => `${r.name} (${r.price || 'Kein Preis'})`).join(', ')}\n`);
              }
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData);
                return newData;
              });
              setExtractionLog((prev) => prev + `🎯 Erweiterte Händler-Suche: ${Object.keys(updates).length} Felder aktualisiert\n`);
            }
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche\n`);
          }
        } catch (error) {
          console.error('Enhanced Retailers Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche: ${error.message}\n`);
        }
        
      } else {
        // Fallback: Normale Suchen ohne Kontext
        setExtractionLog((prev) => prev + "⚠️ Kein Produkt-Kontext verfügbar - verwende ALTE STANDARD-SUCHE\n");
        await startSpaltenExtraction("dokumente", currentUrl);
        await startSpaltenExtraction("haendler", currentUrl);
      }
    } catch (error) {
      console.error('Enhanced Search Error:', error);
      setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Suche: ${error.message}\n`);
    }
    
    setExtractionLog((prev) => prev + "\n=== HÄNDLER-ANALYSE ABGESCHLOSSEN ===");
  }, [currentUrl, startSpaltenExtraction]);


  useEffect(() => {
    const loadCaptureData = async () => {
      const params = new URLSearchParams(window.location.search);
      const captureId = params.get('capture_id');
      const url = params.get('url');
      
      // If capture_id is provided, load from database
      if (captureId) {
        setCaptureLoading(true);
        try {
          const capture = await loadCaptureById(parseInt(captureId));
          if (capture) {
            setCurrentCapture(capture);
            setCurrentUrl(capture.url);
            handleFormChange('erfassung_quell_url', capture.url);
            
            // Set capture date if available
            if (capture.created_at) {
              const captureDate = new Date(capture.created_at).toLocaleString('de-DE');
              handleFormChange('erfassung_erfassungsdatum', captureDate);
            }
          }
        } catch (error) {
          console.error('Error loading capture:', error);
        } finally {
          setCaptureLoading(false);
        }
      } 
      // Fallback to URL parameter
      else if (url) {
        setCurrentUrl(url);
        handleFormChange('erfassung_quell_url', url);
        handleFormChange('erfassung_erfassungsdatum', new Date().toLocaleString('de-DE'));
      } 
      // Default case
      else {
        handleFormChange('erfassung_erfassungsdatum', new Date().toLocaleString('de-DE'));
      }
    };

    loadCaptureData();
  }, [loadCaptureById]);

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4">
          {/* PRODUKT */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                {"PRODUKT"}
              </span>
              <Progress value={spaltenProgress.produkt}/>
              <div className="flex w-full flex-col items-start gap-1">
                  <div className="flex flex-col items-start gap-1 pt-4">
                    <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                      {"Produktbild\n"}
                    </span>
                    {captureLoading ? (
                      <div className="w-full h-32 rounded-md border border-solid border-neutral-border bg-neutral-100 flex items-center justify-center">
                        <span className="text-subtext-color">Lade Screenshot...</span>
                      </div>
                    ) : currentCapture?.thumbnail_url ? (
                      <img
                        className="w-full grow shrink-0 basis-0 rounded-md border border-solid border-neutral-border object-cover shadow-md"
                        src={currentCapture.thumbnail_url}
                        alt="Produkt Thumbnail"
                        onError={(e) => {
                          e.currentTarget.src = "https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png";
                        }}
                      />
                    ) : (
                      <img
                        className="w-full grow shrink-0 basis-0 rounded-md border border-solid border-neutral-border object-cover shadow-md"
                        src="https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png"
                        alt="Placeholder"
                      />
                    )}
                  </div>
                </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Kategorie"}
                </span>
                <MultiSelectWithSearch
                  className="w-full"
                  variant="filled"
                  options={multiSelectOptions}
                  selectedValues={formData.produkt_kategorie}
                  onSelectionChange={(values) => handleFormChange('produkt_kategorie', values)}
                  placeholder="Kategorien auswählen..."
                  searchPlaceholder="Kategorien durchsuchen..."
                  disabled={categoriesLoading}
                />
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Hersteller\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherEdit3 />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_hersteller}
                    onChange={(e) => handleFormChange('produkt_hersteller', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Name / Modell\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_name_modell}
                    onChange={(e) => handleFormChange('produkt_name_modell', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Produktlinie, Serie\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_produktlinie_serie}
                    onChange={(e) => handleFormChange('produkt_produktlinie_serie', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Code (ID)\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_code_id}
                    onChange={(e) => handleFormChange('produkt_code_id', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Anwendungsbereich"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_anwendungsbereich}
                    onChange={(e) => handleFormChange('produkt_anwendungsbereich', e.target.value)}
                  />
                </TextField>
                <div className="flex w-full flex-col items-start gap-1 pt-4">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Beschreibung\n"}
                  </span>
                  <TextArea
                    className="h-auto w-full flex-none"
                    variant="filled"
                    label=""
                    helpText=""
                  >
                    <TextArea.Input
                      className="h-28 w-full flex-none"
                      placeholder="..."
                      value={formData.produkt_beschreibung}
                      onChange={(e) => handleFormChange('produkt_beschreibung', e.target.value)}
                    />
                  </TextArea>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Hersteller Webseite"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  icon={<FeatherGlobe onClick={() => openUrl(formData.produkt_hersteller_webseite)} style={{cursor: 'pointer'}} />}
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_hersteller_webseite}
                    onChange={(e) => handleFormChange('produkt_hersteller_webseite', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Hersteller Produkt URL"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  icon={<FeatherGlobe onClick={() => openUrl(formData.produkt_hersteller_produkt_url)} style={{cursor: 'pointer'}} />}
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_hersteller_produkt_url}
                    onChange={(e) => handleFormChange('produkt_hersteller_produkt_url', e.target.value)}
                  />
                </TextField>
              </div>
            </div>
          </div>
          {/* PARAMETER */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                {"PARAMETER"}
              </span>
              <Progress value={spaltenProgress.parameter}/>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Maße"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_masse}
                    onChange={(e) => handleFormChange('parameter_masse', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Farbe\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_farbe}
                    onChange={(e) => handleFormChange('parameter_farbe', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Hauptmaterial\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_hauptmaterial}
                    onChange={(e) => handleFormChange('parameter_hauptmaterial', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Oberfläche"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_oberflaeche}
                    onChange={(e) => handleFormChange('parameter_oberflaeche', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Gewicht pro Einheit"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_gewicht_pro_einheit}
                    onChange={(e) => handleFormChange('parameter_gewicht_pro_einheit', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Feuerwiderstand\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_feuerwiderstand}
                    onChange={(e) => handleFormChange('parameter_feuerwiderstand', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Wärmeleitfähigkeit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_waermeleitfaehigkeit}
                    onChange={(e) => handleFormChange('parameter_waermeleitfaehigkeit', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"U-Wert"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_u_wert}
                    onChange={(e) => handleFormChange('parameter_u_wert', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Schalldämmung\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_schalldaemmung}
                    onChange={(e) => handleFormChange('parameter_schalldaemmung', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Wasserbeständigkeit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_wasserbestaendigkeit}
                    onChange={(e) => handleFormChange('parameter_wasserbestaendigkeit', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Dampfdiffusion"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_dampfdiffusion}
                    onChange={(e) => handleFormChange('parameter_dampfdiffusion', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Einbauart"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_einbauart}
                    onChange={(e) => handleFormChange('parameter_einbauart', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Wartung"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_wartung}
                    onChange={(e) => handleFormChange('parameter_wartung', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Umweltzertifikat"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_umweltzertifikat}
                    onChange={(e) => handleFormChange('parameter_umweltzertifikat', e.target.value)}
                  />
                </TextField>
              </div>
            </div>
          </div>
          {/* DOKUMENTE */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                {"DOKUMENTE"}
              </span>
              <Progress value={spaltenProgress.dokumente}/>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Datenblatt"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_datenblatt}
                    onChange={(e) => handleFormChange('dokumente_datenblatt', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Technisches Merkblatt"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_technisches_merkblatt}
                    onChange={(e) => handleFormChange('dokumente_technisches_merkblatt', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Produktkatalog\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_produktkatalog}
                    onChange={(e) => handleFormChange('dokumente_produktkatalog', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Weitere Dokumente"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_weitere_dokumente}
                    onChange={(e) => handleFormChange('dokumente_weitere_dokumente', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"BIM / CAD / Technische Zeichnungen"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_bim_cad_technische_zeichnungen}
                    onChange={(e) => handleFormChange('dokumente_bim_cad_technische_zeichnungen', e.target.value)}
                  />
                </TextField>
              </div>
            </div>
          </div>
          {/* HÄNDLER */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                {"HÄNDLER"}
              </span>
              <Progress value={spaltenProgress.haendler}/>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Händlername"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_haendlername}
                    onChange={(e) => handleFormChange('haendler_haendlername', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Händler-Webseite\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  icon={<FeatherGlobe onClick={() => openUrl(formData.haendler_haendler_webseite)} style={{cursor: 'pointer'}} />}
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_haendler_webseite}
                    onChange={(e) => handleFormChange('haendler_haendler_webseite', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Handler product URL"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  icon={<FeatherGlobe onClick={() => openUrl(formData.haendler_haendler_produkt_url)} style={{cursor: 'pointer'}} />}
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_haendler_produkt_url}
                    onChange={(e) => handleFormChange('haendler_haendler_produkt_url', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Verfügbarkeit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_verfuegbarkeit}
                    onChange={(e) => handleFormChange('haendler_verfuegbarkeit', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Einheit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_einheit}
                    onChange={(e) => handleFormChange('haendler_einheit', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Preis\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    className="text-right"
                    placeholder="€ 123,00"
                    value={formData.haendler_preis}
                    onChange={(e) => handleFormChange('haendler_preis', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Preis pro Einheit"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    className="text-right"
                    placeholder="€ 123,00"
                    value={formData.haendler_preis_pro_einheit}
                    onChange={(e) => handleFormChange('haendler_preis_pro_einheit', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full flex-col items-start gap-1 pt-4">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Weitere Händler und Preise"}
                  </span>
                  <div className="flex w-full flex-col items-start gap-1 bg-neutral-50">
                    <Table>
                      {formData.haendler_weitere_haendler_und_preise && formData.haendler_weitere_haendler_und_preise.length > 0 ? (
                        formData.haendler_weitere_haendler_und_preise.map((retailer, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <div className="flex flex-col">
                                <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-700">
                                  {retailer.name}
                                </span>
                                {retailer.website && (
                                  <span className="grow shrink-0 basis-0 whitespace-nowrap text-caption font-caption text-neutral-400">
                                    {retailer.website}
                                  </span>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex flex-col items-end">
                                <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-700 text-right">
                                  {retailer.price} {retailer.unit && `/ ${retailer.unit}`}
                                </span>
                                {retailer.productUrl && (
                                  <a 
                                    href={retailer.productUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-caption font-caption text-blue-500 hover:underline"
                                  >
                                    Zur Produktseite
                                  </a>
                                )}
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))
                      ) : (
                        <Table.Row>
                          <Table.Cell colSpan={2}>
                            <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-400 text-center">
                              Keine weiteren Händler gefunden
                            </span>
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ERFAHRUNG */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                {"ERFAHRUNG"}
              </span>
              <Progress value={spaltenProgress.erfahrung}/>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Einsatz in Projekt"}
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  placeholder="Projektauswahl"
                  helpText=""
                  icon={<FeatherSearch />}
                  value={formData.erfahrung_einsatz_in_projekt}
                  onValueChange={(value) => handleFormChange('erfahrung_einsatz_in_projekt', value)}
                >
                  <Select.Item value="projekt1">Projekt 1</Select.Item>
                  <Select.Item value="projekt2">Projekt 2</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Muster bestellt"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.erfahrung_muster_bestellt}
                    onChange={(e) => handleFormChange('erfahrung_muster_bestellt', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Muster abgelegt"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  iconRight={<FeatherPenLine />}
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.erfahrung_muster_abgelegt}
                    onChange={(e) => handleFormChange('erfahrung_muster_abgelegt', e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Bewertung\n"}
                </span>
                <ToggleGroup
                  className="h-auto w-full flex-none"
                  value={formData.erfahrung_bewertung}
                  onValueChange={(value) => handleFormChange('erfahrung_bewertung', value)}
                >
                  <ToggleGroup.Item value="1">1</ToggleGroup.Item>
                  <ToggleGroup.Item value="2">2</ToggleGroup.Item>
                  <ToggleGroup.Item value="3">3</ToggleGroup.Item>
                  <ToggleGroup.Item value="4">4</ToggleGroup.Item>
                  <ToggleGroup.Item value="5">5</ToggleGroup.Item>
                </ToggleGroup>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Bemerkungen und Notizen"}
                </span>
                <TextArea
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextArea.Input
                    className="h-28 w-full flex-none"
                    placeholder="..."
                    value={formData.erfahrung_bemerkungen_notizen}
                    onChange={(e) => handleFormChange('erfahrung_bemerkungen_notizen', e.target.value)}
                  />
                </TextArea>
              </div>
            </div>
          </div>
          {/* ERFASSUNG */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2 px-2 py-2">
              <span className="w-full text-heading-3 font-heading-3 text-default-font text-center bg-neutral-50 rounded-md py-2 px-4 border border-neutral-200">
                ERFASSUNG
              </span>
              <Progress value={spaltenProgress.erfassung}/>
              <div className="flex w-full flex-col items-start gap-1">
                <div className="flex flex-col items-start gap-1 pt-4">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Quell-Screenshot\n"}
                  </span>
                </div>
                {captureLoading ? (
                  <div className="w-full h-48 rounded-md border border-solid border-neutral-border bg-neutral-100 flex items-center justify-center">
                    <span className="text-subtext-color">Lade Screenshot...</span>
                  </div>
                ) : currentCapture?.screenshot_url ? (
                  <img
                    className="w-full flex-none rounded-md border border-solid border-neutral-border shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                    src={currentCapture.screenshot_url}
                    alt="Quell-Screenshot"
                    onClick={() => window.open(currentCapture.screenshot_url, '_blank')}
                    onError={(e) => {
                      e.currentTarget.src = "https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png";
                    }}
                  />
                ) : (
                  <img
                    className="w-full flex-none rounded-md border border-solid border-neutral-border shadow-md"
                    src="https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png"
                    alt="Placeholder"
                  />
                )}
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Quell-URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Erfassungsdatum / -zeit"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.erfassung_erfassungsdatum}
                    readOnly
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Erfassung für:\n"}
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  placeholder="Deutschland"
                  helpText=""
                  icon={<FeatherSearch />}
                  value={formData.erfassung_erfassung_fuer}
                  onValueChange={(value) => handleFormChange('erfassung_erfassung_fuer', value)}
                >
                  <Select.Item value="Deutschland">Deutschland</Select.Item>
                  <Select.Item value="Österreich">Österreich</Select.Item>
                  <Select.Item value="Schweiz">Schweiz</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start justify-end gap-1 pt-4">
                <div className="flex w-full items-center gap-2">
                  <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                    <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                      {"Erfassen als"}
                    </span>
                    <Button
                      className="h-8 w-full flex-none"
                      variant="neutral-primary"
                      icon={<FeatherFactory />}
                      onClick={handleManufacturerClick}
                    >
                      Hersteller
                    </Button>
                    <Button
                      className="h-8 w-full flex-none"
                      variant="neutral-primary"
                      icon={<FeatherShoppingCart />}
                      onClick={handleResellerClick}
                    >
                      Händler
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Extraktions-Log\n"}
                </span>
                <TextArea
                  className="w-full grow shrink-0 basis-0"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextArea.Input
                    className="w-full grow shrink-0 basis-0"
                    placeholder="..."
                    value={extractionLog}
                    readOnly
                  />
                </TextArea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default Extractor;

