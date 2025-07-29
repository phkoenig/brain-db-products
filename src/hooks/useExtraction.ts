import { useState } from 'react';
import { FusedResult, WebScrapingResult, AIAnalysisResult } from '@/lib/types/extraction';

// Helper function to safely extract value from FieldData
const getFieldValue = (fieldData: any): string => {
  if (!fieldData) return '';
  if (typeof fieldData === 'string') return fieldData;
  if (fieldData.value) return fieldData.value;
  return '';
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
  const [primaryScrapeData, setPrimaryScrapeData] = useState<AIAnalysisResult | null>(null);
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
      // Step 1: Combined AI analysis (OpenAI + Perplexity)
      console.log("useExtraction: Step 1 - Starting combined AI analysis");
      setExtractionState('scraping_primary');
      setProgress(20);
      
      const simpleResponse = await fetch('/api/extraction/simple-ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: primaryUrl, screenshotBase64, sourceType }),
      });
      if (!simpleResponse.ok) throw new Error('Simple AI analysis failed');
      const simpleData = (await simpleResponse.json()).data;
      
      console.log("useExtraction: Step 1 complete - Simple AI data:", simpleData);
      
      // Set the data as primary result
      setPrimaryScrapeData(simpleData);
      console.log("useExtraction: Data set as primaryScrapeData:", simpleData);

      // Extract names from data for next steps
      const productName = getFieldValue(simpleData.product_name);
      const manufacturerName = getFieldValue(simpleData.manufacturer);
      const retailerName = getFieldValue(simpleData.retailer_name);

      console.log("useExtraction: Extracted names from fused data:", { productName, manufacturerName, retailerName });

      // Step 4: Find the counterpart based on source type (optional)
      if (sourceType === 'reseller') {
        console.log("useExtraction: Step 4 - Finding manufacturer (reseller source)");
        setExtractionState('finding_manufacturer');
        setProgress(90);
        if (productName && retailerName) {
            const findManufacturerResponse = await fetch('/api/extraction/find-manufacturer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName, retailerName }),
            });
            if (findManufacturerResponse.ok) {
                const manufacturerInfo = await findManufacturerResponse.json();
                setCounterpartData(manufacturerInfo);
                console.log("useExtraction: Step 4 complete - Manufacturer info:", manufacturerInfo);
            }
        } else {
          console.log("useExtraction: Skipping manufacturer search - missing productName or retailerName");
        }
      } else { // sourceType is 'manufacturer'
        console.log("useExtraction: Step 4 - Finding retailers (manufacturer source)");
        setExtractionState('finding_retailers');
        setProgress(90);
        if (productName && manufacturerName) {
            const findRetailersResponse = await fetch('/api/extraction/find-retailers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName, manufacturerName, country }),
            });
            if (findRetailersResponse.ok) {
                const retailersData = await findRetailersResponse.json();
                setCounterpartData(retailersData.retailers);
                console.log("useExtraction: Step 4 complete - Retailers data:", retailersData.retailers);
            }
        } else {
          console.log("useExtraction: Skipping retailers search - missing productName or manufacturerName");
        }
      }
      
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
        case 'scraping_primary': return 'OpenAI Screenshot-Analyse läuft...';
        case 'analyzing_primary': return 'OpenAI Screenshot-Analyse läuft...';
        case 'finding_manufacturer': return 'Suche nach Hersteller...';
        case 'finding_retailers': return 'Suche nach Händlern...';
        case 'fusing_data': return 'KI-Daten werden fusioniert...';
        case 'complete': return 'Extraktion abgeschlossen!';
        case 'error': return `Fehler: ${error}`;
        default: return 'Bereit für Extraktion.';
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