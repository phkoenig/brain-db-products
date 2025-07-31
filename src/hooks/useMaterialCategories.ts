import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MaterialCategory {
  id: string;
  main_category: string;
  sub_category: string;
  label: string;
  created_at: string;
  updated_at: string;
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

        // Fallback-Kategorien falls Supabase-Tabelle nicht existiert
        const fallbackCategories = [
          { id: 'FB.FL', main_category: 'Fußbodenbeläge', sub_category: 'Fliesen', label: 'Fliesen', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'FB.PL', main_category: 'Fußbodenbeläge', sub_category: 'Platten', label: 'Platten', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'FB.TE', main_category: 'Fußbodenbeläge', sub_category: 'Teppich', label: 'Teppich', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'WA.FL', main_category: 'Wandbeläge', sub_category: 'Fliesen', label: 'Wandfliesen', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'WA.PL', main_category: 'Wandbeläge', sub_category: 'Platten', label: 'Wandplatten', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'DA.WA', main_category: 'Dämmstoffe', sub_category: 'Wärme', label: 'Wärmedämmung', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'DA.SC', main_category: 'Dämmstoffe', sub_category: 'Schall', label: 'Schalldämmung', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'TU.IN', main_category: 'Türen', sub_category: 'Innen', label: 'Innentüren', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'TU.AU', main_category: 'Türen', sub_category: 'Außen', label: 'Außentüren', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'FE.FE', main_category: 'Fenster', sub_category: 'Fenster', label: 'Fenster', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'SA.SA', main_category: 'Sanitär', sub_category: 'Sanitär', label: 'Sanitäranlagen', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'EL.EL', main_category: 'Elektro', sub_category: 'Elektro', label: 'Elektroinstallation', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ];

        try {
          console.log('Lade Kategorien von Supabase...');
          const { data, error } = await supabase
            .from('material_categories')
            .select('*')
            .order('main_category, sub_category');

          if (error) {
            console.warn('Supabase material_categories Tabelle nicht verfügbar, verwende Fallback-Kategorien:', error);
            setCategories(fallbackCategories);
          } else {
            if (data && data.length > 0) {
              console.log(`✅ ${data.length} Kategorien erfolgreich von Supabase geladen`);
              setCategories(data);
            } else {
              console.warn('Keine Kategorien in Supabase gefunden, verwende Fallback-Kategorien');
              setCategories(fallbackCategories);
            }
          }
        } catch (err) {
          console.warn('Fehler beim Laden der Kategorien, verwende Fallback:', err);
          setCategories(fallbackCategories);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Kategorien:', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Hilfsfunktion um Kategorien nach Hauptkategorien zu gruppieren
  const getGroupedCategories = () => {
    const grouped = categories.reduce((acc, category) => {
      const mainCat = category.main_category;
      if (!acc[mainCat]) {
        acc[mainCat] = [];
      }
      acc[mainCat].push(category);
      return acc;
    }, {} as Record<string, MaterialCategory[]>);
    
    return grouped;
  };

  return { categories, loading, error, getGroupedCategories };
} 