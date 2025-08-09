import { useState, useCallback, useEffect } from 'react';

export interface ACCProject {
  id: string;
  name: string;
  status: string;
  projectType?: string;
}

export interface ACCFolder {
  id: string;
  type: 'folders';
  attributes: {
    name: string;
    displayName: string;
  };
}

export interface ACCItem {
  id: string;
  type: 'items';
  attributes: {
    name: string;
    displayName: string;
    extension: {
      type: string;
    };
    size: number;
  };
}

export interface ACCContents {
  folders: ACCFolder[];
  items: ACCItem[];
}

export interface UseACCReturn {
  projects: ACCProject[];
  selectedProject: ACCProject | null;
  currentContents: ACCContents | null;
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  selectProject: (project: ACCProject) => Promise<void>;
  loadProjectContents: (projectId: string, folderId?: string) => Promise<void>;
  openFolder: (folder: ACCFolder) => Promise<void>;
  navigateToBreadcrumb: (index: number) => Promise<void>;
  currentPath: string[];
  breadcrumbs: Array<{ id: string; name: string }>;
}

export function useACC(): UseACCReturn {
  const [projects, setProjects] = useState<ACCProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ACCProject | null>(null);
  const [currentContents, setCurrentContents] = useState<ACCContents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 useACC: Loading projects...');
      
      const response = await fetch('/api/acc/projects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProjects(result.projects || []);
        console.log(`✅ useACC: Successfully loaded ${result.projects?.length || 0} projects`);
      } else {
        throw new Error(result.error?.message || 'Failed to load projects');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ useACC: Error loading projects:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjectContents = useCallback(async (projectId: string, folderId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 useACC: Loading project contents for project ${projectId}, folder ${folderId || 'root'}`);
      
      const url = folderId 
        ? `/api/acc/projects/${projectId}/folders/${folderId}/contents`
        : `/api/acc/projects/${projectId}/contents`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentContents(result);
        console.log(`✅ useACC: Successfully loaded contents: ${result.folders?.length || 0} folders, ${result.items?.length || 0} items`);
      } else {
        throw new Error(result.error?.message || 'Failed to load project contents');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ useACC: Error loading project contents:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectProject = useCallback(async (project: ACCProject) => {
    setSelectedProject(project);
    setCurrentPath([]);
    setBreadcrumbs([{ id: project.id, name: project.name }]);
    await loadProjectContents(project.id);
  }, [loadProjectContents]);

  const openFolder = useCallback(async (folder: ACCFolder) => {
    if (!selectedProject) return;
    
    const newPath = [...currentPath, folder.attributes.name];
    const newBreadcrumbs = [...breadcrumbs, { id: folder.id, name: folder.attributes.displayName }];
    
    setCurrentPath(newPath);
    setBreadcrumbs(newBreadcrumbs);
    await loadProjectContents(selectedProject.id, folder.id);
  }, [selectedProject, currentPath, breadcrumbs, loadProjectContents]);

  const navigateToBreadcrumb = useCallback(async (index: number) => {
    if (!selectedProject) return;
    
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    const newPath = newBreadcrumbs.slice(1).map(b => b.name);
    
    setBreadcrumbs(newBreadcrumbs);
    setCurrentPath(newPath);
    
    if (index === 0) {
      // Zurück zum Projekt-Root
      await loadProjectContents(selectedProject.id);
    } else {
      // Zu einem spezifischen Ordner
      const folderId = newBreadcrumbs[index].id;
      await loadProjectContents(selectedProject.id, folderId);
    }
  }, [selectedProject, breadcrumbs, loadProjectContents]);

  // Initial load projects
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    selectedProject,
    currentContents,
    loading,
    error,
    loadProjects,
    selectProject,
    loadProjectContents,
    openFolder,
    navigateToBreadcrumb,
    currentPath,
    breadcrumbs,
  };
}
