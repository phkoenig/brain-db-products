import { useState, useEffect, useCallback } from 'react';
import { NextcloudFolder } from '@/lib/nextcloud-rest';

interface UseNextcloudRestReturn {
  folders: NextcloudFolder[];
  loading: boolean;
  error: string | null;
  expandFolder: (path: string) => Promise<void>;
  expandedFolders: Set<string>;
  loadingExpandedItems: Set<string>;
}

export function useNextcloudRest(path: string = '/'): UseNextcloudRestReturn {
  const [folders, setFolders] = useState<NextcloudFolder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loadingExpandedItems, setLoadingExpandedItems] = useState<Set<string>>(new Set());

  const fetchFolders = async (folderPath: string = path) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useNextcloudRest: Fetching folders for path: ${folderPath}`);
      
      const response = await fetch(`/api/nextcloud-rest/folders?path=${encodeURIComponent(folderPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ useNextcloudRest: Successfully loaded ${result.data.length} folders`);
        setFolders(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch folders');
      }
      
    } catch (err) {
      console.error('❌ useNextcloudRest: Error fetching folders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubfolders = async (folderPath: string): Promise<NextcloudFolder[]> => {
    try {
      console.log(`🔍 useNextcloudRest: Loading subfolders for path: ${folderPath}`);
      
      const response = await fetch(`/api/nextcloud-rest/subfolders?path=${encodeURIComponent(folderPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ useNextcloudRest: Successfully loaded ${result.data.length} subfolders`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch subfolders');
      }
      
    } catch (err) {
      console.error('❌ useNextcloudRest: Error loading subfolders:', err);
      throw err;
    }
  };

  const updateFolderChildren = useCallback((folders: NextcloudFolder[], targetPath: string, newChildren: NextcloudFolder[]): NextcloudFolder[] => {
    return folders.map(folder => {
      if (folder.path === targetPath) {
        return {
          ...folder,
          children: newChildren,
          hasChildren: newChildren.length > 0
        };
      }
      
      if (folder.children) {
        return {
          ...folder,
          children: updateFolderChildren(folder.children, targetPath, newChildren)
        };
      }
      
      return folder;
    });
  }, []);

  const expandFolder = useCallback(async (folderPath: string) => {
    try {
      // Add to loading set
      setLoadingExpandedItems(prev => new Set(prev).add(folderPath));
      
      console.log(`🔍 useNextcloudRest: Expanding folder: ${folderPath}`);
      
      // Load subfolders
      const subfolders = await loadSubfolders(folderPath);
      
      // Update folders state with new children
      setFolders(prevFolders => updateFolderChildren(prevFolders, folderPath, subfolders));
      
      // Add to expanded set
      setExpandedFolders(prev => new Set(prev).add(folderPath));
      
      console.log(`✅ useNextcloudRest: Successfully expanded folder: ${folderPath}`);
      
    } catch (error) {
      console.error('❌ useNextcloudRest: Error expanding folder:', error);
      throw error;
    } finally {
      // Remove from loading set
      setLoadingExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderPath);
        return newSet;
      });
    }
  }, [updateFolderChildren]);

  // Initial load
  useEffect(() => {
    fetchFolders(path);
  }, [path]);

  return {
    folders,
    loading,
    error,
    expandFolder,
    expandedFolders,
    loadingExpandedItems
  };
} 