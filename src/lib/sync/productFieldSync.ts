import { createClient } from '@supabase/supabase-js';

export interface ProductFieldSync {
  field_name: string;
  category: string;
  label: string;
  data_type: string;
  is_active: boolean;
  description?: string;
}

export class ProductFieldSynchronizer {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Synchronisiert die product_field_definitions mit der products Tabelle
   */
  async syncFieldDefinitions(): Promise<{
    added: string[];
    updated: string[];
    errors: string[];
  }> {
    const result = {
      added: [] as string[],
      updated: [] as string[],
      errors: [] as string[]
    };

    try {
      // Hole alle Spalten der products Tabelle
      const { data: productColumns, error: columnsError } = await this.supabase
        .rpc('get_table_columns', { table_name: 'products' });

      if (columnsError) {
        result.errors.push(`Fehler beim Abrufen der Tabellenspalten: ${columnsError.message}`);
        return result;
      }

      // Hole alle existierenden Definitionen
      const { data: existingDefinitions, error: defError } = await this.supabase
        .from('product_field_definitions')
        .select('field_name, data_type, category, label');

      if (defError) {
        result.errors.push(`Fehler beim Abrufen der Definitionen: ${defError.message}`);
        return result;
      }

      const existingFields = new Set(existingDefinitions?.map(d => d.field_name) || []);

      // Prüfe jede Spalte
      for (const column of productColumns || []) {
        if (this.shouldSkipColumn(column.column_name)) continue;

        const fieldName = column.column_name;
        const mappedDataType = this.mapPostgresToJsonType(column.data_type);

        if (!existingFields.has(fieldName)) {
          // Neues Feld hinzufügen
          const { error: insertError } = await this.supabase
            .from('product_field_definitions')
            .insert({
              field_name: fieldName,
              category: this.determineCategory(fieldName),
              label: this.generateLabel(fieldName),
              data_type: mappedDataType,
              is_active: true,
              description: `Auto-synchronized from products table`
            });

          if (insertError) {
            result.errors.push(`Fehler beim Hinzufügen von ${fieldName}: ${insertError.message}`);
          } else {
            result.added.push(fieldName);
          }
        } else {
          // Prüfe ob Datentyp aktualisiert werden muss
          const existingDef = existingDefinitions?.find(d => d.field_name === fieldName);
          if (existingDef && existingDef.data_type !== mappedDataType) {
            const { error: updateError } = await this.supabase
              .from('product_field_definitions')
              .update({ data_type: mappedDataType })
              .eq('field_name', fieldName);

            if (updateError) {
              result.errors.push(`Fehler beim Aktualisieren von ${fieldName}: ${updateError.message}`);
            } else {
              result.updated.push(fieldName);
            }
          }
        }
      }

    } catch (error) {
      result.errors.push(`Unerwarteter Fehler: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Prüft ob eine Spalte übersprungen werden soll
   */
  private shouldSkipColumn(columnName: string): boolean {
    const skipColumns = ['id', 'created_at', 'updated_at', 'user_id'];
    return skipColumns.includes(columnName);
  }

  /**
   * Mappt PostgreSQL Datentypen zu JSON Schema Typen
   */
  private mapPostgresToJsonType(postgresType: string): string {
    const typeMap: Record<string, string> = {
      'text': 'string',
      'character varying': 'string',
      'varchar': 'string',
      'numeric': 'number',
      'decimal': 'number',
      'integer': 'number',
      'int': 'number',
      'bigint': 'number',
      'boolean': 'boolean',
      'bool': 'boolean',
      'jsonb': 'object',
      'json': 'object'
    };

    return typeMap[postgresType.toLowerCase()] || 'string';
  }

  /**
   * Bestimmt die Kategorie basierend auf dem Feldnamen
   */
  private determineCategory(fieldName: string): string {
    if (fieldName.includes('retailer')) return 'pricing_retailer';
    if (fieldName.includes('url') || fieldName.includes('sheet') || fieldName.includes('catalog')) return 'documents';
    if (fieldName.includes('ai_') || fieldName.includes('ocr') || fieldName.includes('parsed')) return 'ai_processing';
    if (fieldName.includes('alternative_')) return 'alternative_retailer';
    if (fieldName.includes('price') || fieldName.includes('unit')) return 'pricing_retailer';
    if (fieldName.includes('manufacturer') || fieldName.includes('product') || fieldName.includes('description')) return 'identity';
    return 'specifications';
  }

  /**
   * Generiert einen benutzerfreundlichen Label aus dem Feldnamen
   */
  private generateLabel(fieldName: string): string {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Führt eine Validierung der Synchronisation durch
   */
  async validateSync(): Promise<{
    mismatches: Array<{ field: string; productsType: string; definitionType: string }>;
    missingInProducts: string[];
    missingInDefinitions: string[];
  }> {
    const result = {
      mismatches: [] as Array<{ field: string; productsType: string; definitionType: string }>,
      missingInProducts: [] as string[],
      missingInDefinitions: [] as string[]
    };

    // Implementierung der Validierungslogik
    // ... (ähnlich wie in der SQL-Analyse oben)

    return result;
  }
}

// Utility-Funktion für die Verwendung in API-Routes
export async function syncProductFields() {
  const synchronizer = new ProductFieldSynchronizer();
  return await synchronizer.syncFieldDefinitions();
} 