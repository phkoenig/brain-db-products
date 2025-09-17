"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface F16Settings {
  id?: string;
  project_id: string;
  model_path?: string;
  created_at?: string;
  updated_at?: string;
}

export function useF16Settings() {
  const [settings, setSettings] = useState<F16Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('f16_settings')
        .select('*')
        .eq('project_id', 'f16')
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No settings found, create default
          console.log('🔍 F16 Settings: No settings found, creating default');
          const { data: newSettings, error: insertError } = await supabase
            .from('f16_settings')
            .insert({
              project_id: 'f16',
              model_path: null
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          setSettings(newSettings);
        } else {
          throw fetchError;
        }
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('🔍 F16 Settings: Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<F16Settings>) => {
    try {
      setError(null);

      if (!settings?.id) {
        // Create new settings
        const { data, error: insertError } = await supabase
          .from('f16_settings')
          .insert({
            project_id: 'f16',
            ...updates
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setSettings(data);
      } else {
        // Update existing settings
        const { data, error: updateError } = await supabase
          .from('f16_settings')
          .update(updates)
          .eq('id', settings.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        setSettings(data);
      }

      console.log('🔍 F16 Settings: Settings updated successfully');
      return true;
    } catch (err) {
      console.error('🔍 F16 Settings: Error updating settings:', err);
      console.error('🔍 F16 Settings: Error type:', typeof err);
      console.error('🔍 F16 Settings: Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('🔍 F16 Settings: Error stack:', err instanceof Error ? err.stack : 'No stack');
      
      // Handle Supabase errors specifically
      if (err && typeof err === 'object' && 'message' in err) {
        setError(err.message as string);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred while updating settings');
      }
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  };
}
