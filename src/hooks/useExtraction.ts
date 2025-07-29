import { useState } from 'react';
import { FusedResult, WebScrapingResult } from '@/lib/types/extraction';

// Helper function to safely extract value from FieldData
const getFieldValue = (fieldData: any): string => {
  if (!fieldData) return '';
  if (typeof fieldData === 'string') return fieldData;
  if (fieldData.value) return fieldData.value;
  return '';
};

// Helper function to fuse scraped and analyzed data
const fuseData = (scrapedData: any, analyzedData: any): any => {
  const fused: any = {};
  
  // Helper to get confidence from FieldData
  const getConfidence = (fieldData: any): number => {
    if (!fieldData) return 0;
    if (typeof fieldData === 'string') return 0.5;
    if (fieldData.confidence !== undefined) return fieldData.confidence;
    return 0.5;
  };

  // Helper to get reasoning from FieldData
  const getReasoning = (fieldData: any): string => {
    if (!fieldData) return '';
    if (typeof fieldData === 'string') return '';
    if (fieldData.reasoning) return fieldData.reasoning;
    return '';
  };

  // List of fields to fuse
  const fields = [
    'product_name', 'manufacturer', 'price', 'description', 'specifications',
    'series', 'product_code', 'application_area', 'manufacturer_url', 
    'manufacturer_product_url', 'retailer_name', 'retailer_url', 'product_page_url',
    'unit', 'price_per_unit', 'availability', 'dimensions', 'color', 'main_material',
    'surface', 'weight_per_unit', 'fire_resistance', 'thermal_conductivity', 'u_value',
    'sound_insulation', 'water_resistance', 'vapor_diffusion', 'installation_type',
    'maintenance', 'environment_cert', 'datasheet_url', 'technical_sheet_url',
    'additional_documents_url', 'catalog_url', 'project', 'sample_ordered',
    'sample_stored_in', 'rating', 'notes'
  ];

  fields.forEach(field => {
    const scrapedValue = getFieldValue(scrapedData[field]);
    const analyzedValue = getFieldValue(analyzedData[field]);
    const scrapedConfidence = getConfidence(scrapedData[field]);
    const analyzedConfidence = getConfidence(analyzedData[field]);

    // Choose the value with higher confidence, or scraped if equal
    if (scrapedConfidence >= analyzedConfidence && scrapedValue) {
      fused[field] = {
        value: scrapedValue,
        confidence: scrapedConfidence,
        reasoning: getReasoning(scrapedData[field]),
        source: 'web'
      };
    } else if (analyzedValue) {
      fused[field] = {
        value: analyzedValue,
        confidence: analyzedConfidence,
        reasoning: getReasoning(analyzedData[field]),
        source: 'ai'
      };
    } else if (scrapedValue) {
      fused[field] = {
        value: scrapedValue,
        confidence: scrapedConfidence,
        reasoning: getReasoning(scrapedData[field]),
        source: 'web'
      };
    } else {
      fused[field] = {
        value: '',
        confidence: 0,
        reasoning: '',
        source: 'none'
      };
    }
  });

  return fused;
};

// Define the detailed states of the extraction process
export type ExtractionState =
  | 'idle'
  | 'scraping_primary'
  | 'analyzing_primary'
  | 'finding_manufacturer'
  | 'finding_retailers'
  | 'fusing_data'
  | 'complete'
  | 'error';

export function useExtraction() {
  const [extractionState, setExtractionState] = useState<ExtractionState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // State to hold data from each step
  const [primaryScrapeData, setPrimaryScrapeData] = useState<WebScrapingResult | null>(null);
  const [counterpartData, setCounterpartData] = useState<any | null>(null); // Can be manufacturer info or retailer list
  const [fusedData, setFusedData] = useState<FusedResult | null>(null);

  const resetExtraction = () => {
    setExtractionState('idle');
    setProgress(0);
    setError(null);
    setPrimaryScrapeData(null);
    setCounterpartData(null);
    setFusedData(null);
  };

  const startExtraction = async (
    primaryUrl: string,
    screenshotBase64: string,
    sourceType: 'manufacturer' | 'reseller',
    country: string
  ) => {
    console.log("useExtraction: Starting extraction process", { primaryUrl, sourceType, country });
    resetExtraction(); // Start fresh

    try {
      // Step 1: Scrape the primary source URL
      console.log("useExtraction: Step 1 - Scraping primary source");
      setExtractionState('scraping_primary');
      setProgress(10);
      const scrapeResponse = await fetch('/api/extraction/web-scraping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: primaryUrl, sourceType }),
      });
      if (!scrapeResponse.ok) throw new Error('Primary scraping failed');
      const scrapedData: WebScrapingResult = (await scrapeResponse.json()).data;
      setPrimaryScrapeData(scrapedData);
      console.log("useExtraction: Step 1 complete - Scraped data:", scrapedData);
      
      // Step 2: Analyze the primary source screenshot
      console.log("useExtraction: Step 2 - Analyzing screenshot");
      setExtractionState('analyzing_primary');
      setProgress(30);
      const analyzeResponse = await fetch('/api/extraction/ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: primaryUrl, screenshotBase64, sourceType }),
      });
      if (!analyzeResponse.ok) throw new Error('Primary AI analysis failed');
      const analyzedData = (await analyzeResponse.json()).data;
      console.log("useExtraction: Step 2 complete - Analyzed data:", analyzedData);

      // Fuse scrapedData and analyzedData to get the best results
      console.log("useExtraction: Fusing scraped and analyzed data...");
      const fusedData = fuseData(scrapedData, analyzedData);
      setPrimaryScrapeData(fusedData);
      console.log("useExtraction: Fused data set as primaryScrapeData:", fusedData);

      // Extract names from fused data for next steps
      const productName = getFieldValue(fusedData.product_name);
      const manufacturerName = getFieldValue(fusedData.manufacturer);
      const retailerName = getFieldValue(fusedData.retailer_name);

      console.log("useExtraction: Extracted names from fused data:", { productName, manufacturerName, retailerName });

      // Step 3: Find the counterpart based on source type
      if (sourceType === 'reseller') {
        console.log("useExtraction: Step 3 - Finding manufacturer (reseller source)");
        setExtractionState('finding_manufacturer');
        setProgress(50);
        if (productName && retailerName) {
            const findManufacturerResponse = await fetch('/api/extraction/find-manufacturer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName, retailerName }),
            });
            if (findManufacturerResponse.ok) {
                const manufacturerInfo = await findManufacturerResponse.json();
                setCounterpartData(manufacturerInfo);
                console.log("useExtraction: Step 3 complete - Manufacturer info:", manufacturerInfo);
            }
        } else {
          console.log("useExtraction: Skipping manufacturer search - missing productName or retailerName");
        }
      } else { // sourceType is 'manufacturer'
        console.log("useExtraction: Step 3 - Finding retailers (manufacturer source)");
        setExtractionState('finding_retailers');
        setProgress(50);
        if (productName && manufacturerName) {
            const findRetailersResponse = await fetch('/api/extraction/find-retailers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName, manufacturerName, country }),
            });
            if (findRetailersResponse.ok) {
                const retailersData = await findRetailersResponse.json();
                setCounterpartData(retailersData.retailers);
                console.log("useExtraction: Step 3 complete - Retailers data:", retailersData.retailers);
            }
        } else {
          console.log("useExtraction: Skipping retailers search - missing productName or manufacturerName");
        }
      }

      // Step 4: Fuse all collected data
      console.log("useExtraction: Step 4 - Fusing data");
      setExtractionState('fusing_data');
      setProgress(80);
      // TODO: Implement the final data fusion logic here or in a separate API route
      // This will combine primaryScrapeData, analyzedData, and counterpartData
      // For now, just marking as complete
      
      setProgress(100);
      setExtractionState('complete');
      console.log("useExtraction: Extraction complete!");

    } catch (err) {
      console.error("useExtraction: Error during extraction:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setExtractionState('error');
      setProgress(0);
    }
  };
  
  const getProgressMessage = (): string => {
    switch (extractionState) {
        case 'scraping_primary': return 'Scraping primary source...';
        case 'analyzing_primary': return 'Analyzing screenshot...';
        case 'finding_manufacturer': return 'Finding manufacturer...';
        case 'finding_retailers': return 'Finding retailers...';
        case 'fusing_data': return 'Fusing all data...';
        case 'complete': return 'Extraction complete!';
        case 'error': return `Error: ${error}`;
        default: return 'Ready to start.';
    }
  }

  return {
    extractionState,
    progress,
    error,
    primaryScrapeData,
    counterpartData,
    fusedData,
    startExtraction,
    resetExtraction,
    getProgressMessage,
    isExtracting: extractionState !== 'idle' && extractionState !== 'complete' && extractionState !== 'error',
  };
} 