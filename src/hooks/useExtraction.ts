import { useState } from 'react';
import { FusedResult, WebScrapingResult } from '@/lib/types/extraction';

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
    resetExtraction(); // Start fresh

    try {
      // Step 1: Scrape the primary source URL
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
      
      // Step 2: Analyze the primary source screenshot
      setExtractionState('analyzing_primary');
      setProgress(30);
      const analyzeResponse = await fetch('/api/extraction/ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: primaryUrl, screenshotBase64, sourceType }),
      });
      if (!analyzeResponse.ok) throw new Error('Primary AI analysis failed');
      const analyzedData = (await analyzeResponse.json()).data;

      // TODO: Fuse scrapedData and analyzedData before the next step to get a more robust product name
      const productName = scrapedData.product_name.value || analyzedData.product_name.value;
      const manufacturerName = scrapedData.manufacturer.value || analyzedData.manufacturer.value;
      const retailerName = scrapedData.retailer?.value; // Assumes web scraper can find this

      // Step 3: Find the counterpart based on source type
      if (sourceType === 'reseller') {
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
            }
        }
      } else { // sourceType is 'manufacturer'
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
            }
        }
      }

      // Step 4: Fuse all collected data
      setExtractionState('fusing_data');
      setProgress(80);
      // TODO: Implement the final data fusion logic here or in a separate API route
      // This will combine primaryScrapeData, analyzedData, and counterpartData
      // For now, just marking as complete
      
      setProgress(100);
      setExtractionState('complete');

    } catch (err) {
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