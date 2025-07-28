"use client";

import {
  FeatherFactory,
  FeatherPlayCircle,
  FeatherSearch,
  FeatherShoppingCart,
} from "@subframe/core";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useCaptureForm } from "@/hooks/useCaptureForm";
import { useExtraction } from "@/hooks/useExtraction";
import { supabase } from "@/lib/supabase";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { Progress } from "@/ui/components/Progress";
import { Select } from "@/ui/components/Select";
import { Table } from "@/ui/components/Table";
import { TextArea } from "@/ui/components/TextArea";
import { TextField } from "@/ui/components/TextField";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";

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

  // Form state management
  const {
    formData,
    updateField,
    updateFields,
    loadFromCapture,
  } = useCaptureForm();

  // Extraction state management
  const {
    extractionState,
    progress,
    startExtraction,
    isExtracting,
  } = useExtraction();

  useEffect(() => {
    if (!captureId) {
      setLoading(false); // Stop loading if there's no ID
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
        } else {
          setError(`No capture found with ID: ${captureId}`);
        }
      } catch (err) {
        console.error("Failed to fetch capture data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching data.");
      } finally {
        setLoading(false); // This ensures loading is always stopped
      }
    };

    fetchCaptureData();
  }, [captureId, loadFromCapture]);
  
  // TODO: Implement country detection from URL
  useEffect(() => {
    if (capture?.url) {
      // simple regex to get tld
      const tldMatch = capture.url.match(/\.([a-z]{2,})$/);
      if (tldMatch && tldMatch[1]) {
        const tld = tldMatch[1];
        // More robust mapping needed
        const countryMap: { [key: string]: string } = {
          de: "de",
          at: "at",
          ch: "ch",
          fr: "fr",
          it: "it",
          es: "es",
          uk: "gb",
          com: "us",
        };
        setCountry(countryMap[tld] || 'de');
      }
    }
  }, [capture?.url]);


  const handleStartExtraction = async () => {
      if (!sourceType || !capture) {
          setError("Please select a source type (Manufacturer or Reseller) first.");
          return;
      }
      // TODO: Replace with new extraction logic from IMPLEMENTATION_PLAN_FINAL.md
  }

  if (loading) {
      return (
          <DefaultPageLayout>
              <div className="flex h-full w-full items-center justify-center">
                  Loading...
              </div>
          </DefaultPageLayout>
      )
  }
  
  if (error) {
       return (
          <DefaultPageLayout>
              <div className="flex h-full w-full items-center justify-center text-red-500">
                  Error: {error}
              </div>
          </DefaultPageLayout>
      )
  }

  return (
    <DefaultPageLayout>
      <div className="flex h-full w-full flex-col items-start gap-4 bg-default-background px-4 py-4">
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-4">
          {/* CAPTURE Column */}
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 self-stretch rounded-lg border border-solid border-neutral-border bg-default-background px-2 py-2 shadow-md">
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <span className="w-full text-title font-title text-default-font text-center">
                CAPTURE
              </span>
            </div>
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
                onValueChange={setCountry}
              >
                <Select.Item value="de">Deutschland</Select.Item>
                <Select.Item value="at">Österreich</Select.Item>
                <Select.Item value="ch">Schweiz</Select.Item>
                <Select.Item value="fr">Frankreich</Select.Item>
                <Select.Item value="it">Italien</Select.Item>
                <Select.Item value="es">Spanien</Select.Item>
                 <Select.Item value="gb">UK</Select.Item>
                <Select.Item value="us">USA</Select.Item>
              </Select>
            </div>
            <div className="flex w-full flex-col items-start gap-1">
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Start Captutre. Source is:"}
                </span>
                <div className="flex w-full items-center gap-2">
                  <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                    <Button
                      className="h-12 w-full flex-none"
                      variant={sourceType === 'manufacturer' ? 'brand-primary' : 'neutral-primary'}
                      icon={<FeatherFactory />}
                      onClick={() => setSourceType('manufacturer')}
                      disabled={isExtracting}
                    >
                      Manucaturer
                    </Button>
                    <Button
                      className="h-12 w-full flex-none"
                      variant={sourceType === 'reseller' ? 'brand-primary' : 'neutral-primary'}
                      icon={<FeatherShoppingCart />}
                       onClick={() => setSourceType('reseller')}
                       disabled={isExtracting}
                    >
                      Reseller
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {/* TODO: Connect Progress Bars to new extraction states */}
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
                <Progress value={10} />
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
                <Progress value={10} />
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
                <Progress value={10} />
              </TextField>
            </div>
            <div className="flex w-full flex-col items-start gap-1 pt-4">
              <div className="flex items-center gap-2">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"AI-Research - find Retailers\n"}
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
                  placeholder=""
                  value=""
                  readOnly
                />
                <Progress value={10} />
              </TextField>
            </div>
          </div>
          {/* IDENTITY Column */}
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
                  {capture?.thumbnail_url ? (
                    <img
                      className="w-full flex-none rounded-md border border-solid border-neutral-border shadow-md"
                      src={capture.thumbnail_url}
                      alt="Product Thumbnail"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center rounded-md border border-dashed border-neutral-border bg-neutral-50">
                    </div>
                  )}
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
                      onValueChange={(value) => updateField('category', value)}
                    >
                      {/* TODO: Populate with real categories */}
                      <Select.Item value="option1">option1</Select.Item>
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
                    onChange={(e) => updateField('manufacturer', e.target.value)}
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
                    onChange={(e) => updateField('product_name', e.target.value)}
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
                    value={formData.series}
                    onChange={(e) => updateField('series', e.target.value)}
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
                    onChange={(e) => updateField('product_code', e.target.value)}
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
                    onChange={(e) => updateField('application_area', e.target.value)}
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
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  </TextArea>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-1 pt-4">
              <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                {"Manufacturer URL\n"}
              </span>
              <TextField
                className="h-auto w-full flex-none"
                variant="filled"
                label=""
                helpText=""
              >
                <TextField.Input
                  placeholder=""
                  value={formData.manufacturer_url}
                  onChange={(e) => updateField('manufacturer_url', e.target.value)}
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
                   value={formData.product_page_url}
                   onChange={(e) => updateField('product_page_url', e.target.value)}
                />
              </TextField>
            </div>
          </div>
          {/* RETAILER Column */}
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
                    onChange={(e) => updateField('retailer', e.target.value)}
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
                    onChange={(e) => updateField('retailer_url', e.target.value)}
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
                     value={formData.product_page_url}
                    onChange={(e) => updateField('product_page_url', e.target.value)}
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
                    onChange={(e) => updateField('price', e.target.value)}
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
                    onChange={(e) => updateField('unit', e.target.value)}
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
                    onChange={(e) => updateField('price_per_unit', e.target.value)}
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
                    onChange={(e) => updateField('availability', e.target.value)}
                  />
                </TextField>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-2 px-2 py-2">
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Alternative Retailer"}
                </span>
                {/* TODO: Connect to state */}
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
                  </Table>
                </div>
              </div>
            </div>
          </div>
          {/* SPECS Column */}
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
                    onChange={(e) => updateField('dimensions', e.target.value)}
                  />
                </TextField>
              </div>
              {/* ... other SPECS fields ... */}
            </div>
          </div>
           {/* DOCUMENTS Column */}
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
                    onChange={(e) => updateField('datasheet_url', e.target.value)}
                  />
                </TextField>
              </div>
               {/* ... other DOCUMENTS fields ... */}
            </div>
          </div>
           {/* EXPERIENCE Column */}
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
                  value={undefined} // TODO
                  onValueChange={(value: string) => {}}
                >
                  <Select.Item value="option1">option1</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-1 pt-4">
                <span className="whitespace-pre-wrap text-caption font-caption text-default-font">
                  {"Rating\n"}
                </span>
                <ToggleGroup value={formData.rating?.toString()} onValueChange={(val) => updateField('rating', parseInt(val))}>
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
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                  />
                </TextArea>
              </div>
               {/* ... other EXPERIENCE fields ... */}
            </div>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default Extractor; 