"use client";

import { useState, useCallback } from 'react';

export interface F16BIMModel {
  id: string;
  name: string;
  displayName: string;
  lastModifiedTime: string;
  size: number;
  extension: {
    type: string;
    version: string;
    schema: {
      href: string;
    };
    data: any;
  };
}

export interface F16ACCData {
  file: F16BIMModel;
  urn: string;
  token: string;
}

export interface UseF16ACCReturn {
  bimModel: F16ACCData | null;
  loading: boolean;
  error: string | null;
  loadBIMModel: () => Promise<boolean>;
  openViewer: (viewName?: string) => void;
}

export function useF16ACC(): UseF16ACCReturn {
  const [bimModel, setBimModel] = useState<F16ACCData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBIMModel = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 F16 ACC: Loading BIM model...');
      
      const response = await fetch('/api/zepta/f16/bim-model');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load BIM model');
      }
      
      const data = await response.json();
      console.log('🔍 F16 ACC: BIM model loaded successfully:', data);
      
      setBimModel(data);
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('🔍 F16 ACC: Error loading BIM model:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const openViewer = useCallback((viewName: string = 'KP-AXO-ZZ') => {
    if (!bimModel) {
      console.error('🔍 F16 ACC: No BIM model loaded');
      return;
    }
    
    console.log('🔍 F16 ACC: Opening viewer with view:', viewName);
    
    // Create viewer URL with specific view
    const viewerUrl = `/zepta/f16/viewer?urn=${encodeURIComponent(bimModel.urn)}&token=${encodeURIComponent(bimModel.token)}&view=${encodeURIComponent(viewName)}`;
    
    // Open in new tab
    window.open(viewerUrl, '_blank');
  }, [bimModel]);

  return {
    bimModel,
    loading,
    error,
    loadBIMModel,
    openViewer
  };
}
