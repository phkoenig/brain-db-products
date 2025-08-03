"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Progress } from "@/ui/components/Progress";
import { Select } from "@/ui/components/Select";
import { FeatherSearch } from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { FeatherPenLine } from "@subframe/core";
import { TextArea } from "@/ui/components/TextArea";
import { Table } from "@/ui/components/Table";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { Button } from "@/ui/components/Button";
import { FeatherFactory } from "@subframe/core";
import { FeatherShoppingCart } from "@subframe/core";
import { FeatherGlobe } from "@subframe/core";
import { FeatherLock } from "@subframe/core";
import { useExtraction } from "@/hooks/useExtraction";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";
import { useCaptures } from "@/hooks/useCaptures";
import { useProducts } from "@/hooks/useProducts";
import { useCaptureForm } from "@/hooks/useCaptureForm";
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

  // KI-Progress-Status für jede Spalte
  const [aiProgress, setAiProgress] = useState({
    produkt: { stage: 'idle', progress: 0 },
    parameter: { stage: 'idle', progress: 0 },
    dokumente: { stage: 'idle', progress: 0 },
    haendler: { stage: 'idle', progress: 0 },
  });

  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
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
  const { createProduct, loading: productLoading } = useProducts();
  const { validateForm, toProductData } = useCaptureForm();
  const [currentUrl, setCurrentUrl] = useState("");
  const [extractionLog, setExtractionLog] = useState("");
  const [currentCapture, setCurrentCapture] = useState<Capture | null>(null);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Screenshot Zoom Modal State
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Analysis Results State
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null);
  const [showAnalysisTable, setShowAnalysisTable] = useState(false);
  const [selectedValues, setSelectedValues] = useState<{[key: string]: any}>({});

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
      
      // Nur für ERFAHRUNG-Felder Progress berechnen (AI-Spalten verwenden exklusiv AI-Progress)
      const erfahrungFields = SPALTEN_FELDER.erfahrung || [];
      if (erfahrungFields.includes(field)) {
        console.log(`📝 User input in Erfahrung field: ${field} → updating progress`);
        updateAllProgress(newData, true); // Preserve AI progress, nur Erfahrung neu berechnen
      } else {
        console.log(`📝 User input in non-Erfahrung field: ${field} → no progress update`);
      }
      
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

  // Toggle-Funktion für Lock/Unlock von Feldern
  const toggleFieldLock = (fieldName: string) => {
    setLockedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  // KI-Progress-Update-Funktionen
  const updateAiProgress = (spalte: string, stage: string, progress?: number) => {
    console.log(`🔥🔥🔥 AI-Progress Update CALLED: ${spalte} → ${stage} (${progress}%)`);
    
    setAiProgress(prev => {
      console.log(`🔥 setAiProgress BEFORE:`, prev);
      const newAiProgress = {
        ...prev,
        [spalte]: { 
          stage, 
          progress: progress !== undefined ? progress : prev[spalte as keyof typeof prev]?.progress || 0 
        }
      };
      console.log(`🔥 setAiProgress AFTER:`, newAiProgress);
      return newAiProgress;
    });
    
    // Progress auch direkt in UI aktualisieren - ABER NUR für AI-Spalten
    if (progress !== undefined && ['produkt', 'parameter', 'dokumente', 'haendler'].includes(spalte)) {
      console.log(`🔥🔥 setSpaltenProgress WILL BE CALLED for ${spalte} with ${progress}%`);
      setSpaltenProgress(prevSpalten => {
        console.log(`🔥 setSpaltenProgress BEFORE:`, prevSpalten);
        const newProgress = {
          ...prevSpalten,
          [spalte]: progress
        };
        
        // ERFASSUNG neu berechnen wenn AI-Spalte 100% erreicht
        if (progress >= 100) {
          const completedSpalten = [];
          if (newProgress.produkt >= 100) completedSpalten.push('produkt');
          if (newProgress.parameter >= 100) completedSpalten.push('parameter');
          if (newProgress.dokumente >= 100) completedSpalten.push('dokumente');
          if (newProgress.haendler >= 100) completedSpalten.push('haendler');
          newProgress.erfassung = completedSpalten.length * 25;
          
          console.log(`🎯 AI-Spalte ${spalte} erreicht 100% → Erfassung jetzt ${newProgress.erfassung}% (${completedSpalten.length}/4 completed)`);
        }
        
        console.log(`🔥 setSpaltenProgress AFTER:`, newProgress);
        return newProgress;
      });
    } else {
      console.log(`🔥❌ setSpaltenProgress NOT CALLED: progress=${progress}, spalte=${spalte}`);
    }
  };

  // Sanfte Progress-Animation während des Wartens mit Stopp-Mechanismus
  const animationTimers = useRef<{ [key: string]: NodeJS.Timeout[] }>({});

  const animateProgressWhileWaiting = (spalten: string[], startProgress: number, maxProgress: number, duration: number = 3000) => {
    const steps = 20;
    const stepDuration = duration / steps;
    const progressIncrement = (maxProgress - startProgress) / steps;
    
    let currentStep = 0;
    
    const animate = () => {
      if (currentStep < steps) {
        const currentProgress = startProgress + (progressIncrement * currentStep);
        spalten.forEach(spalte => {
          // Nur animieren wenn noch im 'waiting' Zustand
          setAiProgress(prev => {
            if (prev[spalte as keyof typeof prev]?.stage === 'waiting') {
              const newProgress = Math.min(currentProgress, maxProgress);
              
              // Direkt Progress Bar aktualisieren
              setSpaltenProgress(prevSpalten => ({
                ...prevSpalten,
                [spalte]: newProgress
              }));
              
              return {
                ...prev,
                [spalte]: { 
                  stage: 'waiting', 
                  progress: newProgress
                }
              };
            }
            return prev;
          });
        });
        currentStep++;
        
        const timer = setTimeout(animate, stepDuration);
        spalten.forEach(spalte => {
          if (!animationTimers.current[spalte]) animationTimers.current[spalte] = [];
          animationTimers.current[spalte].push(timer);
        });
      }
    };
    
    animate();
  };

  const stopAnimation = (spalte: string) => {
    console.log(`🛑 Stopping animation for ${spalte}`);
    if (animationTimers.current[spalte]) {
      animationTimers.current[spalte].forEach(timer => clearTimeout(timer));
      animationTimers.current[spalte] = [];
      console.log(`🛑 Cleared ${animationTimers.current[spalte].length} timers for ${spalte}`);
    }
  };

  const resetAllProgress = () => {
    console.log('🔄 COMPLETE RESET: Stopping animations and resetting progress');
    
    // Alle Animationen stoppen
    ['produkt', 'parameter', 'dokumente', 'haendler'].forEach(spalte => {
      stopAnimation(spalte);
    });
    
    // ZUERST KI-Progress zurücksetzen
    setAiProgress({
      produkt: { stage: 'idle', progress: 0 },
      parameter: { stage: 'idle', progress: 0 },
      dokumente: { stage: 'idle', progress: 0 },
      haendler: { stage: 'idle', progress: 0 },
    });
    
    // DANN alle Progress Bars auf 0% setzen (und dort halten!)
    setSpaltenProgress({
      produkt: 0,
      parameter: 0,
      dokumente: 0,
      haendler: 0,
      erfahrung: 0,
      erfassung: 0,
    });
    
    console.log('🔄 Reset completed - all progress bars should be at 0%');
  };

  // Berechne finalen Progress für eine Spalte - NUR ERFAHRUNG verwendet Field-Progress
  const getFinalProgress = (spalte: string, data: any, currentProgress?: { [key: string]: number }) => {
    // Verwende bereits berechneten Progress wenn vorhanden
    const existingProgress = currentProgress ? currentProgress[spalte] : undefined;
    if (existingProgress !== undefined) {
      return existingProgress;
    }
    
    // NUR ERFAHRUNG verwendet Field-based Progress
    if (spalte === 'erfahrung') {
      const erfahrungFields = SPALTEN_FELDER.erfahrung;
      const filledFields = erfahrungFields.filter((field) => !!data[field]);
      return filledFields.length * 20; // 20% pro Feld
    }
    
    if (spalte === 'erfassung') {
      // Erfassung wird separat berechnet
      return 0;
    }
    
    // AI-SPALTEN: NIEMALS field-based progress - nur AI bestimmt Progress!
    if (['produkt', 'parameter', 'dokumente', 'haendler'].includes(spalte)) {
      console.log(`📊 AI-Spalte ${spalte}: Field-Progress DEAKTIVIERT - nur AI-Progress zählt`);
      return 0; // AI-Spalten verwenden exklusiv updateAiProgress()
    }
    
    // Fallback für andere Spalten
    const fields = SPALTEN_FELDER[spalte as keyof typeof SPALTEN_FELDER];
    if (!fields) return 0;
    const filledFields = fields.filter((field) => !!data[field]);
    return (filledFields.length / fields.length) * 100;
  };
  
  const updateAllProgress = (data: any, preserveAiProgress = false) => {
    console.log(`📊 UpdateAllProgress called, preserveAi: ${preserveAiProgress}`);
    
    setSpaltenProgress(prev => {
      const newProgress = { ...prev };
      
      // NUR ERFAHRUNG verwendet Field-based Progress
      newProgress.erfahrung = getFinalProgress('erfahrung', data);
      console.log(`📊 Erfahrung progress: ${newProgress.erfahrung}%`);
      
      // AI-SPALTEN: NIEMALS field-based progress - nur AI-Progress zählt!
      console.log(`📊 AI-Spalten verwenden exklusiv AI-Progress (kein Field-Progress)`);
      
      // Erfassung basierend auf aktuellen Progress-Werten berechnen
      const completedSpalten = [];
      if (newProgress.produkt >= 100) completedSpalten.push('produkt');
      if (newProgress.parameter >= 100) completedSpalten.push('parameter');
      if (newProgress.dokumente >= 100) completedSpalten.push('dokumente');
      if (newProgress.haendler >= 100) completedSpalten.push('haendler');
      newProgress.erfassung = completedSpalten.length * 25;
      
      console.log(`📊 Final progress: Erfahrung=${newProgress.erfahrung}%, Erfassung=${newProgress.erfassung}%`);
      return newProgress;
    });
  };
  
  const startSpaltenExtraction = useCallback(async (spalte: string, url: string) => {
    const felder = SPALTEN_FELDER[spalte as keyof typeof SPALTEN_FELDER];
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
        
        const updates: any = {};
        Object.entries(data).forEach(([field, fieldData]) => {
          // fieldData kann ein Objekt mit { value, confidence, reasoning } sein
          // oder direkt ein Wert
          if (fieldData) {
            let value = '';
            if (typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData) {
              value = (fieldData as any).value;
            } else if (typeof fieldData === 'string') {
              value = fieldData;
            }
            
            // Nur nicht-leere Werte setzen
            if (value !== null && value !== undefined && value !== '') {
              // Spezielle Behandlung für verschiedene Datentypen
              if (field === 'produkt_kategorie') {
                // Kategorie-Arrays behandeln
                let categoryValues: string[] = [];
                if (Array.isArray(value)) {
                  categoryValues = value.filter((v: any) => v && v.trim && v.trim());
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
                
                (updates as any)[field] = mappedCategories.filter(c => c);
              } else if (Array.isArray(value)) {
                // Andere Arrays
                (updates as any)[field] = value.filter(v => v !== null && v !== undefined && v !== '');
              } else if (typeof value === 'string' && value.trim()) {
                // String-Werte
                (updates as any)[field] = value.trim();
              } else if (typeof value === 'number') {
                // Numerische Werte
                (updates as any)[field] = value;
              } else if (typeof value === 'boolean') {
                // Boolean-Werte
                (updates as any)[field] = value;
              }
              
              // Nur loggen wenn tatsächlich ein Wert gesetzt wurde
              if ((updates as any)[field] !== undefined) {
                console.log(`Setze ${field} = "${JSON.stringify((updates as any)[field])}"`);
              }
            }
          }
        });
        
        console.log('Updates für Formular:', updates);
        
        setFormData((prev) => {
            const newData = { ...prev, ...updates };
            updateAllProgress(newData, true); // Preserve AI progress during data extraction
            return newData;
        });
        
        setExtractionLog((prev) => prev + `\n🎯 KI-ANTWORT erhalten - ${Object.keys(updates).length} Felder extrahiert`);
        setExtractionLog((prev) => prev + `\n✅ ${spalte.toUpperCase()}-Analyse abgeschlossen\n`);
        
        // Gib die extrahierten Daten zurück
        return { data: updates };
      }
    } catch (error) {
      setExtractionLog((prev) => prev + `\n❌ Fehler bei ${spalte}-Analyse: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`);
      return null;
    }
  }, []);

  const handleManufacturerClick = useCallback(async () => {
    if (!currentUrl) return;
    
    // Progress Bars zurücksetzen
    resetAllProgress();
    
    // Kurz warten, dann sicherstellen dass Progress wirklich bei 0% ist
    setTimeout(() => {
      console.log('🔄 Final reset to 0% for all columns');
      setSpaltenProgress({
        produkt: 0,
        parameter: 0,
        dokumente: 0,
        haendler: 0,
        erfahrung: 0,
        erfassung: 0,
      });
    }, 100);
    
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
    
    // Produkt/Parameter Progress: SOFORT auf 25% (wie bei Händler)
    console.log('🚀🚀🚀 CRITICAL: Starting AI Progress for produkt & parameter');
    console.log('🚀🚀🚀 CALLING updateAiProgress for PRODUKT');
    updateAiProgress('produkt', 'prompt_sent', 25);
    console.log('🚀🚀🚀 CALLING updateAiProgress for PARAMETER');
    updateAiProgress('parameter', 'prompt_sent', 25);
    console.log('🚀🚀🚀 BOTH updateAiProgress CALLS COMPLETED');
    
    // Animation verzögert starten (wie bei Händler)
    setTimeout(() => {
      console.log('🎬🎬🎬 ANIMATION TIMEOUT: Starting animation for produkt & parameter (25% → 50%)');
      console.log('🎬 CALLING updateAiProgress WAITING for PRODUKT');
      updateAiProgress('produkt', 'waiting', 25);
      console.log('🎬 CALLING updateAiProgress WAITING for PARAMETER');
      updateAiProgress('parameter', 'waiting', 25);
      console.log('🎬 CALLING animateProgressWhileWaiting');
      animateProgressWhileWaiting(['produkt', 'parameter'], 25, 50, 3000);
    }, 100);
    
    const stage1Promises = [
      startSpaltenExtraction("produkt", currentUrl),
      startSpaltenExtraction("parameter", currentUrl)
    ];
    
    const stage1Results = await Promise.all(stage1Promises);
    
    // Animation SOFORT und EXPLIZIT stoppen
    console.log('🛑 STOPPING animations for produkt & parameter');
    stopAnimation('produkt');
    stopAnimation('parameter');
    
    // Antwort erhalten: 75%
    console.log('📈 Setting produkt & parameter to 75% (response received)');
    updateAiProgress('produkt', 'response_received', 75);
    updateAiProgress('parameter', 'response_received', 75);
    
    // Kurz warten, dann auf 100%
    setTimeout(() => {
      console.log('✅ Setting produkt & parameter to 100% (completed)');
      updateAiProgress('produkt', 'completed', 100);
      updateAiProgress('parameter', 'completed', 100);
    }, 500);
    
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
            if (field === 'produkt_hersteller' && value) manufacturer = String(value);
            if (field === 'produkt_name_modell' && value) productName = String(value);
            if (field === 'produkt_code_id' && value) productCode = String(value);
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
            
            // Animation stoppen und finale Progress setzen
            stopAnimation('dokumente');
            updateAiProgress('dokumente', 'response_received', 75);
            
            // Verarbeite die Ergebnisse
            if (documentsResult.data) {
              const updates = {};
              Object.entries(documentsResult.data).forEach(([field, fieldData]) => {
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const value = fieldData.value;
                  if (value && value !== '') {
                    (updates as any)[field] = value;
                    console.log(`Setze ${field} = "${value}"`);
                  }
                }
              });
              
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData, true); // Preserve AI progress during enhanced search
                return newData;
              });
              
              setExtractionLog((prev) => prev + `🎯 Erweiterte Dokumente-Suche: ${Object.keys(updates).length} Dokumente gefunden\n`);
            } else {
              // Auch bei leeren Ergebnissen (aber erfolgreicher API-Antwort) Progress auf 100%
              setExtractionLog((prev) => prev + `🎯 Erweiterte Dokumente-Suche: 0 Dokumente gefunden (leere Antwort)\n`);
            }
            
            // Felder befüllt: 100% (egal ob Daten gefunden oder nicht)
            setTimeout(() => {
              updateAiProgress('dokumente', 'completed', 100);
            }, 500);
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche\n`);
            // Auch bei Fehlern Progress auf 100% setzen (API-Call abgeschlossen)
            setTimeout(() => {
              updateAiProgress('dokumente', 'completed', 100);
            }, 500);
          }
        } catch (error) {
          console.error('Enhanced Documents Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche: ${error instanceof Error ? error.message : String(error)}\n`);
          // Auch bei Exceptions Progress auf 100% setzen (API-Call abgeschlossen)
          setTimeout(() => {
            updateAiProgress('dokumente', 'completed', 100);
          }, 500);
        }
        
        // PHASE 2B: Erweiterte Händler-Suche mit Web-Suche
        setExtractionLog((prev) => prev + "\n🏪 PHASE 2B: HÄNDLER-SUCHE (mit Web-Suche) - NEUE ERWEITERTE API...\n");
        
        // Händler Progress: Prompt gesendet (25%)
        updateAiProgress('haendler', 'prompt_sent', 25);
        setTimeout(() => {
          updateAiProgress('haendler', 'waiting', 25);
          animateProgressWhileWaiting(['haendler'], 25, 50, 3000);
        }, 100);
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
            
            // Animation stoppen und finale Progress setzen
            stopAnimation('haendler');
            updateAiProgress('haendler', 'response_received', 75);
            
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
                    (updates as any)[field] = value;
                    setExtractionLog((prev) => prev + `✅ Setze ${field} = "${value}"\n`);
                  }
                }
              });
              
              setExtractionLog((prev) => prev + `🔍 DEBUG: Finale Updates = ${JSON.stringify(updates, null, 2)}\n`);
              
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData, true); // Preserve AI progress during enhanced search
                return newData;
              });
              setExtractionLog((prev) => prev + `🎯 Erweiterte Händler-Suche: ${Object.keys(updates).length} Felder aktualisiert\n`);
            } else {
              // Auch bei leeren Ergebnissen (aber erfolgreicher API-Antwort) Progress auf 100%
              setExtractionLog((prev) => prev + `🎯 Erweiterte Händler-Suche: 0 Felder aktualisiert (leere Antwort)\n`);
            }
            
            // Felder befüllt: 100% (egal ob Daten gefunden oder nicht)
            setTimeout(() => {
              updateAiProgress('haendler', 'completed', 100);
            }, 500);
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche\n`);
            // Auch bei Fehlern Progress auf 100% setzen (API-Call abgeschlossen)
            setTimeout(() => {
              updateAiProgress('haendler', 'completed', 100);
            }, 500);
          }
        } catch (error) {
          console.error('Enhanced Retailers Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche: ${error instanceof Error ? error.message : String(error)}\n`);
          // Auch bei Exceptions Progress auf 100% setzen (API-Call abgeschlossen)
          setTimeout(() => {
            updateAiProgress('haendler', 'completed', 100);
          }, 500);
        }
        
      } else {
        // Fallback: Normale Suchen ohne Kontext
        setExtractionLog((prev) => prev + "⚠️ Kein Produkt-Kontext verfügbar - verwende ALTE STANDARD-SUCHE\n");
        await startSpaltenExtraction("dokumente", currentUrl);
        await startSpaltenExtraction("haendler", currentUrl);
      }
    } catch (error) {
      console.error('Enhanced Search Error:', error);
      setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Suche: ${error instanceof Error ? error.message : String(error)}\n`);
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
    
    // Progress Bars zurücksetzen
    resetAllProgress();
    
    // Kurz warten, dann sicherstellen dass Progress wirklich bei 0% ist
    setTimeout(() => {
      console.log('🔄 Final reset to 0% for all columns');
      setSpaltenProgress({
        produkt: 0,
        parameter: 0,
        dokumente: 0,
        haendler: 0,
        erfahrung: 0,
        erfassung: 0,
      });
    }, 100);
    
    // Produkt/Parameter Progress: SOFORT auf 25% (wie bei Händler)
    console.log('🚀🚀🚀 CRITICAL: Starting AI Progress for produkt & parameter (RESELLER)');
    console.log('🚀🚀🚀 CALLING updateAiProgress for PRODUKT');
    updateAiProgress('produkt', 'prompt_sent', 25);
    console.log('🚀🚀🚀 CALLING updateAiProgress for PARAMETER');
    updateAiProgress('parameter', 'prompt_sent', 25);
    console.log('🚀🚀🚀 BOTH updateAiProgress CALLS COMPLETED');
    
    // Animation verzögert starten (wie bei Händler)
    setTimeout(() => {
      console.log('🎬🎬🎬 ANIMATION TIMEOUT: Starting animation for produkt & parameter (25% → 50%)');
      console.log('🎬 CALLING updateAiProgress WAITING for PRODUKT');
      updateAiProgress('produkt', 'waiting', 25);
      console.log('🎬 CALLING updateAiProgress WAITING for PARAMETER');
      updateAiProgress('parameter', 'waiting', 25);
      console.log('🎬 CALLING animateProgressWhileWaiting');
      animateProgressWhileWaiting(['produkt', 'parameter'], 25, 50, 3000);
    }, 100);
    
    const stage1Promises = [
      startSpaltenExtraction("produkt", currentUrl),
      startSpaltenExtraction("parameter", currentUrl)
    ];
    
    const stage1Results = await Promise.all(stage1Promises);
    
    // Animation SOFORT und EXPLIZIT stoppen
    console.log('🛑 STOPPING animations for produkt & parameter');
    stopAnimation('produkt');
    stopAnimation('parameter');
    
    // Antwort erhalten: 75%
    console.log('📈 Setting produkt & parameter to 75% (response received)');
    updateAiProgress('produkt', 'response_received', 75);
    updateAiProgress('parameter', 'response_received', 75);
    
    // Kurz warten, dann auf 100%
    setTimeout(() => {
      console.log('✅ Setting produkt & parameter to 100% (completed)');
      updateAiProgress('produkt', 'completed', 100);
      updateAiProgress('parameter', 'completed', 100);
    }, 500);
    
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
            if (field === 'produkt_hersteller' && value) manufacturer = String(value);
            if (field === 'produkt_name_modell' && value) productName = String(value);
            if (field === 'produkt_code_id' && value) productCode = String(value);
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
            
            // Animation stoppen und finale Progress setzen
            stopAnimation('dokumente');
            updateAiProgress('dokumente', 'response_received', 75);
            
            // Verarbeite die Ergebnisse
            if (documentsResult.data) {
              const updates = {};
              Object.entries(documentsResult.data).forEach(([field, fieldData]) => {
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                  const value = fieldData.value;
                  if (value && value !== '') {
                    (updates as any)[field] = value;
                    console.log(`Setze ${field} = "${value}"`);
                  }
                }
              });
              
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData, true); // Preserve AI progress during enhanced search
                return newData;
              });
              
              setExtractionLog((prev) => prev + `🎯 Erweiterte Dokumente-Suche: ${Object.keys(updates).length} Dokumente gefunden\n`);
            } else {
              // Auch bei leeren Ergebnissen (aber erfolgreicher API-Antwort) Progress auf 100%
              setExtractionLog((prev) => prev + `🎯 Erweiterte Dokumente-Suche: 0 Dokumente gefunden (leere Antwort)\n`);
            }
            
            // Felder befüllt: 100% (egal ob Daten gefunden oder nicht)
            setTimeout(() => {
              updateAiProgress('dokumente', 'completed', 100);
            }, 500);
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche\n`);
            // Auch bei Fehlern Progress auf 100% setzen (API-Call abgeschlossen)
            setTimeout(() => {
              updateAiProgress('dokumente', 'completed', 100);
            }, 500);
          }
        } catch (error) {
          console.error('Enhanced Documents Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Dokumente-Suche: ${error instanceof Error ? error.message : String(error)}\n`);
          // Auch bei Exceptions Progress auf 100% setzen (API-Call abgeschlossen)
          setTimeout(() => {
            updateAiProgress('dokumente', 'completed', 100);
          }, 500);
        }
        
        // PHASE 2B: Erweiterte Händler-Suche mit Web-Suche
        setExtractionLog((prev) => prev + "\n🏪 PHASE 2B: HÄNDLER-SUCHE (mit Web-Suche) - NEUE ERWEITERTE API...\n");
        
        // Händler Progress: Prompt gesendet (25%)
        updateAiProgress('haendler', 'prompt_sent', 25);
        setTimeout(() => {
          updateAiProgress('haendler', 'waiting', 25);
          animateProgressWhileWaiting(['haendler'], 25, 50, 3000);
        }, 100);
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
            
            // Animation stoppen und finale Progress setzen
            stopAnimation('haendler');
            updateAiProgress('haendler', 'response_received', 75);
            
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
                    (updates as any)[field] = value;
                    setExtractionLog((prev) => prev + `✅ Feld "${field}" gesetzt: ${Array.isArray(value) ? `${value.length} Einträge` : value}\n`);
                  }
                }
              });
              
              // Spezielle Behandlung für weitere Händler
              if ((updates as any).haendler_weitere_haendler_und_preise && Array.isArray((updates as any).haendler_weitere_haendler_und_preise)) {
                const existingRetailers = (formData as any).haendler_weitere_haendler_und_preise || [];
                const newRetailers = (updates as any).haendler_weitere_haendler_und_preise;
                const allRetailers = [...existingRetailers, ...newRetailers];
                (updates as any).haendler_weitere_haendler_und_preise = allRetailers;
                setExtractionLog((prev) => prev + `🏪 ${newRetailers.length} weitere Händler gefunden: ${newRetailers.map((r: any) => `${r.name} (${r.price || 'Kein Preis'})`).join(', ')}\n`);
              }
              setFormData((prev) => {
                const newData = { ...prev, ...updates };
                updateAllProgress(newData, true); // Preserve AI progress during enhanced search
                return newData;
              });
              setExtractionLog((prev) => prev + `🎯 Erweiterte Händler-Suche: ${Object.keys(updates).length} Felder aktualisiert\n`);
            } else {
              // Auch bei leeren Ergebnissen (aber erfolgreicher API-Antwort) Progress auf 100%
              setExtractionLog((prev) => prev + `🎯 Erweiterte Händler-Suche: 0 Felder aktualisiert (leere Antwort)\n`);
            }
            
            // Felder befüllt: 100% (egal ob Daten gefunden oder nicht)
            setTimeout(() => {
              updateAiProgress('haendler', 'completed', 100);
            }, 500);
          } else {
            setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche\n`);
            // Auch bei Fehlern Progress auf 100% setzen (API-Call abgeschlossen)
            setTimeout(() => {
              updateAiProgress('haendler', 'completed', 100);
            }, 500);
          }
        } catch (error) {
          console.error('Enhanced Retailers Search Error:', error);
          setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Händler-Suche: ${error instanceof Error ? error.message : String(error)}\n`);
          // Auch bei Exceptions Progress auf 100% setzen (API-Call abgeschlossen)
          setTimeout(() => {
            updateAiProgress('haendler', 'completed', 100);
          }, 500);
        }
        
      } else {
        // Fallback: Normale Suchen ohne Kontext
        setExtractionLog((prev) => prev + "⚠️ Kein Produkt-Kontext verfügbar - verwende ALTE STANDARD-SUCHE\n");
        await startSpaltenExtraction("dokumente", currentUrl);
        await startSpaltenExtraction("haendler", currentUrl);
      }
    } catch (error) {
      console.error('Enhanced Search Error:', error);
      setExtractionLog((prev) => prev + `❌ Fehler bei erweiterter Suche: ${error instanceof Error ? error.message : String(error)}\n`);
    }
    
    setExtractionLog((prev) => prev + "\n=== HÄNDLER-ANALYSE ABGESCHLOSSEN ===");
  }, [currentUrl, startSpaltenExtraction]);

  // Save to Database Function
  const handleSaveToDatabase = useCallback(async () => {
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Validate form data
      const { isValid, errors } = validateForm();
      if (!isValid) {
        setSaveError(`Validierungsfehler: ${errors.join(', ')}`);
        return;
      }

      // Convert form data to database format
      const productData = toProductData();
      
      // Add current URL and timestamp
      productData.source_url = currentUrl;
      productData.source_type = formData.erfassung_erfassung_fuer || 'Deutschland';
      productData.erfassung_erfassungsdatum = new Date().toISOString();
      productData.erfassung_quell_url = currentUrl;
      
      // Save to database
      const newProduct = await createProduct(productData);
      
      if (newProduct) {
        setSaveSuccess(true);
        setExtractionLog((prev) => prev + `\n✅ PRODUKT ERFOLGREICH GESPEICHERT!\n`);
        setExtractionLog((prev) => prev + `📄 Product ID: ${newProduct.id}\n`);
        setExtractionLog((prev) => prev + `🏷️ Name: ${newProduct.produkt_name_modell || 'Unbekannt'}\n`);
        setExtractionLog((prev) => prev + `🏭 Hersteller: ${newProduct.produkt_hersteller || 'Unbekannt'}\n\n`);
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        setSaveError('Fehler beim Speichern in der Datenbank');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setSaveError(errorMessage);
      setExtractionLog((prev) => prev + `\n❌ SPEICHER-FEHLER: ${errorMessage}\n`);
    }
  }, [formData, currentUrl, validateForm, toProductData, createProduct]);

  // Screenshot Zoom Handlers
  const openImageZoom = useCallback((imageUrl: string) => {
    setZoomedImageUrl(imageUrl);
    setIsImageZoomOpen(true);
  }, []);

  const closeImageZoom = useCallback(() => {
    setIsImageZoomOpen(false);
    setZoomedImageUrl('');
  }, []);

  // ESC Key Handler für Modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isImageZoomOpen) {
        closeImageZoom();
      }
    };

    if (isImageZoomOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Body scroll deaktivieren wenn Modal offen
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isImageZoomOpen, closeImageZoom]);

  // KI Screenshot Analysis Function
  const handleScreenshotAnalysis = useCallback(async () => {
    if (!currentCapture?.screenshot_url || !currentUrl) {
      setExtractionLog((prev) => prev + `\n❌ KI-Analyse nicht möglich: Screenshot oder URL fehlt\n`);
      return;
    }

    setIsAnalyzing(true);
    setExtractionLog((prev) => prev + `\n🤖 STARTE KI-SCREENSHOT-ANALYSE...\n`);

    try {
      // Fetch screenshot as base64
      const screenshotResponse = await fetch(currentCapture.screenshot_url);
      const screenshotBlob = await screenshotResponse.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(screenshotBlob);
      });
      
      // Remove data:image/...;base64, prefix
      const base64Data = base64.split(',')[1];

      // Determine source type based on current form data or URL
      const sourceType = formData.erfassung_erfassung_fuer === 'Deutschland' ? 'reseller' : 'manufacturer';

      // Call AI analysis API
      const analysisResponse = await fetch('/api/extraction/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: currentUrl,
          screenshotBase64: base64Data,
          sourceType
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`AI analysis failed: ${analysisResponse.statusText}`);
      }

      const analysisResult = await analysisResponse.json();
      
      if (analysisResult.success && analysisResult.data) {
        // Process extracted data and prepare for user review
        const analysisResults: any = {};
        
        Object.entries(analysisResult.data).forEach(([field, fieldData]: [string, any]) => {
          if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
            const value = fieldData.value;
            const confidence = fieldData.confidence || 0.5;
            
            if (value && value !== '') {
              // Map AI fields to form fields
              const fieldMapping: { [key: string]: string } = {
                'product_name': 'produkt_name_modell',
                'manufacturer': 'produkt_hersteller',
                'price': 'haendler_preis',
                'description': 'produkt_beschreibung',
                'specifications': 'parameter_masse'
              };
              
              const formField = fieldMapping[field];
              if (formField) {
                const currentValue = formData[formField];
                const shouldUpdate = shouldUpdateField(formField, currentValue, value, confidence);
                
                analysisResults[formField] = {
                  currentValue,
                  newValue: value,
                  confidence,
                  shouldUpdate,
                  fieldName: formField
                };
                
                setExtractionLog((prev) => prev + `🔍 KI-Analyse: ${formField} gefunden (Konfidenz: ${(confidence * 100).toFixed(0)}%)\n`);
              }
            }
          }
        });

        // Show analysis results table for user review
        if (Object.keys(analysisResults).length > 0) {
          setAiAnalysisResults(analysisResults);
          setShowAnalysisTable(true);
          // Close screenshot modal when analysis table opens
          setIsImageZoomOpen(false);
          setExtractionLog((prev) => prev + `📊 KI-ANALYSE ERFOLGREICH: ${Object.keys(analysisResults).length} Felder zur Überprüfung bereit\n`);
        } else {
          setExtractionLog((prev) => prev + `⚠️ KI-Analyse: Keine verwertbaren Daten gefunden\n`);
        }
      } else {
        throw new Error('AI analysis returned no data');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setExtractionLog((prev) => prev + `❌ KI-ANALYSE-FEHLER: ${errorMessage}\n`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentCapture, currentUrl, formData.erfassung_erfassung_fuer, updateAllProgress]);

  // Confidence-based field update decision
  const shouldUpdateField = useCallback((fieldName: string, currentValue: any, newValue: any, confidence: number): boolean => {
    // If field is empty, always update
    if (!currentValue || currentValue === '') {
      return true;
    }

    // Field-specific confidence thresholds and rules
    const fieldRules = {
      'produkt_name_modell': {
        minConfidence: 0.7,
        urlAdvantage: 0.2, // URL extraction gets +20% confidence bonus
        lengthBonus: 0.1 // Longer names get +10% confidence bonus
      },
      'produkt_hersteller': {
        minConfidence: 0.6,
        urlAdvantage: 0.15
      },
      'haendler_preis': {
        minConfidence: 0.8,
        urlAdvantage: 0.25, // URL prices are usually more accurate
        numericBonus: 0.1 // Numeric values get +10% confidence
      },
      'produkt_beschreibung': {
        minConfidence: 0.6,
        screenshotAdvantage: 0.2, // Screenshot descriptions are usually more complete
        lengthBonus: 0.15, // Longer descriptions get +15% confidence
        structureBonus: 0.1 // Structured text gets +10% confidence
      },
      'parameter_masse': {
        minConfidence: 0.7,
        screenshotAdvantage: 0.25, // Technical specs better visible in screenshot
        structureBonus: 0.15
      }
    };

    const rules = fieldRules[fieldName as keyof typeof fieldRules];
    if (!rules) {
      // Default rule for unknown fields
      return confidence > 0.6;
    }

    // Calculate adjusted confidence
    let adjustedConfidence = confidence;

    // Apply field-specific advantages
    if (fieldName === 'produkt_beschreibung' || fieldName === 'parameter_masse') {
      adjustedConfidence += rules.screenshotAdvantage || 0;
    } else {
      adjustedConfidence += rules.urlAdvantage || 0;
    }

    // Apply length bonus for text fields
    if (fieldName === 'produkt_beschreibung' || fieldName === 'produkt_name_modell') {
      const currentLength = String(currentValue).length;
      const newLength = String(newValue).length;
      
      if (newLength > currentLength) {
        adjustedConfidence += rules.lengthBonus || 0;
      }
    }

    // Apply numeric bonus for price fields
    if (fieldName === 'haendler_preis') {
      const isNumeric = /^\d+([.,]\d+)?$/.test(String(newValue));
      if (isNumeric) {
        adjustedConfidence += rules.numericBonus || 0;
      }
    }

    // Apply structure bonus for well-formatted text
    if (fieldName === 'produkt_beschreibung' || fieldName === 'parameter_masse') {
      const hasStructure = /[•\-\*]|^[A-Z][a-z]+:|^\d+\./.test(String(newValue));
      if (hasStructure) {
        adjustedConfidence += rules.structureBonus || 0;
      }
    }

    // Cap confidence at 1.0
    adjustedConfidence = Math.min(adjustedConfidence, 1.0);

    // Decision logic
    const shouldUpdate = adjustedConfidence >= rules.minConfidence;

    // Log decision details
    setExtractionLog((prev) => prev + `🔍 Konfidenz-Analyse ${fieldName}: Basis=${(confidence * 100).toFixed(0)}%, Angepasst=${(adjustedConfidence * 100).toFixed(0)}%, Schwellwert=${(rules.minConfidence * 100).toFixed(0)}%, Update=${shouldUpdate ? 'JA' : 'NEIN'}\n`);

    return shouldUpdate;
  }, []);

  // Handle field selection in analysis table
  const handleFieldSelection = useCallback((fieldName: string, value: any) => {
    setSelectedValues((prev) => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Close analysis table and apply selected values
  const closeAnalysisTable = useCallback(() => {
    // Apply all selected values
    if (Object.keys(selectedValues).length > 0) {
      setFormData((prev) => {
        const newData = { ...prev, ...selectedValues };
        updateAllProgress(newData, true);
        return newData;
      });
      
      setExtractionLog((prev) => prev + `✅ ${Object.keys(selectedValues).length} Felder übernommen: ${Object.entries(selectedValues).map(([field, value]) => `${field}="${value}"`).join(', ')}\n`);
    }
    
    setShowAnalysisTable(false);
    setAiAnalysisResults(null);
    setSelectedValues({});
    setExtractionLog((prev) => prev + `📊 KI-Analyse-Tabelle geschlossen\n`);
  }, [selectedValues, updateAllProgress]);

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
                        className="w-full grow shrink-0 basis-0 rounded-md border border-solid border-neutral-border object-cover shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                        src={currentCapture.thumbnail_url}
                        alt="Produkt Thumbnail"
                        onClick={() => openImageZoom(currentCapture.thumbnail_url || currentCapture.screenshot_url)}
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
                  iconRight={
                    lockedFields.has('produkt_hersteller') ? 
                      <FeatherLock onClick={() => toggleFieldLock('produkt_hersteller')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('produkt_hersteller')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_hersteller}
                    onChange={(e) => handleFormChange('produkt_hersteller', e.target.value)}
                    disabled={lockedFields.has('produkt_hersteller')}
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
                  iconRight={
                    lockedFields.has('produkt_name_modell') ? 
                      <FeatherLock onClick={() => toggleFieldLock('produkt_name_modell')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('produkt_name_modell')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_name_modell}
                    onChange={(e) => handleFormChange('produkt_name_modell', e.target.value)}
                    disabled={lockedFields.has('produkt_name_modell')}
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
                  iconRight={
                    lockedFields.has('produkt_produktlinie_serie') ? 
                      <FeatherLock onClick={() => toggleFieldLock('produkt_produktlinie_serie')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('produkt_produktlinie_serie')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_produktlinie_serie}
                    onChange={(e) => handleFormChange('produkt_produktlinie_serie', e.target.value)}
                    disabled={lockedFields.has('produkt_produktlinie_serie')}
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
                  iconRight={
                    lockedFields.has('produkt_code_id') ? 
                      <FeatherLock onClick={() => toggleFieldLock('produkt_code_id')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('produkt_code_id')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_code_id}
                    onChange={(e) => handleFormChange('produkt_code_id', e.target.value)}
                    disabled={lockedFields.has('produkt_code_id')}
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
                  iconRight={
                    lockedFields.has('produkt_anwendungsbereich') ? 
                      <FeatherLock onClick={() => toggleFieldLock('produkt_anwendungsbereich')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('produkt_anwendungsbereich')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_anwendungsbereich}
                    onChange={(e) => handleFormChange('produkt_anwendungsbereich', e.target.value)}
                    disabled={lockedFields.has('produkt_anwendungsbereich')}
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
                  iconRight={
                    lockedFields.has('produkt_hersteller_webseite') ? 
                      <FeatherLock onClick={() => toggleFieldLock('produkt_hersteller_webseite')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('produkt_hersteller_webseite')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_hersteller_webseite}
                    onChange={(e) => handleFormChange('produkt_hersteller_webseite', e.target.value)}
                    disabled={lockedFields.has('produkt_hersteller_webseite')}
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
                  iconRight={
                    lockedFields.has('produkt_hersteller_produkt_url') ? 
                      <FeatherLock onClick={() => toggleFieldLock('produkt_hersteller_produkt_url')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('produkt_hersteller_produkt_url')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.produkt_hersteller_produkt_url}
                    onChange={(e) => handleFormChange('produkt_hersteller_produkt_url', e.target.value)}
                    disabled={lockedFields.has('produkt_hersteller_produkt_url')}
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
                  iconRight={
                    lockedFields.has('parameter_masse') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_masse')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_masse')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_masse}
                    onChange={(e) => handleFormChange('parameter_masse', e.target.value)}
                    disabled={lockedFields.has('parameter_masse')}
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
                  iconRight={
                    lockedFields.has('parameter_farbe') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_farbe')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_farbe')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_farbe}
                    onChange={(e) => handleFormChange('parameter_farbe', e.target.value)}
                    disabled={lockedFields.has('parameter_farbe')}
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
                  iconRight={
                    lockedFields.has('parameter_hauptmaterial') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_hauptmaterial')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_hauptmaterial')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_hauptmaterial}
                    onChange={(e) => handleFormChange('parameter_hauptmaterial', e.target.value)}
                    disabled={lockedFields.has('parameter_hauptmaterial')}
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
                  iconRight={
                    lockedFields.has('parameter_oberflaeche') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_oberflaeche')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_oberflaeche')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_oberflaeche}
                    onChange={(e) => handleFormChange('parameter_oberflaeche', e.target.value)}
                    disabled={lockedFields.has('parameter_oberflaeche')}
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
                  iconRight={
                    lockedFields.has('parameter_gewicht_pro_einheit') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_gewicht_pro_einheit')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_gewicht_pro_einheit')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_gewicht_pro_einheit}
                    onChange={(e) => handleFormChange('parameter_gewicht_pro_einheit', e.target.value)}
                    disabled={lockedFields.has('parameter_gewicht_pro_einheit')}
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
                  iconRight={
                    lockedFields.has('parameter_feuerwiderstand') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_feuerwiderstand')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_feuerwiderstand')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_feuerwiderstand}
                    onChange={(e) => handleFormChange('parameter_feuerwiderstand', e.target.value)}
                    disabled={lockedFields.has('parameter_feuerwiderstand')}
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
                  iconRight={
                    lockedFields.has('parameter_waermeleitfaehigkeit') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_waermeleitfaehigkeit')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_waermeleitfaehigkeit')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_waermeleitfaehigkeit}
                    onChange={(e) => handleFormChange('parameter_waermeleitfaehigkeit', e.target.value)}
                    disabled={lockedFields.has('parameter_waermeleitfaehigkeit')}
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
                  iconRight={
                    lockedFields.has('parameter_u_wert') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_u_wert')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_u_wert')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_u_wert}
                    onChange={(e) => handleFormChange('parameter_u_wert', e.target.value)}
                    disabled={lockedFields.has('parameter_u_wert')}
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
                  iconRight={
                    lockedFields.has('parameter_schalldaemmung') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_schalldaemmung')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_schalldaemmung')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_schalldaemmung}
                    onChange={(e) => handleFormChange('parameter_schalldaemmung', e.target.value)}
                    disabled={lockedFields.has('parameter_schalldaemmung')}
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
                  iconRight={
                    lockedFields.has('parameter_wasserbestaendigkeit') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_wasserbestaendigkeit')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_wasserbestaendigkeit')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_wasserbestaendigkeit}
                    onChange={(e) => handleFormChange('parameter_wasserbestaendigkeit', e.target.value)}
                    disabled={lockedFields.has('parameter_wasserbestaendigkeit')}
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
                  iconRight={
                    lockedFields.has('parameter_dampfdiffusion') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_dampfdiffusion')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_dampfdiffusion')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_dampfdiffusion}
                    onChange={(e) => handleFormChange('parameter_dampfdiffusion', e.target.value)}
                    disabled={lockedFields.has('parameter_dampfdiffusion')}
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
                  iconRight={
                    lockedFields.has('parameter_einbauart') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_einbauart')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_einbauart')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_einbauart}
                    onChange={(e) => handleFormChange('parameter_einbauart', e.target.value)}
                    disabled={lockedFields.has('parameter_einbauart')}
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
                  iconRight={
                    lockedFields.has('parameter_wartung') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_wartung')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_wartung')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_wartung}
                    onChange={(e) => handleFormChange('parameter_wartung', e.target.value)}
                    disabled={lockedFields.has('parameter_wartung')}
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
                  iconRight={
                    lockedFields.has('parameter_umweltzertifikat') ? 
                      <FeatherLock onClick={() => toggleFieldLock('parameter_umweltzertifikat')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('parameter_umweltzertifikat')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.parameter_umweltzertifikat}
                    onChange={(e) => handleFormChange('parameter_umweltzertifikat', e.target.value)}
                    disabled={lockedFields.has('parameter_umweltzertifikat')}
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
                  iconRight={
                    lockedFields.has('dokumente_datenblatt') ? 
                      <FeatherLock onClick={() => toggleFieldLock('dokumente_datenblatt')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('dokumente_datenblatt')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_datenblatt}
                    onChange={(e) => handleFormChange('dokumente_datenblatt', e.target.value)}
                    disabled={lockedFields.has('dokumente_datenblatt')}
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
                  iconRight={
                    lockedFields.has('dokumente_technisches_merkblatt') ? 
                      <FeatherLock onClick={() => toggleFieldLock('dokumente_technisches_merkblatt')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('dokumente_technisches_merkblatt')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_technisches_merkblatt}
                    onChange={(e) => handleFormChange('dokumente_technisches_merkblatt', e.target.value)}
                    disabled={lockedFields.has('dokumente_technisches_merkblatt')}
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
                  iconRight={
                    lockedFields.has('dokumente_produktkatalog') ? 
                      <FeatherLock onClick={() => toggleFieldLock('dokumente_produktkatalog')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('dokumente_produktkatalog')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_produktkatalog}
                    onChange={(e) => handleFormChange('dokumente_produktkatalog', e.target.value)}
                    disabled={lockedFields.has('dokumente_produktkatalog')}
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
                  iconRight={
                    lockedFields.has('dokumente_weitere_dokumente') ? 
                      <FeatherLock onClick={() => toggleFieldLock('dokumente_weitere_dokumente')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('dokumente_weitere_dokumente')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_weitere_dokumente}
                    onChange={(e) => handleFormChange('dokumente_weitere_dokumente', e.target.value)}
                    disabled={lockedFields.has('dokumente_weitere_dokumente')}
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
                  iconRight={
                    lockedFields.has('dokumente_bim_cad_technische_zeichnungen') ? 
                      <FeatherLock onClick={() => toggleFieldLock('dokumente_bim_cad_technische_zeichnungen')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('dokumente_bim_cad_technische_zeichnungen')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dokumente_bim_cad_technische_zeichnungen}
                    onChange={(e) => handleFormChange('dokumente_bim_cad_technische_zeichnungen', e.target.value)}
                    disabled={lockedFields.has('dokumente_bim_cad_technische_zeichnungen')}
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
                  iconRight={
                    lockedFields.has('haendler_haendlername') ? 
                      <FeatherLock onClick={() => toggleFieldLock('haendler_haendlername')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('haendler_haendlername')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_haendlername}
                    onChange={(e) => handleFormChange('haendler_haendlername', e.target.value)}
                    disabled={lockedFields.has('haendler_haendlername')}
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
                  iconRight={
                    lockedFields.has('haendler_haendler_webseite') ? 
                      <FeatherLock onClick={() => toggleFieldLock('haendler_haendler_webseite')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('haendler_haendler_webseite')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_haendler_webseite}
                    onChange={(e) => handleFormChange('haendler_haendler_webseite', e.target.value)}
                    disabled={lockedFields.has('haendler_haendler_webseite')}
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
                  iconRight={
                    lockedFields.has('haendler_haendler_produkt_url') ? 
                      <FeatherLock onClick={() => toggleFieldLock('haendler_haendler_produkt_url')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('haendler_haendler_produkt_url')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_haendler_produkt_url}
                    onChange={(e) => handleFormChange('haendler_haendler_produkt_url', e.target.value)}
                    disabled={lockedFields.has('haendler_haendler_produkt_url')}
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
                  iconRight={
                    lockedFields.has('haendler_verfuegbarkeit') ? 
                      <FeatherLock onClick={() => toggleFieldLock('haendler_verfuegbarkeit')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('haendler_verfuegbarkeit')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_verfuegbarkeit}
                    onChange={(e) => handleFormChange('haendler_verfuegbarkeit', e.target.value)}
                    disabled={lockedFields.has('haendler_verfuegbarkeit')}
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
                  iconRight={
                    lockedFields.has('haendler_einheit') ? 
                      <FeatherLock onClick={() => toggleFieldLock('haendler_einheit')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('haendler_einheit')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.haendler_einheit}
                    onChange={(e) => handleFormChange('haendler_einheit', e.target.value)}
                    disabled={lockedFields.has('haendler_einheit')}
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
                  iconRight={
                    lockedFields.has('haendler_preis') ? 
                      <FeatherLock onClick={() => toggleFieldLock('haendler_preis')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('haendler_preis')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    className="text-right"
                    placeholder="€ 123,00"
                    value={formData.haendler_preis}
                    onChange={(e) => handleFormChange('haendler_preis', e.target.value)}
                    disabled={lockedFields.has('haendler_preis')}
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
                  iconRight={
                    lockedFields.has('haendler_preis_pro_einheit') ? 
                      <FeatherLock onClick={() => toggleFieldLock('haendler_preis_pro_einheit')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('haendler_preis_pro_einheit')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    className="text-right"
                    placeholder="€ 123,00"
                    value={formData.haendler_preis_pro_einheit}
                    onChange={(e) => handleFormChange('haendler_preis_pro_einheit', e.target.value)}
                    disabled={lockedFields.has('haendler_preis_pro_einheit')}
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
                                <span className="grow shrink-0 basis-0 text-body font-body text-neutral-700">
                                  {retailer.name}
                                </span>
                                {retailer.website && (
                                  <span className="grow shrink-0 basis-0 text-caption font-caption text-neutral-400">
                                    {retailer.website}
                                  </span>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex flex-col items-end">
                                <span className="grow shrink-0 basis-0 text-body font-body text-neutral-700 text-right">
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
                            <span className="grow shrink-0 basis-0 text-body font-body text-neutral-400 text-center">
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
                  iconRight={
                    lockedFields.has('erfahrung_muster_bestellt') ? 
                      <FeatherLock onClick={() => toggleFieldLock('erfahrung_muster_bestellt')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('erfahrung_muster_bestellt')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.erfahrung_muster_bestellt}
                    onChange={(e) => handleFormChange('erfahrung_muster_bestellt', e.target.value)}
                    disabled={lockedFields.has('erfahrung_muster_bestellt')}
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
                  iconRight={
                    lockedFields.has('erfahrung_muster_abgelegt') ? 
                      <FeatherLock onClick={() => toggleFieldLock('erfahrung_muster_abgelegt')} style={{cursor: 'pointer'}} /> : 
                      <FeatherPenLine onClick={() => toggleFieldLock('erfahrung_muster_abgelegt')} style={{cursor: 'pointer'}} />
                  }
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.erfahrung_muster_abgelegt}
                    onChange={(e) => handleFormChange('erfahrung_muster_abgelegt', e.target.value)}
                    disabled={lockedFields.has('erfahrung_muster_abgelegt')}
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
                  <ToggleGroup.Item {...({ value: "1" } as any)}>1</ToggleGroup.Item>
                  <ToggleGroup.Item {...({ value: "2" } as any)}>2</ToggleGroup.Item>
                  <ToggleGroup.Item {...({ value: "3" } as any)}>3</ToggleGroup.Item>
                  <ToggleGroup.Item {...({ value: "4" } as any)}>4</ToggleGroup.Item>
                  <ToggleGroup.Item {...({ value: "5" } as any)}>5</ToggleGroup.Item>
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
                    onClick={() => openImageZoom(currentCapture.screenshot_url)}
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
      
      {/* Screenshot Zoom Modal */}
      {isImageZoomOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageZoom}
        >
          <div 
            className="relative max-w-[95vw] max-h-[95vh] bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all z-10"
              onClick={closeImageZoom}
              aria-label="Schließen"
            >
              ✕
            </button>
            
            {/* KI Analysis Button */}
            <button
              className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all z-10 flex items-center gap-2"
              onClick={handleScreenshotAnalysis}
              disabled={isAnalyzing}
              aria-label="KI Screenshot Analyse"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analysiere...
                </>
              ) : (
                <>
                  🤖 KI-Analyse
                </>
              )}
            </button>
            
            {/* Zoomed Image */}
            <img
              className="max-w-full max-h-full object-contain"
              src={zoomedImageUrl}
              alt="Screenshot Zoom"
              onError={(e) => {
                e.currentTarget.src = "https://res.cloudinary.com/subframe/image/upload/v1753745144/uploads/15448/eec2lucgs06zsgxjfdgb.png";
              }}
            />
            
            {/* ESC Hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              ESC zum Schließen
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Results Table */}
      {showAnalysisTable && aiAnalysisResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-border">
            {/* Header */}
            <div className="bg-neutral-50 border-b border-neutral-border p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-neutral-900">🤖 KI-Screenshot-Analyse Ergebnisse</h2>
              <button
                onClick={closeAnalysisTable}
                className="text-neutral-500 hover:text-neutral-700 text-2xl font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Table */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
              <div className="mb-6 text-sm text-neutral-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                💡 <strong>Anleitung:</strong> Klicke auf einen Wert (aktuell oder KI-Vorschlag), um ihn auszuwählen. 
                Ausgewählte Werte werden farblich hervorgehoben. Beim Schließen werden alle ausgewählten Werte übernommen.
              </div>
              
              <div className="grid gap-6">
                {Object.entries(aiAnalysisResults).map(([fieldName, data]: [string, any]) => {
                  const isCurrentSelected = selectedValues[fieldName] === data.currentValue;
                  const isNewSelected = selectedValues[fieldName] === data.newValue;
                  
                  return (
                    <div key={fieldName} className="border border-neutral-border rounded-lg p-4 bg-neutral-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-neutral-900 capitalize">
                          {fieldName.replace(/_/g, ' ')}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          data.shouldUpdate 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          Konfidenz: {(data.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Current Value */}
                        <div>
                          <div className="text-sm font-medium text-neutral-700 mb-2">Aktueller Wert:</div>
                          <div 
                            className={`p-3 border rounded-lg text-sm min-h-[80px] flex items-center cursor-pointer transition-all ${
                              isCurrentSelected 
                                ? 'bg-blue-50 border-blue-300 shadow-md' 
                                : 'bg-white border-neutral-border hover:bg-neutral-50 hover:border-neutral-300'
                            }`}
                            onClick={() => handleFieldSelection(fieldName, data.currentValue)}
                            title="Klicke um diesen Wert auszuwählen"
                          >
                            {data.currentValue || (
                              <span className="text-neutral-400 italic">Leer</span>
                            )}
                          </div>
                        </div>
                        
                        {/* New Value */}
                        <div>
                          <div className="text-sm font-medium text-neutral-700 mb-2">KI-Vorschlag:</div>
                          <div 
                            className={`p-3 border rounded-lg text-sm min-h-[80px] flex items-center cursor-pointer transition-all ${
                              isNewSelected 
                                ? 'bg-blue-50 border-blue-300 shadow-md' 
                                : data.shouldUpdate 
                                  ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                                  : 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                            }`}
                            onClick={() => handleFieldSelection(fieldName, data.newValue)}
                            title="Klicke um diesen Wert auszuwählen"
                          >
                            {data.newValue}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-neutral-500 flex items-center gap-2">
                        {data.shouldUpdate 
                          ? '✅ Empfohlen: KI-Vorschlag ist besser'
                          : '⚠️ Empfohlen: Aktueller Wert beibehalten'
                        }
                        {isCurrentSelected && <span className="text-blue-600">← Ausgewählt</span>}
                        {isNewSelected && <span className="text-blue-600">← Ausgewählt</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-neutral-50 border-t border-neutral-border p-4 flex justify-between items-center">
              <div className="text-sm text-neutral-600">
                {Object.keys(selectedValues).length > 0 
                  ? `${Object.keys(selectedValues).length} Felder ausgewählt`
                  : 'Keine Felder ausgewählt'
                }
              </div>
              <button
                onClick={closeAnalysisTable}
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
              >
                {Object.keys(selectedValues).length > 0 ? 'Übernehmen & Schließen' : 'Schließen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultPageLayout>
  );
}

export default Extractor;

