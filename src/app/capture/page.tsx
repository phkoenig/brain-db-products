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
    if (!felder) return;

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
        const data = await response.json();
        
        const updates = {};
        Object.entries(data).forEach(([field, value]) => {
          if (value && value.value) {
            updates[field] = value.value;
          }
        });
        
        setFormData((prev) => {
            const newData = { ...prev, ...updates };
            updateAllProgress(newData);
            return newData;
        });
        
        setExtractionLog((prev) => prev + `\n✅ ${spalte.toUpperCase()}-Analyse abgeschlossen`);
      }
    } catch (error) {
      setExtractionLog((prev) => prev + `\n❌ Fehler bei ${spalte}-Analyse: ${error.message}`);
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
    
    await startSpaltenExtraction("produkt", currentUrl);
    await startSpaltenExtraction("parameter", currentUrl);
    await startSpaltenExtraction("dokumente", currentUrl);
    
    setExtractionLog((prev) => prev + "\n=== HERSTELLER-ANALYSE ABGESCHLOSSEN ===");
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
    
    await startSpaltenExtraction("produkt", currentUrl);
    await startSpaltenExtraction("parameter", currentUrl);
    await startSpaltenExtraction("dokumente", currentUrl);
    await startSpaltenExtraction("haendler", currentUrl);
    
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
                      <Table.Row>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500">
                            Retailer 02
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500 text-right">
                            152,59
                          </span>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500">
                            Retailer 03
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500 text-right">
                            152,59
                          </span>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500">
                            Retailer 04
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500 text-right">
                            152,59
                          </span>
                        </Table.Cell>
                      </Table.Row>
                      <Table.Row>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-pre-wrap text-body font-body text-neutral-500">
                            {"Retailer 05\n"}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500 text-right">
                            152,59
                          </span>
                        </Table.Cell>
                      </Table.Row>
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

