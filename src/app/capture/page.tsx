"use client";

import React, { useState, useEffect, useCallback } from "react";
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

// Spalten-spezifische Felddefinitionen
const SPALTEN_FELDER = {
  produkt: [
    'kategorie', 'hersteller', 'name_modell', 'produktlinie_serie', 
    'code_id', 'anwendungsbereich', 'beschreibung', 'hersteller_webseite', 
    'hersteller_produkt_url'
  ],
  parameter: [
    'masse', 'farbe', 'hauptmaterial', 'oberflaeche', 'gewicht_pro_einheit',
    'feuerwiderstand', 'waermeleitfaehigkeit', 'u_wert', 'schalldaemmung',
    'wasserbestaendigkeit', 'dampfdiffusion', 'einbauart', 'wartung', 'umweltzertifikat'
  ],
  dokumente: [
    'datenblatt', 'technisches_merkblatt', 'produktkatalog', 'weitere_dokumente',
    'bim_cad_technische_zeichnungen'
  ],
  haendler: [
    'haendlername', 'haendler_webseite', 'haendler_produkt_url', 'verfuegbarkeit',
    'einheit', 'preis', 'preis_pro_einheit'
  ]
};

function Extractor() {
  // State für jede Spalte
  const [spaltenProgress, setSpaltenProgress] = useState({
    produkt: 0,
    parameter: 0,
    dokumente: 0,
    haendler: 0,
    erfassung: 0
  });

  const [formData, setFormData] = useState({
    // Produkt-Spalte
    kategorie: '',
    hersteller: '',
    name_modell: '',
    produktlinie_serie: '',
    code_id: '',
    anwendungsbereich: '',
    beschreibung: '',
    hersteller_webseite: '',
    hersteller_produkt_url: '',
    
    // Parameter-Spalte
    masse: '',
    farbe: '',
    hauptmaterial: '',
    oberflaeche: '',
    gewicht_pro_einheit: '',
    feuerwiderstand: '',
    waermeleitfaehigkeit: '',
    u_wert: '',
    schalldaemmung: '',
    wasserbestaendigkeit: '',
    dampfdiffusion: '',
    einbauart: '',
    wartung: '',
    umweltzertifikat: '',
    
    // Dokumente-Spalte
    datenblatt: '',
    technisches_merkblatt: '',
    produktkatalog: '',
    weitere_dokumente: '',
    bim_cad_technische_zeichnungen: '',
    
    // Händler-Spalte
    haendlername: '',
    haendler_webseite: '',
    haendler_produkt_url: '',
    verfuegbarkeit: '',
    einheit: '',
    preis: '',
    preis_pro_einheit: '',
    
    // Erfahrung-Spalte (händisch)
    einsatz_in_projekt: '',
    muster_bestellt: '',
    muster_abgelegt: '',
    bewertung: '',
    bemerkungen_notizen: '',
    
    // Erfassung-Spalte
    quell_url: '',
    erfassungsdatum: '',
    erfassung_fuer: 'Deutschland',
    extraktions_log: ''
  });

  const { categories: kategorien, loading: categoriesLoading } = useMaterialCategories();
  const [currentUrl, setCurrentUrl] = useState('');
  const [extractionLog, setExtractionLog] = useState('');

  // Schrittweise Perplexity-API-Abfragen
  const startSpaltenExtraction = useCallback(async (spalte: string, url: string) => {
    const felder = SPALTEN_FELDER[spalte];
    if (!felder) return;

    setExtractionLog(prev => prev + `\n=== STARTE ${spalte.toUpperCase()}-ANALYSE ===`);
    
    try {
      const response = await fetch('/api/extraction/spalten-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          spalte, 
          felder 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update form data mit den extrahierten Werten
        const updates = {};
        Object.entries(data).forEach(([field, value]) => {
          if (value && value.value) {
            updates[field] = value.value;
          }
        });
        
        setFormData(prev => ({ ...prev, ...updates }));
        
        // Progress auf 25% setzen
        setSpaltenProgress(prev => ({ 
          ...prev, 
          [spalte]: 25,
          erfassung: Math.min(100, prev.erfassung + 25)
        }));
        
        setExtractionLog(prev => prev + `\n✅ ${spalte.toUpperCase()}-Analyse abgeschlossen`);
      }
    } catch (error) {
      setExtractionLog(prev => prev + `\n❌ Fehler bei ${spalte}-Analyse: ${error.message}`);
    }
  }, []);

  const handleManufacturerClick = useCallback(async () => {
    if (!currentUrl) return;
    
    setExtractionLog('=== STARTE HERSTELLER-ANALYSE ===\n');
    
    // Alle 4 Spalten nacheinander abfragen
    await startSpaltenExtraction('produkt', currentUrl);
    await startSpaltenExtraction('parameter', currentUrl);
    await startSpaltenExtraction('dokumente', currentUrl);
    await startSpaltenExtraction('haendler', currentUrl);
    
    setExtractionLog(prev => prev + '\n=== ALLE ANALYSEN ABGESCHLOSSEN ===');
  }, [currentUrl, startSpaltenExtraction]);

  const handleResellerClick = useCallback(async () => {
    if (!currentUrl) return;
    
    setExtractionLog('=== STARTE HÄNDLER-ANALYSE ===\n');
    
    // Alle 4 Spalten nacheinander abfragen
    await startSpaltenExtraction('produkt', currentUrl);
    await startSpaltenExtraction('parameter', currentUrl);
    await startSpaltenExtraction('dokumente', currentUrl);
    await startSpaltenExtraction('haendler', currentUrl);
    
    setExtractionLog(prev => prev + '\n=== ALLE ANALYSEN ABGESCHLOSSEN ===');
  }, [currentUrl, startSpaltenExtraction]);

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4">
          
          {/* PRODUKT-SPALTE */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"PRODUKT\n"}
              </span>
              <Progress value={spaltenProgress.produkt} />
              
              {/* Kategorie */}
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Kategorie"}
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  placeholder="Auswahl"
                  helpText=""
                  icon={<FeatherSearch />}
                  value={formData.kategorie}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, kategorie: value }))}
                >
                  {kategorien.map(kat => (
                    <Select.Item key={kat.id} value={kat.name}>{kat.name}</Select.Item>
                  ))}
                </Select>
              </div>

              {/* Hersteller */}
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
                    value={formData.hersteller}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, hersteller: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Name / Modell */}
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
                    value={formData.name_modell}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, name_modell: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Weitere Produkt-Felder... */}
              {/* Code (ID) */}
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
                    value={formData.code_id}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, code_id: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Anwendungsbereich */}
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
                    value={formData.anwendungsbereich}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, anwendungsbereich: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Beschreibung */}
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
                    value={formData.beschreibung}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData(prev => ({ ...prev, beschreibung: event.target.value }))
                    }
                  />
                </TextArea>
              </div>

              {/* Hersteller URLs */}
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
                    value={formData.hersteller_webseite}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, hersteller_webseite: event.target.value }))
                    }
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
                    value={formData.hersteller_produkt_url}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, hersteller_produkt_url: event.target.value }))
                    }
                  />
                </TextField>
              </div>
            </div>
          </div>

          {/* PARAMETER-SPALTE */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"PARAMETER"}
              </span>
              <Progress value={spaltenProgress.parameter} />
              
              {/* Parameter-Felder */}
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
                    value={formData.masse}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, masse: event.target.value }))
                    }
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
                    value={formData.farbe}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, farbe: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Weitere Parameter-Felder... */}
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
                    value={formData.hauptmaterial}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, hauptmaterial: event.target.value }))
                    }
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
                    value={formData.oberflaeche}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, oberflaeche: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Weitere Parameter-Felder... */}
            </div>
          </div>

          {/* DOKUMENTE-SPALTE */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"DOKUMENTE"}
              </span>
              <Progress value={spaltenProgress.dokumente} />
              
              {/* Dokumente-Felder */}
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
                    value={formData.datenblatt}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, datenblatt: event.target.value }))
                    }
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
                    value={formData.technisches_merkblatt}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, technisches_merkblatt: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Weitere Dokumente-Felder... */}
            </div>
          </div>

          {/* HÄNDLER-SPALTE */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"HÄNDLER"}
              </span>
              <Progress value={spaltenProgress.haendler} />
              
              {/* Händler-Felder */}
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
                    value={formData.haendlername}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, haendlername: event.target.value }))
                    }
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
                    value={formData.haendler_webseite}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, haendler_webseite: event.target.value }))
                    }
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
                    value={formData.preis}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData(prev => ({ ...prev, preis: event.target.value }))
                    }
                  />
                </TextField>
              </div>

              {/* Weitere Händler-Felder... */}
            </div>
          </div>

          {/* ERFAHRUNG-SPALTE */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"ERFAHRUNG"}
              </span>
              <Progress value={0} /> {/* Keine API-Abfrage für Erfahrung */}
              
              {/* Erfahrung-Felder (händisch) */}
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
                  value={formData.einsatz_in_projekt}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, einsatz_in_projekt: value }))}
                >
                  <Select.Item value="projekt1">Projekt 1</Select.Item>
                  <Select.Item value="projekt2">Projekt 2</Select.Item>
                </Select>
              </div>

              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Bewertung\n"}
                </span>
                <ToggleGroup
                  className="h-auto w-full flex-none"
                  value={formData.bewertung}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, bewertung: value }))}
                >
                  <ToggleGroup.Item value="1">1</ToggleGroup.Item>
                  <ToggleGroup.Item value="2">2</ToggleGroup.Item>
                  <ToggleGroup.Item value="3">3</ToggleGroup.Item>
                  <ToggleGroup.Item value="4">4</ToggleGroup.Item>
                  <ToggleGroup.Item value="5">5</ToggleGroup.Item>
                </ToggleGroup>
              </div>

              {/* Weitere Erfahrung-Felder... */}
            </div>
          </div>

          {/* ERFASSUNG-SPALTE */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2 px-2 py-2">
              <span className="w-full text-title font-title text-default-font text-center">
                ERFASSUNG
              </span>
              <Progress value={spaltenProgress.erfassung} />
              
              {/* Quell-URL */}
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
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                      setCurrentUrl(event.target.value)
                    }
                  />
                </TextField>
              </div>

              {/* Erfassung für */}
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
                  value={formData.erfassung_fuer}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, erfassung_fuer: value }))}
                >
                  <Select.Item value="Deutschland">Deutschland</Select.Item>
                  <Select.Item value="Österreich">Österreich</Select.Item>
                  <Select.Item value="Schweiz">Schweiz</Select.Item>
                </Select>
              </div>

              {/* Erfassen als Buttons */}
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

              {/* Extraktions-Log */}
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
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setExtractionLog(event.target.value)
                    }
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