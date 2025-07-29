import { AIAnalysisResult } from '../types/extraction';

// Helper function to safely extract value from FieldData
const getFieldValue = (fieldData: any): string => {
  if (!fieldData) return '';
  if (typeof fieldData === 'string') return fieldData;
  if (fieldData.value) return fieldData.value;
  return '';
};

// Helper function to fuse OpenAI and Perplexity AI data
export const fuseAIData = (openaiData: AIAnalysisResult, perplexityData: AIAnalysisResult): AIAnalysisResult => {
  const fused: AIAnalysisResult = {};
  
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

  // Helper to get source from FieldData
  const getSource = (fieldData: any): string => {
    if (!fieldData) return 'none';
    if (typeof fieldData === 'string') return 'unknown';
    if (fieldData.source) return fieldData.source;
    return 'unknown';
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
    const openaiValue = getFieldValue(openaiData[field]);
    const perplexityValue = getFieldValue(perplexityData[field]);
    const openaiConfidence = getConfidence(openaiData[field]);
    const perplexityConfidence = getConfidence(perplexityData[field]);

    // Choose the value with higher confidence, or OpenAI if equal (screenshot analysis is more reliable)
    if (openaiConfidence >= perplexityConfidence && openaiValue) {
      fused[field] = {
        value: openaiValue,
        confidence: openaiConfidence,
        reasoning: getReasoning(openaiData[field]),
        source: getSource(openaiData[field]) || 'openai'
      };
    } else if (perplexityValue) {
      fused[field] = {
        value: perplexityValue,
        confidence: perplexityConfidence,
        reasoning: getReasoning(perplexityData[field]),
        source: getSource(perplexityData[field]) || 'perplexity'
      };
    } else if (openaiValue) {
      fused[field] = {
        value: openaiValue,
        confidence: openaiConfidence,
        reasoning: getReasoning(openaiData[field]),
        source: getSource(openaiData[field]) || 'openai'
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