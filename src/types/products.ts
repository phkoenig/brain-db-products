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
  [K in keyof Omit<Product, 'id' | 'created_at' | 'updated_at' | 'source_type' | 'screenshot_path' | 'thumbnail_path' | 'user_id' | 'ocr_text_raw' | 'parsed_fields' | 'ai_confidence' | 'manual_reviewed'>]: string;
} & {
  // Include fields that are not directly from Product but are part of the form
  // For now, these are handled by the Product interface directly
  // If there were form-specific fields not directly mapping to DB, they'd go here
}; 