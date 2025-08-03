import { NextRequest, NextResponse } from 'next/server';
import { loadProductFieldDefinitions } from '@/lib/schemas/product-fields';
import { analyzeWithOpenAI } from '@/lib/extraction/aiAnalyzer';
import { analyzeWithPerplexity } from '@/lib/extraction/perplexityAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, screenshotBase64, sourceType, productId } = await request.json();

    console.log('Enhanced Analysis: Starting analysis for', { url, sourceType, productId });

    // Step 1: Load field definitions for dynamic prompts
    const fieldDefinitions = await loadProductFieldDefinitions();
    console.log('Enhanced Analysis: Loaded', fieldDefinitions.fields.length, 'field definitions');

    // Step 2: GPT-4o Vision Analysis (temporarily disabled for speed)
    console.log('Enhanced Analysis: GPT-4o Vision analysis temporarily disabled');
    const openAIResult = {}; // Empty result for now
    console.log('Enhanced Analysis: Using Perplexity only for faster processing');

    // Step 3: Perplexity AI Analysis for enhancement
    console.log('Enhanced Analysis: Starting Perplexity AI analysis...');
    let perplexityResult = null;
    try {
      perplexityResult = await analyzeWithPerplexity(url, fieldDefinitions);
      console.log('Enhanced Analysis: Perplexity analysis complete');
    } catch (error) {
      console.error('Enhanced Analysis: Perplexity analysis failed, continuing with OpenAI only:', error);
      perplexityResult = null;
    }

    // Step 4: Use Perplexity result directly (no fusion needed)
    console.log('Enhanced Analysis: Using Perplexity result directly');
    const fusedResult = perplexityResult || {};
    console.log('Enhanced Analysis: Final fusedResult:', JSON.stringify(fusedResult, null, 2));
    
    // 🔄 DATEN WERDEN NICHT MEHR AUTOMATISCH GESPEICHERT
    // Speicherung erfolgt erst am Ende über /api/products/save-all
    console.log('📋 KI-Analyse-Daten extrahiert, warte auf Speicherung am Ende der Analyse');
    
    console.log('Enhanced Analysis: Processing complete');

    return NextResponse.json({
      success: true,
      data: fusedResult,
      sources: {
        openai: openAIResult,
        perplexity: perplexityResult
      }
    });

  } catch (error) {
    console.error('Enhanced Analysis: Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function fuseWithConfidence(openAIResult: any, perplexityResult: any) {
  const fusedData: any = {};
  
  // Handle case where perplexityResult is null (API failed)
  if (!perplexityResult) {
    console.log('Enhanced Analysis: Perplexity failed, returning empty result');
    return {};
  }
  
  // Get all unique field names from both results
  const allFields = new Set([
    ...Object.keys(openAIResult),
    ...Object.keys(perplexityResult)
  ]);

  for (const fieldName of allFields) {
    const openAIData = openAIResult[fieldName];
    const perplexityData = perplexityResult[fieldName];

    // Extract values and confidence scores
    const openAIValue = extractValue(openAIData);
    const openAIConfidence = extractConfidence(openAIData);
    const perplexityValue = extractValue(perplexityData);
    const perplexityConfidence = extractConfidence(perplexityData);

    // Decision logic based on confidence
    if (!openAIValue && !perplexityValue) {
      // Both empty - skip this field
      continue;
    } else if (!openAIValue && perplexityValue) {
      // Only Perplexity has data
      fusedData[fieldName] = {
        value: perplexityValue,
        confidence: perplexityConfidence,
        source: 'perplexity',
        reasoning: extractReasoning(perplexityData)
      };
    } else if (openAIValue && !perplexityValue) {
      // Only OpenAI has data
      fusedData[fieldName] = {
        value: openAIValue,
        confidence: openAIConfidence,
        source: 'openai',
        reasoning: extractReasoning(openAIData)
      };
    } else {
      // Both have data - compare confidence
      if (openAIConfidence >= perplexityConfidence) {
        fusedData[fieldName] = {
          value: openAIValue,
          confidence: openAIConfidence,
          source: 'openai',
          reasoning: extractReasoning(openAIData),
          conflict_resolved: true
        };
      } else {
        fusedData[fieldName] = {
          value: perplexityValue,
          confidence: perplexityConfidence,
          source: 'perplexity',
          reasoning: extractReasoning(perplexityData),
          conflict_resolved: true
        };
      }
    }
  }

  return fusedData;
}

function extractValue(fieldData: any): string {
  if (!fieldData) return '';
  if (typeof fieldData === 'string') return fieldData;
  if (fieldData.value !== undefined) return String(fieldData.value);
  return '';
}

function extractConfidence(fieldData: any): number {
  if (!fieldData) return 0;
  if (typeof fieldData === 'object' && fieldData.confidence !== undefined) {
    return Number(fieldData.confidence);
  }
  return 0;
}

function extractReasoning(fieldData: any): string {
  if (!fieldData) return '';
  if (typeof fieldData === 'object' && fieldData.reasoning) {
    return String(fieldData.reasoning);
  }
  return '';
} 