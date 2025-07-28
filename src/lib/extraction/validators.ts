import { z } from 'zod';

export class FieldValidators {
  // Product name validation
  static validateProductName(value: string): { isValid: boolean; errors: string[] } {
    const schema = z.string()
      .min(2, 'Produktname muss mindestens 2 Zeichen lang sein')
      .max(200, 'Produktname darf maximal 200 Zeichen lang sein')
      .regex(/^[a-zA-Z0-9\s\-_\.\(\)]+$/, 'Produktname darf nur Buchstaben, Zahlen, Leerzeichen und -_.() enthalten');

    try {
      schema.parse(value);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['Unbekannter Validierungsfehler'] };
    }
  }

  // Manufacturer validation
  static validateManufacturer(value: string): { isValid: boolean; errors: string[] } {
    const schema = z.string()
      .min(2, 'Hersteller muss mindestens 2 Zeichen lang sein')
      .max(100, 'Hersteller darf maximal 100 Zeichen lang sein')
      .regex(/^[a-zA-Z\s\-_\.]+$/, 'Hersteller darf nur Buchstaben, Leerzeichen und -_. enthalten');

    try {
      schema.parse(value);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['Unbekannter Validierungsfehler'] };
    }
  }

  // Price validation
  static validatePrice(value: string | number): { isValid: boolean; errors: string[] } {
    const schema = z.union([
      z.string().regex(/^\d+(?:[.,]\d{1,2})?$/, 'Preis muss eine gültige Zahl sein'),
      z.number().min(0, 'Preis muss größer als 0 sein').max(100000, 'Preis darf maximal 100.000 sein')
    ]);

    try {
      schema.parse(value);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['Unbekannter Validierungsfehler'] };
    }
  }

  // Description validation
  static validateDescription(value: string): { isValid: boolean; errors: string[] } {
    const schema = z.string()
      .min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein')
      .max(2000, 'Beschreibung darf maximal 2000 Zeichen lang sein');

    try {
      schema.parse(value);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['Unbekannter Validierungsfehler'] };
    }
  }

  // Specifications validation
  static validateSpecifications(value: string): { isValid: boolean; errors: string[] } {
    const schema = z.string()
      .min(10, 'Spezifikationen müssen mindestens 10 Zeichen lang sein')
      .max(1000, 'Spezifikationen dürfen maximal 1000 Zeichen lang sein');

    try {
      schema.parse(value);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['Unbekannter Validierungsfehler'] };
    }
  }

  // URL validation
  static validateUrl(value: string): { isValid: boolean; errors: string[] } {
    const schema = z.string().url('URL muss ein gültiges Format haben');

    try {
      schema.parse(value);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['Unbekannter Validierungsfehler'] };
    }
  }

  // Confidence score validation
  static validateConfidence(confidence: number): { isValid: boolean; errors: string[] } {
    const schema = z.number().min(0, 'Confidence muss mindestens 0 sein').max(1, 'Confidence darf maximal 1 sein');

    try {
      schema.parse(confidence);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['Unbekannter Validierungsfehler'] };
    }
  }

  // Normalize price value
  static normalizePrice(value: string | number): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // Remove currency symbols and whitespace
      const cleanValue = value.replace(/[€$£¥\s]/g, '');
      
      // Find numbers with optional decimal places
      const match = cleanValue.match(/(\d+(?:[.,]\d{1,2})?)/);
      if (match) {
        const price = parseFloat(match[1].replace(',', '.'));
        return isNaN(price) ? null : price;
      }
    }

    return null;
  }

  // Normalize text value
  static normalizeText(value: string): string {
    if (!value) return '';
    
    return value
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-_\.\(\)]/g, ''); // Remove special characters except allowed ones
  }

  // Validate complete product data
  static validateProductData(data: Record<string, unknown>): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    
    // Validate each field
    if (data.product_name) {
      const result = this.validateProductName(data.product_name);
      if (!result.isValid) {
        errors.product_name = result.errors;
      }
    }
    
    if (data.manufacturer) {
      const result = this.validateManufacturer(data.manufacturer);
      if (!result.isValid) {
        errors.manufacturer = result.errors;
      }
    }
    
    if (data.price) {
      const result = this.validatePrice(data.price);
      if (!result.isValid) {
        errors.price = result.errors;
      }
    }
    
    if (data.description) {
      const result = this.validateDescription(data.description);
      if (!result.isValid) {
        errors.description = result.errors;
      }
    }
    
    if (data.specifications) {
      const result = this.validateSpecifications(data.specifications);
      if (!result.isValid) {
        errors.specifications = result.errors;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
} 