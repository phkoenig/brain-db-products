import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export function useMaterialCategories() {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('material_categories')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }

        setCategories(data || []);
      } catch (err) {
        console.error('Fehler beim Laden der Kategorien:', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
} 