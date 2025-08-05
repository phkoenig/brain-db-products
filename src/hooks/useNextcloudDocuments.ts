import { useState, useEffect, useCallback } from 'react';
import { NextcloudFolder } from '@/lib/nextcloud-optimized';

interface UseNextcloudDocumentsReturn {
  documents: NextcloudFolder[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (path: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export function useNextcloudDocuments(initialPath: string = '/'): UseNextcloudDocumentsReturn {
  const [documents, setDocuments] = useState<NextcloudFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(initialPath);

  const fetchDocuments = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 useNextcloudDocuments: Fetching documents for path: ${path}`);
      
      const response = await fetch(`/api/nextcloud-optimized/documents?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.data);
        setCurrentPath(path);
        console.log(`✅ useNextcloudDocuments: Successfully loaded ${result.data.length} documents`);
      } else {
        throw new Error(result.error || 'Failed to fetch documents');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ useNextcloudDocuments: Error fetching documents:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    if (currentPath) {
      await fetchDocuments(currentPath);
    }
  }, [currentPath, fetchDocuments]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments(initialPath);
  }, [initialPath, fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    refreshDocuments,
  };
} 