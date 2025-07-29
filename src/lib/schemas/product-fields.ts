import { supabase } from '../supabase';

export interface ProductFieldDefinition {
  id: string;
  field_name: string;
  category: string;
  label: string;
  description: string | null;
  data_type: 'string' | 'number' | 'boolean' | 'object';
  examples: any[] | null;
  extraction_hints: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFieldsSchema {
  fields: ProductFieldDefinition[];
  categories: string[];
  total_fields: number;
}

/**
 * Load all product field definitions from the database
 */
export async function loadProductFieldDefinitions(): Promise<ProductFieldsSchema> {
  try {
    const { data, error } = await supabase
      .from('product_field_definitions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading product field definitions:', error);
      throw error;
    }

    const fields = data || [];
    const categories = [...new Set(fields.map(f => f.category))];

    return {
      fields,
      categories,
      total_fields: fields.length
    };
  } catch (error) {
    console.error('Failed to load product field definitions:', error);
    throw error;
  }
}

/**
 * Get all field names from the database
 */
export async function getAllFieldNames(): Promise<string[]> {
  const schema = await loadProductFieldDefinitions();
  return schema.fields.map(field => field.field_name);
}

/**
 * Get field definition by field name
 */
export async function getFieldDefinition(fieldName: string): Promise<ProductFieldDefinition | null> {
  const schema = await loadProductFieldDefinitions();
  return schema.fields.find(field => field.field_name === fieldName) || null;
}

/**
 * Get extraction hints for a specific field
 */
export async function getExtractionHints(fieldName: string): Promise<string[]> {
  const definition = await getFieldDefinition(fieldName);
  return definition?.extraction_hints || [];
}

/**
 * Get all fields by category
 */
export async function getFieldsByCategory(category: string): Promise<ProductFieldDefinition[]> {
  const schema = await loadProductFieldDefinitions();
  return schema.fields.filter(field => field.category === category);
}

/**
 * Generate AI prompt for extraction using field definitions from database
 */
export async function generateAIPrompt(html: string, base64Image: string): Promise<string> {
  const schema = await loadProductFieldDefinitions();
  
  const fieldDescriptions = schema.fields.map(field => {
    const examples = field.examples ? ` (Examples: ${field.examples.join(', ')})` : '';
    const hints = field.extraction_hints ? ` (Hints: ${field.extraction_hints.join(', ')})` : '';
    return `- ${field.field_name}: ${field.description}${examples}${hints}`;
  }).join('\n');

  return `
Analyze this product page and extract information into JSON format.

HTML Content: ${html}
Screenshot: ${base64Image}

Extract these fields:
${fieldDescriptions}

Return only valid JSON with extracted values. Use null for fields that cannot be found.
Example format:
{
  "manufacturer": "Knauf",
  "product_name": "Diamant X",
  "price": 15.99,
  "dimensions": "2500 x 1250 x 12.5 mm",
  ...
}

Important: Return ONLY valid JSON, no additional text or explanations.
`;
}

/**
 * Generate structured data extraction prompt
 */
export async function generateStructuredDataPrompt(html: string): Promise<string> {
  const schema = await loadProductFieldDefinitions();
  
  const fieldList = schema.fields.map(field => field.field_name).join(', ');
  
  return `
Extract structured data from this HTML page and return as JSON.

HTML: ${html}

Target fields: ${fieldList}

Instructions:
1. Look for JSON-LD structured data in <script type="application/ld+json"> tags
2. Extract Open Graph meta tags
3. Look for microdata attributes (itemprop, itemtype)
4. Search for common CSS selectors and text patterns
5. Return only valid JSON with extracted values

Return format:
{
  "field_name": "extracted_value",
  ...
}
`;
}

/**
 * Validate extracted data against field definitions
 */
export async function validateExtractedData(data: Record<string, any>): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const schema = await loadProductFieldDefinitions();
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [fieldName, value] of Object.entries(data)) {
    const definition = schema.fields.find(f => f.field_name === fieldName);
    
    if (!definition) {
      warnings.push(`Unknown field: ${fieldName}`);
      continue;
    }

    // Type validation
    if (value !== null && value !== undefined) {
      const expectedType = definition.data_type;
      const actualType = typeof value;

      if (expectedType === 'number' && actualType !== 'number') {
        errors.push(`${fieldName}: Expected number, got ${actualType}`);
      } else if (expectedType === 'boolean' && actualType !== 'boolean') {
        errors.push(`${fieldName}: Expected boolean, got ${actualType}`);
      } else if (expectedType === 'object' && actualType !== 'object') {
        errors.push(`${fieldName}: Expected object, got ${actualType}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get field definitions for web scraping selectors
 */
export async function getWebScrapingSelectors(): Promise<Record<string, string[]>> {
  const schema = await loadProductFieldDefinitions();
  const selectors: Record<string, string[]> = {};

  for (const field of schema.fields) {
    if (field.extraction_hints) {
      selectors[field.field_name] = field.extraction_hints;
    }
  }

  return selectors;
}

/**
 * Cache for field definitions to avoid repeated database calls
 */
let fieldDefinitionsCache: ProductFieldsSchema | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached field definitions or load from database
 */
export async function getCachedFieldDefinitions(): Promise<ProductFieldsSchema> {
  const now = Date.now();
  
  if (fieldDefinitionsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return fieldDefinitionsCache;
  }

  fieldDefinitionsCache = await loadProductFieldDefinitions();
  cacheTimestamp = now;
  
  return fieldDefinitionsCache;
}

/**
 * Clear the field definitions cache
 */
export function clearFieldDefinitionsCache(): void {
  fieldDefinitionsCache = null;
  cacheTimestamp = 0;
} 