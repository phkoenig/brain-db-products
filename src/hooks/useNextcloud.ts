import { useState, useEffect } from 'react';
import { NextcloudFolder } from '@/lib/nextcloud';

interface UseNextcloudReturn {
  folders: NextcloudFolder[];
  loading: boolean;
  error: string | null;
  refreshFolders: (path?: string) => Promise<void>;
  loadSubfolders: (path: string) => Promise<NextcloudFolder[]>;
  expandFolder: (folderPath: string) => Promise<void>;
  expandedFolders: Set<string>;
  loadingExpandedItems: Set<string>;
}

export function useNextcloud(path: string = '/'): UseNextcloudReturn {
  const [folders, setFolders] = useState<NextcloudFolder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loadingExpandedItems, setLoadingExpandedItems] = useState<Set<string>>(new Set());

  const fetchFolders = async (folderPath: string = path) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useNextcloud: Fetching folders for path: ${folderPath}`);
      
      const response = await fetch(`/api/nextcloud/folders?path=${encodeURIComponent(folderPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ useNextcloud: Successfully loaded ${result.data.length} folders`);
        setFolders(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch folders');
      }
      
    } catch (err) {
      console.error('❌ useNextcloud: Error fetching folders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubfolders = async (folderPath: string): Promise<NextcloudFolder[]> => {
    try {
      console.log(`🔍 useNextcloud: Loading subfolders for path: ${folderPath}`);
      
      const response = await fetch(`/api/nextcloud/subfolders?path=${encodeURIComponent(folderPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ useNextcloud: Successfully loaded ${result.data.length} subfolders`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch subfolders');
      }
      
    } catch (err) {
      console.error('❌ useNextcloud: Error loading subfolders:', err);
      throw err;
    }
  };

  // Recursive function to update folder children at any level
  const updateFolderChildren = (folders: NextcloudFolder[], targetPath: string, children: NextcloudFolder[]): NextcloudFolder[] => {
    return folders.map(folder => {
      if (folder.path === targetPath) {
        return {
          ...folder,
          children: children,
          hasChildren: children.length > 0
        };
      }
      
      // Recursively search in children
      if (folder.children) {
        return {
          ...folder,
          children: updateFolderChildren(folder.children, targetPath, children)
        };
      }
      
      return folder;
    });
  };

  const expandFolder = async (folderPath: string) => {
    try {
      console.log(`🔍 useNextcloud: Expanding folder: ${folderPath}`);
      
      // Add to loading state
      setLoadingExpandedItems(prev => new Set([...prev, folderPath]));
      
      // Add to expanded folders set
      setExpandedFolders(prev => new Set([...prev, folderPath]));
      
      // Load subfolders for this path
      const subfolders = await loadSubfolders(folderPath);
      
      // Update folders with children recursively
      setFolders(prevFolders => {
        return updateFolderChildren(prevFolders, folderPath, subfolders);
      });
      
      console.log(`✅ useNextcloud: Successfully expanded folder with ${subfolders.length} children`);
      
    } catch (err) {
      console.error('❌ useNextcloud: Error expanding folder:', err);
      // Remove from expanded folders if failed
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderPath);
        return newSet;
      });
    } finally {
      // Remove from loading state
      setLoadingExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderPath);
        return newSet;
      });
    }
  };

  const refreshFolders = async (folderPath?: string) => {
    await fetchFolders(folderPath || path);
  };

  useEffect(() => {
    fetchFolders();
  }, [path]);

  return {
    folders,
    loading,
    error,
    refreshFolders,
    loadSubfolders,
    expandFolder,
    expandedFolders,
    loadingExpandedItems
  };
} 