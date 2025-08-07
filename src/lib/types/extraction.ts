export interface FieldData {
  value: string;
  confidence: number;
  source: 'web' | 'ai' | 'perplexity' | 'both_agree' | 'conflict';
  reasoning?: string;
}

export interface WebScrapingResult {
  // Basic product information
  product_name: FieldData;
  manufacturer: FieldData;
  series: FieldData;
  product_code: FieldData;
  application_area: FieldData;
  description: FieldData;
  
  // URLs
  manufacturer_url: FieldData;
  manufacturer_product_url: FieldData;
  
  // Retailer information
  retailer_name: FieldData;
  retailer_url: FieldData;
  product_page_url: FieldData;
  
  // Pricing
  price: FieldData;
  unit: FieldData;
  price_per_unit: FieldData;
  availability: FieldData;
  
  // Specifications
  dimensions: FieldData;
  color: FieldData;
  main_material: FieldData;
  surface: FieldData;
  weight_per_unit: FieldData;
  fire_resistance: FieldData;
  thermal_conductivity: FieldData;
  u_value: FieldData;
  sound_insulation: FieldData;
  water_resistance: FieldData;
  vapor_diffusion: FieldData;
  installation_type: FieldData;
  maintenance: FieldData;
  environment_cert: FieldData;
  
  // Documents
  datasheet_url: FieldData;
  technical_sheet_url: FieldData;
  additional_documents_url: FieldData;
  catalog_url: FieldData;
  
  // Experience
  project: FieldData;
  sample_ordered: FieldData;
  sample_stored_in: FieldData;
  rating: FieldData;
  notes: FieldData;
  
  confidence_scores: Record<string, number>;
}

export interface AIAnalysisResult {
  data: Record<string, FieldData>;
  searchQueries: string[];
  sources: string[];
  error: string | null;
}

export interface FusedResult {
  [field: string]: {
    value: string;
    confidence: number;
    source: 'web' | 'ai' | 'both_agree' | 'conflict';
    needsManualReview: boolean;
    alternatives?: string[];
    conflictReason?: string;
  };
}

export interface ExtractionProgress {
  stage: 'idle' | 'scraping' | 'analyzing' | 'fusing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface ExtractionConfig {
  openaiApiKey: string;
  openaiModel: string;
  extractionTimeout: number;
  cacheTtl: number;
  rateLimits: {
    openai: number;
    webScraping: number;
  };
}

export interface FieldStrategy {
  aiWeight: number;
  webWeight: number;
  validationRules: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    minValue?: number;
    maxValue?: number;
  };
} 