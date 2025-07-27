import { useState, useEffect } from 'react';
import { MaterialCategory } from '@/types/material-categories';
import { MaterialCategoriesAPI } from '@/lib/material-categories';

export function useMaterialCategories() {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alle Kategorien laden
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("3. [Hook] Calling API to get all categories...");
      const data = await MaterialCategoriesAPI.getAll();
      console.log("4. [Hook] Data received from API:", data);
      setCategories(data);
    } catch (err) {
      console.error("5. [Hook] Error loading categories:", err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Kategorie erstellen
  const createCategory = async (category: Omit<MaterialCategory, 'created_at' | 'updated_at'>) => {
    try {
      const newCategory = await MaterialCategoriesAPI.create(category);
      if (newCategory) {
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    }
  };

  // Kategorie aktualisieren
  const updateCategory = async (id: string, updates: Partial<MaterialCategory>) => {
    try {
      const updatedCategory = await MaterialCategoriesAPI.update(id, updates);
      if (updatedCategory) {
        setCategories(prev => 
          prev.map(cat => cat.id === id ? updatedCategory : cat)
        );
        return updatedCategory;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    }
  };

  // Kategorie löschen
  const deleteCategory = async (id: string) => {
    try {
      const success = await MaterialCategoriesAPI.delete(id);
      if (success) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        return true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      throw err;
    }
  };

  // Kategorien nach Hauptkategorie filtern
  const getCategoriesByMainCategory = (mainCategory: string) => {
    return categories.filter(cat => cat.main_category === mainCategory);
  };

  // Hauptkategorien abrufen
  const getMainCategories = () => {
    return [...new Set(categories.map(cat => cat.main_category))].sort();
  };

  // Initial laden
  useEffect(() => {
    console.log("0. [Hook] useEffect triggered. Initializing category load.");
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByMainCategory,
    getMainCategories,
  };
} 