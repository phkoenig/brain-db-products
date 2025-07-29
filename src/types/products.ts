export interface Product {
  // Primary Key
  id: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Source Information (Chrome Extension)
  source_type?: string;
  source_url?: string;
  screenshot_path?: string;
  thumbnail_path?: string;
  user_id?: string;
  
  // Identity
  manufacturer?: string;
  product_name?: string;
  product_code?: string;
  description?: string;
  category?: string;
  application_area?: string;
  series?: string; // NEW
  
  // Specifications
  material_type?: string;
  color?: string;
  surface?: string;
  dimensions?: string;
  weight_per_unit?: number;
  fire_resistance?: string;
  thermal_conductivity?: number;
  sound_insulation?: string;
  u_value?: number;
  water_resistance?: string;
  vapor_diffusion?: string;
  installation_type?: string; // NEW
  maintenance?: string; // NEW
  environment_cert?: any; // JSONB
  
  // Pricing & Retailer
  price?: number;
  unit?: string;
  price_per_unit?: number;
  retailer?: string;
  retailer_url?: string; // NEW
  availability?: string;
  
  // Alternative Retailer (NEW)
  alternative_retailer_name?: string;
  alternative_retailer_url?: string;
  alternative_retailer_price?: number;
  alternative_retailer_unit?: string;
  alternative_retailer_price_per_unit?: number;
  alternative_retailer_availability?: string;
  alternative_retailer_ai_research_status?: string;
  alternative_retailer_ai_research_progress?: number;
  
  // Documents
  datasheet_url?: string;
  technical_sheet_url?: string;
  product_page_url?: string;
  additional_documents?: any; // JSONB
  catalog_path?: string;
  
  // AI & Processing
  ocr_text_raw?: string;
  parsed_fields?: any; // JSONB
  ai_confidence?: any; // JSONB
  manual_reviewed?: boolean;
  notes?: string;
}

// Form data will hold string values for all fields,
// conversion to number/JSON happens in toProductData
export type ProductFormData = {
  [K in keyof Omit<Product, 'id' | 'created_at' | 'updated_at' | 'source_type' | 'screenshot_path' | 'thumbnail_path' | 'user_id' | 'ocr_text_raw' | 'parsed_fields' | 'ai_confidence' | 'manual_reviewed' | 'alternative_retailer_ai_research_progress'>]: string;
} & {
  // Additional fields for form data that are not in the Product interface
  manufacturer_url?: string;
  manufacturer_product_url?: string;
  retailer_name?: string;
  main_material?: string;
  additional_documents_url?: string;
  rating?: string;
  catalog_url?: string;
  project?: string;
  sample_ordered?: string;
  sample_stored_in?: string;
}; 