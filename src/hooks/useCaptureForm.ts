import { useState, useCallback } from 'react';
import { ProductFormData } from '@/types/products';

// Initial empty form data
const initialFormData: ProductFormData = {
  // Source Information (Chrome Extension)
  source_url: '',
  
  // Identity
  manufacturer: '',
  product_name: '',
  product_code: '',
  description: '',
  category: '',
  application_area: '',
  series: '',
  
  // Specifications
  material_type: '',
  color: '',
  surface: '',
  dimensions: '',
  weight_per_unit: '',
  fire_resistance: '',
  thermal_conductivity: '',
  sound_insulation: '',
  u_value: '',
  water_resistance: '',
  vapor_diffusion: '',
  installation_type: '',
  maintenance: '',
  environment_cert: '',
  
  // Pricing & Retailer
  price: '',
  unit: '',
  price_per_unit: '',
  retailer: '',
  retailer_url: '',
  availability: '',
  
  // Alternative Retailer (NEW)
  alternative_retailer_name: '',
  alternative_retailer_url: '',
  alternative_retailer_price: '',
  alternative_retailer_unit: '',
  alternative_retailer_price_per_unit: '',
  alternative_retailer_availability: '',
  alternative_retailer_ai_research_status: 'pending',
  
  // Documents
  datasheet_url: '',
  technical_sheet_url: '',
  product_page_url: '',
  additional_documents: '',
  catalog_path: '',
  
  // Notes
  notes: '',
  
  // Additional fields for extraction
  manufacturer_url: '',
  manufacturer_product_url: '',
  retailer_name: '',
  main_material: '',
  additional_documents_url: '',
  rating: '',
  catalog_url: '',
  project: '',
  sample_ordered: '',
  sample_stored_in: '',
};

export function useCaptureForm() {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update a single field
  const updateField = useCallback((field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<ProductFormData>) => {
    console.log("useCaptureForm: updateFields called with:", updates);
    setFormData(prev => {
      const newData = {
        ...prev,
        ...updates
      };
      console.log("useCaptureForm: Previous form data:", prev);
      console.log("useCaptureForm: New form data:", newData);
      return newData;
    });
    setIsDirty(true);
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setIsDirty(false);
  }, []);

  // Load data from capture (when capture_id is provided)
  const loadFromCapture = useCallback((captureData: { url: string; screenshot_url: string; thumbnail_url: string; created_at: string }) => {
    updateFields({
      product_page_url: captureData.url,
      source_url: captureData.url,
      // We could also set screenshot_path and thumbnail_path here
      // when we implement image upload functionality
    });
  }, []); // Empty dependency array means this function is created only once

  // Validate form data
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!formData.manufacturer?.trim()) {
      errors.push('Manufacturer is required');
    }
    
    if (!formData.product_name?.trim()) {
      errors.push('Product name is required');
    }
    
    if (!formData.category?.trim()) {
      errors.push('Category is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Convert form data to Product format for database
  const toProductData = () => {
    return {
      // Source Information (Chrome Extension)
      source_url: formData.source_url || null,
      
      // Identity
      manufacturer: formData.manufacturer || null,
      product_name: formData.product_name || null,
      product_code: formData.product_code || null,
      description: formData.description || null,
      category: formData.category || null,
      application_area: formData.application_area || null,
      series: formData.series || null,
      
      // Specifications
      material_type: formData.material_type || null,
      color: formData.color || null,
      surface: formData.surface || null,
      dimensions: formData.dimensions || null,
      weight_per_unit: formData.weight_per_unit ? parseFloat(formData.weight_per_unit) : null,
      fire_resistance: formData.fire_resistance || null,
      thermal_conductivity: formData.thermal_conductivity ? parseFloat(formData.thermal_conductivity) : null,
      sound_insulation: formData.sound_insulation || null,
      u_value: formData.u_value ? parseFloat(formData.u_value) : null,
      water_resistance: formData.water_resistance || null,
      vapor_diffusion: formData.vapor_diffusion || null,
      installation_type: formData.installation_type || null,
      maintenance: formData.maintenance || null,
      environment_cert: formData.environment_cert && formData.environment_cert.trim() ? 
        (() => {
          try {
            return JSON.parse(formData.environment_cert);
          } catch {
            return formData.environment_cert; // Return as string if not valid JSON
          }
        })() : null,
      
      // Pricing & Retailer
      price: formData.price ? parseFloat(formData.price) : null,
      unit: formData.unit || null,
      price_per_unit: formData.price_per_unit ? parseFloat(formData.price_per_unit) : null,
      retailer: formData.retailer || null,
      retailer_url: formData.retailer_url || null,
      availability: formData.availability || null,
      
      // Alternative Retailer (NEW)
      alternative_retailer_name: formData.alternative_retailer_name || null,
      alternative_retailer_url: formData.alternative_retailer_url || null,
      alternative_retailer_price: formData.alternative_retailer_price ? parseFloat(formData.alternative_retailer_price) : null,
      alternative_retailer_unit: formData.alternative_retailer_unit || null,
      alternative_retailer_price_per_unit: formData.alternative_retailer_price_per_unit ? parseFloat(formData.alternative_retailer_price_per_unit) : null,
      alternative_retailer_availability: formData.alternative_retailer_availability || null,
      alternative_retailer_ai_research_status: formData.alternative_retailer_ai_research_status || 'pending',
      alternative_retailer_ai_research_progress: 0,
      
      // Documents
      datasheet_url: formData.datasheet_url || null,
      technical_sheet_url: formData.technical_sheet_url || null,
      product_page_url: formData.product_page_url || null,
      additional_documents: formData.additional_documents && formData.additional_documents.trim() ? 
        (() => {
          try {
            return JSON.parse(formData.additional_documents);
          } catch {
            return formData.additional_documents; // Return as string if not valid JSON
          }
        })() : null,
      catalog_path: formData.catalog_path || null,
      
      // Notes
      notes: formData.notes || null,
      
      // Source information (Chrome Extension)
      source_type: 'chrome_extension',
    };
  };

  return {
    formData,
    isDirty,
    isSaving,
    updateField,
    updateFields,
    resetForm,
    loadFromCapture,
    validateForm,
    toProductData,
    setIsSaving,
  };
} 