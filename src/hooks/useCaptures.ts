import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Capture } from '@/types/captures';

export function useCaptures() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCaptures = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('captures')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setCaptures(data || []);
    } catch (err) {
      console.error('Error loading captures:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCaptureById = useCallback(async (id: number): Promise<Capture | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 DEBUG: loadCaptureById aufgerufen mit ID:', id);
      const { data, error: supabaseError } = await supabase
        .from('captures')
        .select('*')
        .eq('id', id)
        .single();

      console.log('🔍 DEBUG: Supabase Query Ergebnis:', { data, error: supabaseError });

      if (supabaseError) {
        console.log('🔍 DEBUG: Supabase Fehler:', supabaseError);
        throw new Error(supabaseError.message);
      }

      console.log('🔍 DEBUG: Capture Daten gefunden:', data);
      return data;
    } catch (err) {
      console.error('Error loading capture by ID:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Note: loadCaptures is available but not called automatically
  // Call loadCaptures() manually when needed

  return {
    captures,
    loading,
    error,
    loadCaptures,
    loadCaptureById,
  };
}