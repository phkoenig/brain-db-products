import { useState, useCallback } from 'react';
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
  | 'url_processing'
  | 'screenshot_analysis'
  | 'url_enhancement'
  | 'confidence_fusion'
  | 'complete'
  | 'error';

export function useExtraction() {
  const [extractionState, setExtractionState] = useState<ExtractionState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // State to hold data from each step
  const [enhancedAnalysisData, setEnhancedAnalysisData] = useState<any | null>(null);
  const [openAIData, setOpenAIData] = useState<any | null>(null);
  const [perplexityData, setPerplexityData] = useState<any | null>(null);

  const resetExtraction = useCallback(() => {
    setExtractionState('idle');
    setProgress(0);
    setError(null);
    setEnhancedAnalysisData(null);
    setOpenAIData(null);
    setPerplexityData(null);
  }, []);

  const startExtraction = useCallback(async (
    primaryUrl: string,
    screenshotBase64: string,
    sourceType: 'manufacturer' | 'reseller',
    country: string
  ) => {
    console.log("useExtraction: Starting enhanced extraction process", { primaryUrl, sourceType, country });
    resetExtraction(); // Start fresh

    try {
      // Step 1: URL Processing (already done in capture page)
      console.log("useExtraction: Step 1 - URL processing completed in UI");
      setExtractionState('url_processing');
      setProgress(10);

      // Step 2: Enhanced AI Analysis (GPT-4o + Perplexity + Confidence Fusion)
      console.log("useExtraction: Step 2 - Starting enhanced AI analysis");
      setExtractionState('screenshot_analysis');
      setProgress(30);
      
      const enhancedResponse = await fetch('/api/extraction/enhanced-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: primaryUrl, 
          screenshotBase64, 
          sourceType 
        }),
      });

      if (!enhancedResponse.ok) {
        const errorData = await enhancedResponse.json();
        throw new Error(`Enhanced analysis failed: ${errorData.error || 'Unknown error'}`);
      }

      const enhancedData = await enhancedResponse.json();
      console.log("useExtraction: Enhanced analysis complete:", enhancedData);

      // Store the results
      setEnhancedAnalysisData(enhancedData.data);
      setOpenAIData(enhancedData.sources.openai);
      setPerplexityData(enhancedData.sources.perplexity);

      // Step 3: Confidence Fusion (already done in API)
      console.log("useExtraction: Step 3 - Confidence fusion completed");
      setExtractionState('confidence_fusion');
      setProgress(90);

      // Step 4: Complete
      setProgress(100);
      setExtractionState('complete');
      console.log("useExtraction: Enhanced extraction complete!");

    } catch (err) {
      console.error("useExtraction: Error during extraction:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setExtractionState('error');
      setProgress(0);
    }
  }, [resetExtraction]);
  
  const getProgressMessage = (): string => {
    switch (extractionState) {
      case 'url_processing': return 'URL-Verarbeitung läuft...';
      case 'screenshot_analysis': return 'GPT-4o Vision + Perplexity AI Analyse läuft...';
      case 'url_enhancement': return 'URL-Erweiterung mit Perplexity AI...';
      case 'confidence_fusion': return 'Confidence-basierte Datenfusion...';
      case 'complete': return 'Erweiterte Extraktion abgeschlossen!';
      case 'error': return `Fehler: ${error}`;
      default: return 'Bereit für erweiterte Extraktion.';
    }
  }

  return {
    extractionState,
    progress,
    error,
    enhancedAnalysisData,
    openAIData,
    perplexityData,
    startExtraction,
    resetExtraction,
    getProgressMessage,
    isExtracting: extractionState !== 'idle' && extractionState !== 'complete' && extractionState !== 'error',
  };
} 