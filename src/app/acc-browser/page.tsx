'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/ui/components/Button';
import { toast } from 'react-hot-toast';

interface ACCProject {
  id: string;
  name: string;
  status: string;
  projectType?: string;
}

interface ACCFolder {
  id: string;
  type: 'folders';
  attributes: {
    name: string;
    displayName: string;
  };
}

interface ACCItem {
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

interface ACCContents {
  folders: ACCFolder[];
  items: ACCItem[];
}

export default function ACCBrowserPage() {
  const [projects, setProjects] = useState<ACCProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ACCProject | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentContents, setCurrentContents] = useState<ACCContents | null>(null);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);

  // Lade Projekte beim Start
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/acc/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        toast.success(`${data.projects?.length || 0} ACC-Projekte geladen`);
      } else {
        throw new Error('Projekte konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
      toast.error('Fehler beim Laden der Projekte');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectContents = async (projectId: string, folderId?: string) => {
    setLoading(true);
    try {
      const url = folderId 
        ? `/api/acc/projects/${projectId}/folders/${folderId}/contents`
        : `/api/acc/projects/${projectId}/contents`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCurrentContents(data);
        toast.success(`Inhalte geladen: ${data.folders?.length || 0} Ordner, ${data.items?.length || 0} Dateien`);
      } else {
        throw new Error('Projekt-Inhalte konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekt-Inhalte:', error);
      toast.error('Fehler beim Laden der Projekt-Inhalte');
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (project: ACCProject) => {
    setSelectedProject(project);
    setCurrentPath([]);
    setBreadcrumbs([{ id: project.id, name: project.name }]);
    await loadProjectContents(project.id);
  };

  const openFolder = async (folder: ACCFolder) => {
    if (!selectedProject) return;
    
    const newPath = [...currentPath, folder.attributes.name];
    const newBreadcrumbs = [...breadcrumbs, { id: folder.id, name: folder.attributes.displayName }];
    
    setCurrentPath(newPath);
    setBreadcrumbs(newBreadcrumbs);
    await loadProjectContents(selectedProject.id, folder.id);
  };

  const navigateToBreadcrumb = async (index: number) => {
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
  };

  const getFileStatus = (item: ACCItem) => {
    const supportedExtensions = [
      '.dwg', '.rvt', '.ifc', '.nwd', '.nwc', '.3ds', '.obj', '.stl', '.fbx',
      '.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'
    ];
    
    const extension = item.attributes.extension?.type?.toLowerCase();
    if (supportedExtensions.includes(`.${extension}`)) {
      return { status: 'viewer-ready', icon: '🟢', description: 'Direkt im Viewer anzeigbar' };
    }
    
    const cadExtensions = ['.dwg', '.rvt', '.ifc', '.nwd', '.nwc'];
    if (cadExtensions.includes(`.${extension}`)) {
      return { status: 'needs-translation', icon: '🔴', description: 'Translation nötig (~2€)' };
    }
    
    return { status: 'unknown', icon: '⚪', description: 'Format unbekannt' };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🏗️ ACC Construction Cloud Browser</h1>
        <p className="text-gray-600 mb-4">
          Durchsuche deine ACC-Projekte und Dateien. Alle Dateien sind bereits für den Viewer übersetzt!
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-green-800 mb-2">✅ ACC Vorteile:</h2>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>Kostenlos:</strong> Alle Dateien sind bereits übersetzt</li>
            <li>• <strong>Schnell:</strong> Keine Wartezeit auf Translation</li>
            <li>• <strong>Organisiert:</strong> Projekte und Ordner strukturiert</li>
            <li>• <strong>Kollaborativ:</strong> Teile Projekte mit Kunden</li>
          </ul>
        </div>
      </div>

      {/* Projekt-Auswahl */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">📁 ACC-Projekte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedProject?.id === project.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => selectProject(project)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600">ID: {project.id}</p>
                  <p className="text-sm text-gray-600">Status: {project.status}</p>
                  {project.projectType && (
                    <p className="text-sm text-gray-600">Typ: {project.projectType}</p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  project.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breadcrumbs */}
      {selectedProject && breadcrumbs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">📍 Navigation</h2>
          <div className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center">
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="mx-2 text-gray-400">/</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projekt-Inhalte */}
      {selectedProject && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            📂 Inhalte: {selectedProject.name}
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Lade Inhalte...</p>
            </div>
          ) : currentContents ? (
            <div className="space-y-4">
              {/* Ordner */}
              {currentContents.folders && currentContents.folders.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">📁 Ordner</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentContents.folders.map((folder) => (
                      <div
                        key={folder.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => openFolder(folder)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📁</span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {folder.attributes.displayName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {folder.attributes.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dateien */}
              {currentContents.items && currentContents.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">📄 Dateien</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentContents.items.map((item) => {
                      const fileStatus = getFileStatus(item);
                      return (
                        <div
                          key={item.id}
                          className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">📄</span>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.attributes.displayName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.attributes.extension?.type?.toUpperCase()} • {formatFileSize(item.attributes.size)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg">{fileStatus.icon}</div>
                              <p className="text-xs text-gray-600">{fileStatus.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Leerer Zustand */}
              {(!currentContents.folders || currentContents.folders.length === 0) &&
               (!currentContents.items || currentContents.items.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p>Dieser Ordner ist leer</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">📂</span>
              <p>Klicke auf ein Projekt, um dessen Inhalte anzuzeigen</p>
            </div>
          )}
        </div>
      )}

      {/* Aktions-Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={loadProjects}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          🔄 Projekte neu laden
        </Button>
        
        {selectedProject && (
          <Button
            onClick={() => {
              setSelectedProject(null);
              setCurrentPath([]);
              setBreadcrumbs([]);
              setCurrentContents(null);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            🏠 Zurück zur Projektauswahl
          </Button>
        )}
      </div>
    </div>
  );
}
