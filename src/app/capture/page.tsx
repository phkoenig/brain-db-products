"use client";

import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { TextField } from "@/ui/components/TextField";
import { Select } from "@/ui/components/Select";
import { FeatherSearch } from "@subframe/core";
import { Button } from "@/ui/components/Button";
import { FeatherFactory } from "@subframe/core";
import { FeatherShoppingCart } from "@subframe/core";
import { Progress } from "@/ui/components/Progress";
import { TextArea } from "@/ui/components/TextArea";
import { Table } from "@/ui/components/Table";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCaptureForm } from "@/hooks/useCaptureForm";
import { useExtraction } from "@/hooks/useExtraction";
import { supabase } from "@/lib/supabase";
import { AIAnalysisResult } from "@/lib/types/extraction";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";

function Extractor() {
  const searchParams = useSearchParams();
  const captureId = searchParams.get("capture_id");
  const [capture, setCapture] = useState<null | {
    url: string;
    screenshot_url: string;
    thumbnail_url: string;
    created_at: string;
  }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"manufacturer" | "reseller" | null>(null);
  const [country, setCountry] = useState("de");
  const [loggingMessages, setLoggingMessages] = useState<string[]>([]);
  
  const { categories, loading: categoriesLoading } = useMaterialCategories();

  // Form state management
  const {
    formData,
    updateField,
    updateFields,
    loadFromCapture,
  } = useCaptureForm();

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log("capture/page: formData changed:", formData);
  }, [formData]);

  // Extraction state management
  const {
    extractionState,
    progress,
    startExtraction,
    isExtracting,
    enhancedAnalysisData,
    openAIData,
    perplexityData,
  } = useExtraction();

  // Helper function to add logging messages
  const addLogMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLoggingMessages(prev => [...prev, logEntry]);
  };

  // Update form fields when enhanced analysis data is available
  useEffect(() => {
    if (enhancedAnalysisData) {
      addLogMessage("=== ENHANCED AI ANALYSIS RESULTS ===");
      addLogMessage("Updating form fields with fused data...");
      console.log("DEBUG: enhancedAnalysisData received:", enhancedAnalysisData);
      
      // Helper function to safely extract value from FieldData
      const getFieldValue = (fieldData: unknown): string => {
        if (!fieldData) return '';
        if (typeof fieldData === 'string') return fieldData;
        if (typeof fieldData === 'object' && fieldData !== null) {
          const obj = fieldData as any;
          if ('value' in obj && obj.value !== undefined && obj.value !== null) {
            return String(obj.value);
          }
        }
        return '';
      };

      // Helper function to safely extract confidence from FieldData
      const getFieldConfidence = (fieldData: unknown): number => {
        if (!fieldData) return 0;
        if (typeof fieldData === 'object' && fieldData !== null && 'confidence' in fieldData) {
          return Number((fieldData as { confidence: unknown }).confidence);
        }
        return 0;
      };

      // Helper function to safely extract reasoning from FieldData
      const getFieldReasoning = (fieldData: unknown): string => {
        if (!fieldData) return '';
        if (typeof fieldData === 'object' && fieldData !== null && 'reasoning' in fieldData) {
          return String((fieldData as { reasoning: unknown }).reasoning);
        }
        return '';
      };

      // Helper function to safely extract source from FieldData
      const getFieldSource = (fieldData: unknown): string => {
        if (!fieldData) return '';
        if (typeof fieldData === 'object' && fieldData !== null && 'source' in fieldData) {
          return String((fieldData as { source: unknown }).source);
        }
        return '';
      };

      // Update form fields with enhanced analysis data
      const fieldUpdates: Record<string, string> = {};
      
      Object.entries(enhancedAnalysisData).forEach(([fieldName, fieldData]) => {
        const value = getFieldValue(fieldData);
        const confidence = getFieldConfidence(fieldData);
        const source = getFieldSource(fieldData);
        const reasoning = getFieldReasoning(fieldData);

        if (value && value.trim() !== '') {
          fieldUpdates[fieldName] = value;
          addLogMessage(`${fieldName}: "${value}" (${source}, confidence: ${confidence})`);
          
          if (reasoning) {
            addLogMessage(`  Reasoning: ${reasoning}`);
          }
        }
      });

      // Apply all field updates at once
      if (Object.keys(fieldUpdates).length > 0) {
        updateFields(fieldUpdates);
        addLogMessage(`Updated ${Object.keys(fieldUpdates).length} fields with enhanced analysis data`);
      } else {
        addLogMessage("No valid field data found in enhanced analysis results");
      }

      // Log source comparison if available
      if (openAIData && perplexityData) {
        addLogMessage("=== SOURCE COMPARISON ===");
        addLogMessage(`OpenAI fields: ${Object.keys(openAIData).length}`);
        addLogMessage(`Perplexity fields: ${Object.keys(perplexityData).length}`);
        addLogMessage(`Fused fields: ${Object.keys(enhancedAnalysisData).length}`);
      }
    }
  }, [enhancedAnalysisData, updateFields]);

  // Helper function to format alternative retailers for display
  const getAlternativeRetailers = () => {
    // For now, return empty string since we're not using counterpartData anymore
    // This can be enhanced later if needed
    return '';
  };

  // Log extraction state changes
  useEffect(() => {
    if (extractionState !== 'idle') {
      const messages = {
        'scraping_primary': 'Starting HTML parsing of the source URL...',
        'analyzing_primary': 'Starting AI screenshot analysis...',
        'finding_manufacturer': 'Searching for manufacturer information...',
        'finding_retailers': 'Searching for alternative retailers...',
        'fusing_data': 'Combining all extracted data...',
        'complete': 'Extraction process completed successfully!',
        'error': 'An error occurred during extraction.'
      };
      
      if (messages[extractionState]) {
        addLogMessage(messages[extractionState]);
      }
    }
  }, [extractionState]);

  useEffect(() => {
    if (!captureId) {
      setLoading(false);
      return;
    }

    const fetchCaptureData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("captures")
          .select("url, screenshot_url, thumbnail_url, created_at")
          .eq("id", captureId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCapture(data);
          loadFromCapture(data);
          addLogMessage(`Loaded capture data for URL: ${data.url}`);
        } else {
          setError(`No capture found with ID: ${captureId}`);
        }
      } catch (err) {
        console.error("Failed to fetch capture data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCaptureData();
  }, [captureId, loadFromCapture]);
  
  // Country detection from URL
  useEffect(() => {
    if (capture?.url) {
      const tldMatch = capture.url.match(/\.([a-z]{2,})$/);
      if (tldMatch && tldMatch[1]) {
        const tld = tldMatch[1];
        const countryMap: { [key: string]: string } = {
          de: "de",
          at: "at",
          ch: "ch",
          fr: "fr",
          it: "it",
          es: "es",
          uk: "gb",
          co: "gb",
          com: "us",
          ca: "ca",
        };
        const detectedCountry = countryMap[tld] || "de";
        setCountry(detectedCountry);
        addLogMessage(`Detected country from URL: ${detectedCountry.toUpperCase()}`);
      }
    }
  }, [capture?.url]);

  const handleManufacturerClick = async () => {
    setSourceType("manufacturer");
    setError(null);
    addLogMessage("Manufacturer source type selected - starting extraction...");
    await startExtractionProcess("manufacturer");
  };

  const handleResellerClick = async () => {
    setSourceType("reseller");
    setError(null);
    addLogMessage("Reseller source type selected - starting extraction...");
    await startExtractionProcess("reseller");
  };

  const startExtractionProcess = async (selectedSourceType: "manufacturer" | "reseller") => {
    if (!capture) {
      setError("No capture data available.");
      return;
    }

    try {
      addLogMessage("=== STARTING EXTRACTION PROCESS ===");
      addLogMessage(`URL to scrape: ${capture.url}`);
      addLogMessage(`Source type: ${selectedSourceType}`);
      addLogMessage(`Country: ${country}`);

      // Step 1: URL Processing - Automatically populate URL fields based on source type
      addLogMessage("=== STEP 1: URL PROCESSING ===");
      
      // Always set source_url
      updateField('source_url', capture.url);
      addLogMessage(`Source URL set: ${capture.url}`);

      // Extract base URL (remove path and query parameters)
      const urlObj = new URL(capture.url);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      addLogMessage(`Base URL extracted: ${baseUrl}`);

      // Set URL fields based on source type
      if (selectedSourceType === "manufacturer") {
        updateField('manufacturer_product_url', capture.url);
        updateField('manufacturer_main_url', baseUrl);
        addLogMessage(`Manufacturer Product URL set: ${capture.url}`);
        addLogMessage(`Manufacturer Main URL set: ${baseUrl}`);
      } else { // reseller
        updateField('retailer_product_url', capture.url);
        updateField('retailer_main_url', baseUrl);
        addLogMessage(`Retailer Product URL set: ${capture.url}`);
        addLogMessage(`Retailer Main URL set: ${baseUrl}`);
      }

      // Step 2: Screenshot Analysis
      addLogMessage("=== STEP 2: SCREENSHOT ANALYSIS ===");
      addLogMessage("Converting screenshot to base64 format...");
      const response = await fetch(capture.screenshot_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch screenshot: ${response.status}`);
      }
      
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // Keep the full data URI as AIAnalyzer expects it
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert to base64'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });

      addLogMessage("Base64 conversion successful, starting extraction process...");

      await startExtraction(
        capture.url,
        base64,
        selectedSourceType,
        country
      );
      
      addLogMessage("Extraction process initiated successfully");
    } catch (error) {
      console.error("Failed to start extraction:", error);
      const errorMessage = `Failed to start extraction process: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      addLogMessage(`ERROR: ${errorMessage}`);
    }
  };

  // Helper function to get progress value for each step
  const getProgressValue = (step: string) => {
    if (extractionState === 'idle') return 0;
    if (extractionState === 'error') return 0;
    
    // Simplified progress calculation
    const stepOrder = ['url_processing', 'screenshot_analysis', 'url_enhancement', 'confidence_fusion', 'complete'];
    const currentIndex = stepOrder.indexOf(extractionState);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 100;
    if (stepIndex === currentIndex) return progress;
    return 0;
  };

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center">
          Loading...
        </div>
      </DefaultPageLayout>
    );
  }
  
  if (error) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full w-full items-center justify-center text-red-500">
          Error: {error}
        </div>
      </DefaultPageLayout>
    );
  } 

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2 px-2 py-2">
              <span className="w-full text-title font-title text-default-font text-center">
                CAPTURE
              </span>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Source Date / Time\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  disabled
                >
                  <TextField.Input
                    placeholder=""
                    value={capture ? new Date(capture.created_at).toLocaleString('de-DE') : ""}
                    readOnly
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Source URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                  disabled
                >
                  <TextField.Input
                    placeholder=""
                    value={capture ? capture.url : ""}
                    readOnly
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <div className="flex flex-col items-start gap-1 pt-4">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Source Screenshot\n"}
                  </span>
                </div>
                {capture?.screenshot_url ? (
                  <img
                    className="w-full flex-none rounded-md border border-solid border-neutral-border shadow-md"
                    src={capture.screenshot_url}
                    alt="Source Screenshot"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-md border border-dashed border-neutral-border bg-neutral-50">
                  </div>
                )}
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Capture for Country:\n"}
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  placeholder="Deutschland"
                  helpText=""
                  icon={<FeatherSearch />}
                  value={country}
                  onValueChange={(value: string) => setCountry(value)}
                >
                  <Select.Item value="de">Deutschland</Select.Item>
                  <Select.Item value="at">Österreich</Select.Item>
                  <Select.Item value="ch">Schweiz</Select.Item>
                  <Select.Item value="fr">Frankreich</Select.Item>
                  <Select.Item value="it">Italien</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <div className="flex w-full flex-col items-start gap-1 pt-4">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Start Capture. Source is:"}
                  </span>
                  <div className="flex w-full items-center gap-2">
                    <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                      <Button
                        className="h-12 w-full flex-none"
                        variant={sourceType === 'manufacturer' ? 'brand-primary' : 'neutral-primary'}
                        icon={<FeatherFactory />}
                        onClick={handleManufacturerClick}
                        disabled={isExtracting}
                      >
                        Manufacturer
                      </Button>
                      <Button
                        className="h-12 w-full flex-none"
                        variant={sourceType === 'reseller' ? 'brand-primary' : 'neutral-primary'}
                        icon={<FeatherShoppingCart />}
                        onClick={handleResellerClick}
                        disabled={isExtracting}
                      >
                        Reseller
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"HTML-Parsing\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value=""
                    readOnly
                  />
                  <Progress value={getProgressValue('scraping_primary')} />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"AI-Screenshot-Analysis\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value=""
                    readOnly
                  />
                  <Progress value={getProgressValue('analyzing_primary')} />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"AI-Research - find info about Manufacturer\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value=""
                    readOnly
                  />
                  <Progress value={getProgressValue('finding_manufacturer')} />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"AI-Research - find Retailers\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value=""
                    readOnly
                  />
                  <Progress value={getProgressValue('finding_retailers')} />
                </TextField>
              </div>
              <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Logging / Console\n"}
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
                    value={loggingMessages.join('\n')}
                    readOnly
                  />
                </TextArea>
              </div>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"IDENTETY\n"}
              </span>
              <div className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full flex-col items-start gap-1">
                  <div className="flex flex-col items-start gap-1 pt-4">
                    <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                      {"Product Image\n"}
                    </span>
                    {capture?.thumbnail_url ? (
                      <img
                        className="h-80 w-full flex-none rounded-md border border-solid border-neutral-border object-cover shadow-md"
                        src={capture.thumbnail_url}
                        alt="Product Thumbnail"
                      />
                    ) : (
                      <div className="flex h-80 w-full items-center justify-center rounded-md border border-dashed border-neutral-border bg-neutral-50">
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Category\n"}
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  placeholder="Select options"
                  helpText=""
                  icon={<FeatherSearch />}
                  value={formData.category || undefined}
                  onValueChange={(value: string) => updateField('category', value)}
                >
                                     {categoriesLoading ? (
                     <Select.Item value="loading">Loading categories...</Select.Item>
                   ) : categories.length === 0 ? (
                     <Select.Item value="no_categories">No categories found</Select.Item>
                   ) : (
                     categories.map(category => (
                       <Select.Item key={category.id} value={category.label}>
                         {category.main_category} - {category.label}
                       </Select.Item>
                     ))
                   )}
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Manufacturer\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.manufacturer || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('manufacturer', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Name / Model\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.product_name || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('product_name', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Series / Line\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.series || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('series', event.target.value)}
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
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.product_code || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('product_code', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Application Area"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.application_area || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('application_area', event.target.value)}
                  />
                </TextField>
                <div className="flex w-full flex-col items-start gap-1 pt-4">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Description\n"}
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
                      value={formData.description || ""}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', event.target.value)}
                    />
                  </TextArea>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Manufacturer Main URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.manufacturer_main_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('manufacturer_main_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Manufacturer Product URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.manufacturer_product_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('manufacturer_product_url', event.target.value)}
                  />
                </TextField>
              </div>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"RETAILER"}
              </span>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Retailer Name"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.retailer_name || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('retailer_name', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Retailer URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.retailer_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('retailer_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Retailer Product URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.retailer_product_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('retailer_product_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Retailer Main URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.retailer_main_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('retailer_main_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Price\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.price || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('price', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Unit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.unit || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('unit', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Price per Unit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.price_per_unit || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('price_per_unit', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Availability\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.availability || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('availability', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full flex-col items-start gap-1 pt-4">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Alternative Retailer"}
                  </span>
                  <div className="flex w-full flex-col items-start gap-1 bg-neutral-50">
                    <Table>
                      {getAlternativeRetailers().map((retailer, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>
                            <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500">
                              {retailer.name}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="grow shrink-0 basis-0 whitespace-nowrap text-body font-body text-neutral-500 text-right">
                              {retailer.price}
                            </span>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"SPECS"}
              </span>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Dimensions"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.dimensions || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('dimensions', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Color\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.color || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('color', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Main Material\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.main_material || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('main_material', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Surface\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.surface || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('surface', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Weight per Unit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.weight_per_unit || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('weight_per_unit', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Fire Resistance\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.fire_resistance || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('fire_resistance', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Thermal Conductivity\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.thermal_conductivity || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('thermal_conductivity', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"U-Value"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.u_value || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('u_value', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Sound Insulation\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.sound_insulation || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('sound_insulation', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Water Resistence\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.water_resistance || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('water_resistance', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {" Vapor Diffusion"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.vapor_diffusion || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('vapor_diffusion', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Installation Type"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.installation_type || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('installation_type', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Maintenance"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.maintenance || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('maintenance', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Environment Cert"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.environment_cert || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('environment_cert', event.target.value)}
                  />
                </TextField>
              </div>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"DOCUMENTS"}
              </span>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Datasheet"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.datasheet_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('datasheet_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Technical Sheet\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.technical_sheet_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('technical_sheet_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Product Page\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.product_page_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('product_page_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Additional Documents\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.additional_documents_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('additional_documents_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Catalog\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.catalog_url || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('catalog_url', event.target.value)}
                  />
                </TextField>
              </div>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2">
              <span className="w-full whitespace-pre-wrap text-title font-title text-default-font text-center">
                {"EXPERIENCE"}
              </span>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Project"}
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  placeholder="Select Project"
                  helpText=""
                  icon={<FeatherSearch />}
                  value={formData.project || ""}
                  onValueChange={(value: string) => updateField('project', value)}
                >
                  <Select.Item value="residential_new">Residential - New Construction</Select.Item>
                  <Select.Item value="residential_renovation">Residential - Renovation</Select.Item>
                  <Select.Item value="commercial_office">Commercial - Office</Select.Item>
                  <Select.Item value="commercial_retail">Commercial - Retail</Select.Item>
                  <Select.Item value="commercial_hospitality">Commercial - Hospitality</Select.Item>
                  <Select.Item value="industrial_warehouse">Industrial - Warehouse</Select.Item>
                  <Select.Item value="industrial_manufacturing">Industrial - Manufacturing</Select.Item>
                  <Select.Item value="healthcare_hospital">Healthcare - Hospital</Select.Item>
                  <Select.Item value="healthcare_clinic">Healthcare - Clinic</Select.Item>
                  <Select.Item value="education_school">Education - School</Select.Item>
                  <Select.Item value="education_university">Education - University</Select.Item>
                  <Select.Item value="public_government">Public - Government</Select.Item>
                  <Select.Item value="public_infrastructure">Public - Infrastructure</Select.Item>
                  <Select.Item value="mixed_use">Mixed Use</Select.Item>
                  <Select.Item value="other">Other</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Sample ordered\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.sample_ordered || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('sample_ordered', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Sample stored in...\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.sample_stored_in || ""}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('sample_stored_in', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Rating\n"}
                </span>
                <ToggleGroup value={formData.rating?.toString() || ""} onValueChange={(val) => updateField('rating', parseInt(val))}>
                  <ToggleGroup.Item value="1">1</ToggleGroup.Item>
                  <ToggleGroup.Item value="2">2</ToggleGroup.Item>
                  <ToggleGroup.Item value="3">3</ToggleGroup.Item>
                  <ToggleGroup.Item value="4">4</ToggleGroup.Item>
                  <ToggleGroup.Item value="5">5</ToggleGroup.Item>
                </ToggleGroup>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Notes\n"}
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
                    value={formData.notes || ""}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => updateField('notes', event.target.value)}
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