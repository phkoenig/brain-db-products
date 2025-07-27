import { supabase } from './supabase';
import { MaterialCategory, MaterialCategoryCreate, MaterialCategoryUpdate } from '@/types/material-categories';

export class MaterialCategoriesAPI {
  // Alle Kategorien abrufen
  static async getAll(): Promise<MaterialCategory[]> {
    try {
      console.log("1. [API] Fetching all categories from Supabase...");
      const { data, error, status } = await supabase
        ?.from('material_categories')
        .select('*')
        .order('main_category', { ascending: true })
        .order('sub_category', { ascending: true });

      console.log("2. [API] Supabase response:", { status, error, data_count: data?.length });

      if (error) {
        console.error('Error fetching material categories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch material categories:', error);
      return [];
    }
  }

  // Kategorie nach ID abrufen
  static async getById(id: string): Promise<MaterialCategory | null> {
    try {
      const { data, error } = await supabase
        ?.from('material_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching material category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch material category:', error);
      return null;
    }
  }

  // Kategorien nach Hauptkategorie abrufen
  static async getByMainCategory(mainCategory: string): Promise<MaterialCategory[]> {
    try {
      const { data, error } = await supabase
        ?.from('material_categories')
        .select('*')
        .eq('main_category', mainCategory)
        .order('sub_category', { ascending: true });

      if (error) {
        console.error('Error fetching material categories by main category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch material categories by main category:', error);
      return [];
    }
  }

  // Neue Kategorie erstellen
  static async create(category: MaterialCategoryCreate): Promise<MaterialCategory | null> {
    try {
      const { data, error } = await supabase
        ?.from('material_categories')
        .insert([category])
        .select()
        .single();

      if (error) {
        console.error('Error creating material category:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create material category:', error);
      return null;
    }
  }

  // Kategorie aktualisieren
  static async update(id: string, updates: MaterialCategoryUpdate): Promise<MaterialCategory | null> {
    try {
      const { data, error } = await supabase
        ?.from('material_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating material category:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update material category:', error);
      return null;
    }
  }

  // Kategorie löschen
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        ?.from('material_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting material category:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete material category:', error);
      return false;
    }
  }

  // Alle Hauptkategorien abrufen
  static async getMainCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        ?.from('material_categories')
        .select('main_category')
        .order('main_category', { ascending: true });

      if (error) {
        console.error('Error fetching main categories:', error);
        throw error;
      }

      // Unique main categories
      const uniqueCategories = [...new Set(data?.map(item => item.main_category) || [])];
      return uniqueCategories;
    } catch (error) {
      console.error('Failed to fetch main categories:', error);
      return [];
    }
  }

  // Kategorien als Hierarchie abrufen
  static async getHierarchy(): Promise<{ [key: string]: { label: string; children: { [key: string]: string } } }> {
    try {
      const categories = await this.getAll();
      const hierarchy: { [key: string]: { label: string; children: { [key: string]: string } } } = {};

      categories.forEach(category => {
        const mainKey = category.id.split('.')[0]; // z.B. "FB" aus "FB.FL"
        
        if (!hierarchy[mainKey]) {
          hierarchy[mainKey] = {
            label: category.main_category,
            children: {}
          };
        }

        hierarchy[mainKey].children[category.id] = category.sub_category;
      });

      return hierarchy;
    } catch (error) {
      console.error('Failed to build hierarchy:', error);
      return {};
    }
  }
} 