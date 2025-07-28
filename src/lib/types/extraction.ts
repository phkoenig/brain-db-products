export interface FieldData {
  value: string;
  confidence: number;
  source: 'web' | 'ai' | 'both_agree' | 'conflict';
  reasoning?: string;
}

export interface WebScrapingResult {
  product_name: FieldData;
  manufacturer: FieldData;
  price: FieldData;
  description: FieldData;
  specifications: FieldData;
  confidence_scores: Record<string, number>;
}

export interface AIAnalysisResult {
  product_name: FieldData;
  manufacturer: FieldData;
  price: FieldData;
  description: FieldData;
  specifications: FieldData;
  confidence_scores: Record<string, number>;
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