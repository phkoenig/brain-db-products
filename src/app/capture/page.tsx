"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { Progress } from "@/ui/components/Progress";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherPlayCircle } from "@subframe/core";
import { Select } from "@/ui/components/Select";
import { FeatherSearch } from "@subframe/core";
import { TextArea } from "@/ui/components/TextArea";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { useCaptureForm } from "@/hooks/useCaptureForm";
import { useExtraction } from "@/hooks/useExtraction";


function Extractor() {
  const searchParams = useSearchParams();
  const captureId = searchParams.get("capture_id");
  const [capture, setCapture] = useState<null | { url: string; screenshot_url: string; thumbnail_url: string; created_at: string }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'manufacturer' | 'reseller' | null>(null);

  // Form state management
  const {
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
  } = useCaptureForm();

  // Extraction state management
  const {
    extractionState,
    progress,
    results,
    error: extractionError,
    fieldsNeedingReview,
    overallConfidence,
    researchResults,
    startExtraction,
    resetExtraction,
    getProgressMessage,
    getConfidenceColor,
    getConfidenceLabel,
    isExtracting,
    hasResults,
    hasErrors,
    needsManualReview
  } = useExtraction();



  useEffect(() => {
    if (!captureId) return;
    setLoading(true);
    setError(null);
    supabase
      .from("captures")
      .select("url, screenshot_url, thumbnail_url, created_at")
      .eq("id", captureId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else {
          setCapture(data);
          // Load capture data into form
          loadFromCapture(data);
        }
        setLoading(false);
      });
  }, [captureId, loadFromCapture]);

  // Helper function to get field mappings based on source type
  const getFieldMappings = () => {
    if (sourceType === 'manufacturer') {
      return {
        // For manufacturer sites, focus on product details and specifications
        product_name: ['h1.product-title', 'h1.product-name', '.product-name h1', 'h1'],
        manufacturer: ['.manufacturer', '.brand', '[data-testid="manufacturer"]', '.product-brand'],
        description: ['.product-description', '.description', '[data-testid="description"]', '.product-details'],
        specifications: ['.specifications', '.product-specs', '[data-testid="specifications"]', '.tech-specs'],
        // Price might not be available on manufacturer sites
        price: ['.price', '.product-price', '[data-testid="price"]', '.current-price']
      };
    } else if (sourceType === 'reseller') {
      return {
        // For reseller sites, focus on pricing and availability
        product_name: ['h1.product-title', 'h1.product-name', '.product-name h1', 'h1'],
        manufacturer: ['.manufacturer', '.brand', '[data-testid="manufacturer"]', '.product-brand'],
        price: ['.price', '.product-price', '[data-testid="price"]', '.current-price', '.sale-price'],
        availability: ['.availability', '.stock', '[data-testid="availability"]', '.in-stock'],
        retailer: ['.retailer', '.seller', '[data-testid="retailer"]', '.store-name'],
        description: ['.product-description', '.description', '[data-testid="description"]', '.product-details']
      };
    }
    return {};
  };

  // Helper function to get AI prompt context based on source type
  const getAIPromptContext = () => {
    if (sourceType === 'manufacturer') {
      return "Dies ist eine Hersteller-Website. Fokussiere dich auf Produktdetails, technische Spezifikationen und Produktbeschreibungen. Preise sind möglicherweise nicht verfügbar.";
    } else if (sourceType === 'reseller') {
      return "Dies ist eine Händler-Website. Fokussiere dich auf Preise, Verfügbarkeit, Händlerinformationen und Produktdetails.";
    }
    return "Analysiere die Produktinformationen auf der Website.";
  };

  // Validation function to check if source type is selected
  const validateSourceType = () => {
    if (!sourceType) {
      setError('Bitte wähle zuerst eine Quelle aus (Manufacturer oder Reseller)');
      return false;
    }
    setError(null);
    return true;
  };

  // Helper function to convert image URL to base64
  const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data:image/png;base64, prefix
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  // Function to handle extraction start
  const handleStartExtraction = async () => {
    if (!validateSourceType() || !capture) {
      return;
    }

    try {
      const screenshotBase64 = await imageUrlToBase64(capture.screenshot_url);
      
      await startExtraction(
        capture.url,
        screenshotBase64,
        sourceType,
        formData.product_name,
        formData.retailer
      );
    } catch (error) {
      setError('Fehler beim Starten der Extraktion: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };



  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
        {(error || extractionError) && (
          <div className="w-full text-center text-red-500 py-8">
            Fehler: {error || extractionError}
          </div>
        )}

        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full text-title font-title text-default-font text-center">
                CAPTURE
              </span>
            </div>
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Import As"}
                </span>
                                 <div className="flex w-full items-center gap-2">
                   <Button
                     className={`h-8 grow shrink-0 basis-0 ${sourceType === 'manufacturer' ? 'bg-blue-500 text-white' : ''}`}
                     onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                       setSourceType('manufacturer');
                       // Update form data to indicate this is from manufacturer
                       updateField('source_type', 'manufacturer');
                     }}
                   >
                     Manufacturer
                   </Button>
                   <Button
                     className={`h-8 grow shrink-0 basis-0 ${sourceType === 'reseller' ? 'bg-blue-500 text-white' : ''}`}
                     onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                       setSourceType('reseller');
                       // Update form data to indicate this is from reseller
                       updateField('source_type', 'reseller');
                     }}
                   >
                     Reseller
                   </Button>
                 </div>
                 {sourceType && (
                   <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                     <strong>Quelle ausgewählt:</strong> {sourceType === 'manufacturer' ? 'Hersteller-Website' : 'Händler-Website'}
                     <br />
                     <span className="text-xs">
                       {sourceType === 'manufacturer' 
                         ? 'Fokus auf Produktdetails und Spezifikationen' 
                         : 'Fokus auf Preise und Verfügbarkeit'
                       }
                     </span>
                   </div>
                 )}
                 
                 {researchResults && (
                   <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                     <strong>Research-Ergebnisse:</strong>
                     <br />
                     <span className="text-xs">
                       <strong>Hersteller:</strong> {researchResults.manufacturer?.name || 'Nicht gefunden'}
                       <br />
                       <strong>Website:</strong> {researchResults.manufacturer?.website || 'Nicht gefunden'}
                       <br />
                       <strong>Confidence:</strong> {researchResults.manufacturer?.confidence ? `${(researchResults.manufacturer.confidence * 100).toFixed(1)}%` : 'N/A'}
                     </span>
                   </div>
                 )}
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Screenshot\n"}
                </span>
              </div>
                             <img
                 className="w-full h-auto object-contain rounded-md border border-solid border-neutral-border shadow-md"
                 src={capture ? capture.screenshot_url : "https://res.cloudinary.com/subframe/image/upload/v1753484734/uploads/15448/no0kzv8niw6m1rilbcoq.png"}
               />
            </div>
                         <div className="flex w-full flex-col items-start gap-1 pt-4">
               <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                 {"URL\n"}
               </span>
                               <a
                  href={capture ? capture.url : ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full break-all bg-neutral-100 rounded p-2 underline hover:no-underline cursor-pointer text-sm text-gray-600"
                >
                  {capture ? capture.url : ""}
                </a>
             </div>
                           <div className="flex w-full flex-col items-start gap-1 pt-4">
                 <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                   {"Date / Time\n"}
                 </span>
                                   <div className="w-full break-all bg-neutral-100 rounded p-2 text-sm text-gray-600">
                    {capture ? new Date(capture.created_at).toLocaleString('de-DE') : ""}
                  </div>
               </div>
            <div className="flex w-full flex-col items-start gap-1 pt-4">
              <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                {"Title HTML\n"}
              </span>
              <TextField
                className="h-auto w-full flex-none"
                variant="filled"
                label=""
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value={formData.product_name}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('product_name', event.target.value)}
                />
              </TextField>
            </div>
            <div className="flex w-full flex-col items-start gap-1 pt-4">
              <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                {"Keywords HTML\n"}
              </span>
              <TextField
                className="h-auto w-full flex-none"
                variant="filled"
                label=""
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value={formData.product_code}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('product_code', event.target.value)}
                />
              </TextField>
            </div>
            <div className="flex w-full flex-col items-start gap-1 pt-4">
              <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                {"Description  HTML\n"}
              </span>
              <TextField
                className="h-auto w-full flex-none"
                variant="filled"
                label=""
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value={formData.description}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateField('description', event.target.value)}
                />
              </TextField>
            </div>
            <div className="flex w-full flex-col items-start gap-1 pt-4">
              <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                {"Scraping\n"}
              </span>
              <TextField
                className="h-auto w-full flex-none"
                variant="filled"
                label=""
                helpText=""
              >
                <TextField.Input
                  placeholder={extractionState === 'scraping' ? getProgressMessage() : 'Bereit für Scraping'}
                  value=""
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                  disabled={isExtracting}
                />
                <Progress value={extractionState === 'scraping' ? progress : 0} />
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
                  placeholder={extractionState === 'analyzing' ? getProgressMessage() : 'Bereit für AI-Analyse'}
                  value=""
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                  disabled={isExtracting}
                />
                <Progress value={extractionState === 'analyzing' ? progress : 0} />
              </TextField>
            </div>
            <div className="flex w-full flex-col items-start gap-1 pt-4">
              <div className="flex items-center gap-2">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"AI-Research - find missing Information\n"}
                </span>
                <IconButton
                  className="h-5 w-5 flex-none"
                  variant="brand-tertiary"
                  icon={<FeatherPlayCircle />}
                  onClick={handleStartExtraction}
                  disabled={isExtracting || !sourceType}
                />
              </div>
              <TextField
                className="h-auto w-full flex-none"
                variant="filled"
                label=""
                helpText=""
              >
                <TextField.Input
                  placeholder={extractionState === 'researching' ? getProgressMessage() : 'Bereit für AI-Research'}
                  value=""
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                  disabled={isExtracting}
                />
                <Progress value={extractionState === 'researching' ? progress : 0} />
              </TextField>
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
                  </div>
                                     <img
                     className="w-full h-auto object-contain rounded-md border border-solid border-neutral-border shadow-md"
                     src={capture ? capture.thumbnail_url : "https://res.cloudinary.com/subframe/image/upload/v1753521965/uploads/15448/ozygn2coie8oufamcrqo.png"}
                     alt="Product Image"
                   />
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
                      value={formData.category}
                      onValueChange={(value: string) => updateField('category', value)}
                    >
                      <Select.Item value="option1">option1</Select.Item>
                      <Select.Item value="option2">option2</Select.Item>
                      <Select.Item value="option3">option3</Select.Item>
                      <Select.Item value="option4">option4</Select.Item>
                      <Select.Item value="option5">option5</Select.Item>
                    </Select>
                  </div>
                </div>
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
                    value={formData.manufacturer}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('manufacturer', event.target.value)}
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
                    value={formData.product_name}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('product_name', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Series\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder=""
                    value={formData.series}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('series', event.target.value)}
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
                    value={formData.product_code}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('product_code', event.target.value)}
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
                    value={formData.application_area}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('application_area', event.target.value)}
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
                      value={formData.description}
                      onChange={(
                        event: React.ChangeEvent<HTMLTextAreaElement>
                      ) => updateField('description', event.target.value)}
                    />
                  </TextArea>
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
                    value={formData.dimensions}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('dimensions', event.target.value)}
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
                    value={formData.color}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('color', event.target.value)}
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
                    value={formData.material_type}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('material_type', event.target.value)}
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
                    value={formData.surface}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('surface', event.target.value)}
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
                    value={formData.weight_per_unit}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('weight_per_unit', event.target.value)}
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
                    value={formData.fire_resistance}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('fire_resistance', event.target.value)}
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
                    value={formData.thermal_conductivity}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('thermal_conductivity', event.target.value)}
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
                    value={formData.u_value}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('u_value', event.target.value)}
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
                    value={formData.sound_insulation}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('sound_insulation', event.target.value)}
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
                    value={formData.water_resistance}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('water_resistance', event.target.value)}
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
                    value={formData.vapor_diffusion}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('vapor_diffusion', event.target.value)}
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
                    value={formData.installation_type}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('installation_type', event.target.value)}
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
                    value={formData.maintenance}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('maintenance', event.target.value)}
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
                    value={formData.environment_cert}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('environment_cert', event.target.value)}
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
                    value={formData.datasheet_url}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('datasheet_url', event.target.value)}
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
                    value={formData.technical_sheet_url}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('technical_sheet_url', event.target.value)}
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
                    value={formData.product_page_url}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('product_page_url', event.target.value)}
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
                    value={formData.additional_documents}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('additional_documents', event.target.value)}
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
                    value={formData.catalog_path}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('catalog_path', event.target.value)}
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
                  placeholder="Select Projetcs"
                  helpText=""
                  icon={<FeatherSearch />}
                  value={undefined}
                  onValueChange={(value: string) => {}}
                >
                  <Select.Item value="option1">option1</Select.Item>
                  <Select.Item value="option2">option2</Select.Item>
                  <Select.Item value="option3">option3</Select.Item>
                  <Select.Item value="option4">option4</Select.Item>
                  <Select.Item value="option5">option5</Select.Item>
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
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
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
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Rating\n"}
                </span>
                <ToggleGroup value="" onValueChange={(value: string) => {}}>
                  <ToggleGroup.Item value="c146b448">1</ToggleGroup.Item>
                  <ToggleGroup.Item value="33b4f776">2</ToggleGroup.Item>
                  <ToggleGroup.Item value="53e9d8ab">3</ToggleGroup.Item>
                  <ToggleGroup.Item value="efd3e7d2">4</ToggleGroup.Item>
                  <ToggleGroup.Item value="4fc649ca">5</ToggleGroup.Item>
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
                    value={formData.notes}
                    onChange={(
                      event: React.ChangeEvent<HTMLTextAreaElement>
                    ) => updateField('notes', event.target.value)}
                  />
                </TextArea>
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
                    value={formData.retailer}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('retailer', event.target.value)}
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
                    value={formData.retailer_url}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('retailer_url', event.target.value)}
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
                    value={formData.price}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('price', event.target.value)}
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
                    value={formData.unit}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('unit', event.target.value)}
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
                    value={formData.price_per_unit}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('price_per_unit', event.target.value)}
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
                    value={formData.availability}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('availability', event.target.value)}
                  />
                </TextField>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <div className="flex w-full flex-col items-start gap-1 border-t border-solid border-neutral-border pt-4">
                <div className="flex items-center gap-2">
                  <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                    {"Alternative Retailer - AI-Research\n"}
                  </span>
                  <IconButton
                    className="h-5 w-5 flex-none"
                    variant="brand-tertiary"
                    icon={<FeatherPlayCircle />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                      // TODO: Implement AI research for alternative retailers
                      console.log('AI research for alternative retailers');
                    }}
                  />
                </div>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder="AI research status..."
                    value={formData.alternative_retailer_ai_research_status}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('alternative_retailer_ai_research_status', event.target.value)}
                  />
                  <Progress value={10} />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Alternative Retailer - Retailer Name"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Alternative retailer name..."
                    value={formData.alternative_retailer_name}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('alternative_retailer_name', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Alternative Retailer -  URL\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Alternative retailer URL..."
                    value={formData.alternative_retailer_url}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('alternative_retailer_url', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Alternative Retailer - Price\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Alternative retailer price..."
                    value={formData.alternative_retailer_price}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('alternative_retailer_price', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Alternative Retailer - Unit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Alternative retailer unit..."
                    value={formData.alternative_retailer_unit}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('alternative_retailer_unit', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Alternative Retailer - Price per Unit\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Alternative retailer price per unit..."
                    value={formData.alternative_retailer_price_per_unit}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('alternative_retailer_price_per_unit', event.target.value)}
                  />
                </TextField>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Alternative Retailer - Availability\n"}
                </span>
                <TextField
                  className="h-auto w-full flex-none"
                  variant="filled"
                  label=""
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Alternative retailer availability..."
                    value={formData.alternative_retailer_availability}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => updateField('alternative_retailer_availability', event.target.value)}
                  />
                </TextField>
              </div>
            </div>
          </div>
        </div>
        

      </div>
    </DefaultPageLayout>
  );
}

export default Extractor; 