import { useState } from 'react';
import { FusedResult } from '@/lib/types/extraction';

export function useExtraction() {
  const [extractionState, setExtractionState] = useState<'idle' | 'researching' | 'scraping' | 'analyzing' | 'fusing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<FusedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldsNeedingReview, setFieldsNeedingReview] = useState<string[]>([]);
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [researchResults, setResearchResults] = useState<any>(null);

  const startExtraction = async (url: string, screenshotBase64: string, sourceType?: 'manufacturer' | 'reseller', productName?: string, resellerName?: string) => {
    setExtractionState('scraping');
    setProgress(10);
    setError(null);
    setResults(null);
    setFieldsNeedingReview([]);
    setOverallConfidence(0);
    setResearchResults(null);

    try {
      let currentUrl = url;
      let currentScreenshot = screenshotBase64;

      // 1. Internet Research (if reseller source type) (10-25%)
      if (sourceType === 'reseller') {
        setExtractionState('researching');
        setProgress(15);
        
        const researchResponse = await fetch('/api/extraction/internet-research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url, 
            screenshotBase64, 
            productName, 
            resellerName 
          })
        });

        if (!researchResponse.ok) {
          throw new Error('Internet research failed');
        }

        const researchData = await researchResponse.json();
        setResearchResults(researchData.data);
        setProgress(25);

        // If manufacturer found, update URL for further processing
        if (researchData.data?.manufacturer?.website) {
          currentUrl = researchData.data.manufacturer.website;
          // Note: We would need a new screenshot for the manufacturer website
          // For now, we'll continue with the original screenshot
        }
      }

      // 2. Web Scraping (25-45%)
      setExtractionState('scraping');
      setProgress(30);
      
      const webScrapingResponse = await fetch('/api/extraction/web-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl, sourceType })
      });

      if (!webScrapingResponse.ok) {
        throw new Error('Web scraping failed');
      }

      const webData = await webScrapingResponse.json();
      setProgress(45);

      // 3. AI Analysis (45-75%)
      setExtractionState('analyzing');
      setProgress(50);

      const aiAnalysisResponse = await fetch('/api/extraction/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: currentUrl, 
          screenshotBase64: currentScreenshot,
          sourceType
        })
      });

      if (!aiAnalysisResponse.ok) {
        throw new Error('AI analysis failed');
      }

      const aiData = await aiAnalysisResponse.json();
      setProgress(75);

      // 4. Data Fusion (75-95%)
      setExtractionState('fusing');
      setProgress(80);

      const fusionResponse = await fetch('/api/extraction/data-fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webData, 
          aiData 
        })
      });

      if (!fusionResponse.ok) {
        throw new Error('Data fusion failed');
      }

      const fusedData = await fusionResponse.json();
      setProgress(95);

      // 5. Validation and final processing
      setProgress(100);
      setResults(fusedData.results);
      setFieldsNeedingReview(fusedData.fieldsNeedingReview || []);
      setOverallConfidence(fusedData.overallConfidence || 0);
      setExtractionState('complete');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setExtractionState('error');
      setProgress(0);
    }
  };

  const resetExtraction = () => {
    setExtractionState('idle');
    setProgress(0);
    setResults(null);
    setError(null);
    setFieldsNeedingReview([]);
    setOverallConfidence(0);
  };

  const getProgressMessage = (): string => {
    switch (extractionState) {
      case 'researching':
        return 'Internet-Recherche läuft...';
      case 'scraping':
        return 'Web Scraping läuft...';
      case 'analyzing':
        return 'AI-Analyse läuft...';
      case 'fusing':
        return 'Daten werden kombiniert...';
      case 'complete':
        return 'Extraktion abgeschlossen';
      case 'error':
        return 'Fehler bei der Extraktion';
      default:
        return 'Bereit für Extraktion';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'Hoch';
    if (confidence >= 0.6) return 'Mittel';
    return 'Niedrig';
  };

  return {
    // State
    extractionState,
    progress,
    results,
    error,
    fieldsNeedingReview,
    overallConfidence,
    researchResults,
    
    // Actions
    startExtraction,
    resetExtraction,
    
    // Utilities
    getProgressMessage,
    getConfidenceColor,
    getConfidenceLabel,
    
    // Computed
    isExtracting: extractionState === 'researching' || extractionState === 'scraping' || extractionState === 'analyzing' || extractionState === 'fusing',
    hasResults: results !== null,
    hasErrors: error !== null,
    needsManualReview: fieldsNeedingReview.length > 0
  };
} 