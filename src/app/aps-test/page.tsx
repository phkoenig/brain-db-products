'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/ui/components/Button';
import { Alert } from '@/ui/components/Alert';
import { Progress } from '@/ui/components/Progress';
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';
import { useDropzone } from 'react-dropzone';
import { Toaster, toast } from 'react-hot-toast';

// Define the shape of the Autodesk global object
declare global {
  interface Window {
    Autodesk: any;
  }
}

interface UploadedFile {
  file: File;
  status: 'uploading' | 'translating' | 'success' | 'failed';
  progress: number;
  urn?: string;
  error?: string;
}

export default function APSTestPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  const [accFoldersTest, setAccFoldersTest] = useState<any>(null);
  const [isAccTestLoading, setIsAccTestLoading] = useState(false);
  const [accProjectsList, setAccProjectsList] = useState<any>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Load Autodesk Viewer SDK
  useEffect(() => {
    const loadViewerScript = () => {
      if (window.Autodesk) {
        setIsSdkLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js";
      script.async = true;
      script.onload = () => {
        console.log("APS Viewer SDK loaded.");
        setIsSdkLoaded(true);
      };
      script.onerror = () => {
        toast.error("Failed to load Autodesk Viewer SDK.");
      };
      document.body.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css';
      document.head.appendChild(link);

      return () => {
        document.body.removeChild(script);
        document.head.removeChild(link);
      };
    };
    loadViewerScript();
  }, []);

  const initializeViewer = useCallback(async (urn: string) => {
    if (!isSdkLoaded || !viewerRef.current) {
      toast.error("Viewer SDK not loaded or container not ready.");
      return;
    }
    
    try {
      const tokenResponse = await fetch('/api/aps/viewer-token');
      if (!tokenResponse.ok) throw new Error("Failed to get viewer token");
      const { access_token } = await tokenResponse.json();

      const options = {
        env: 'AutodeskProduction',
        getAccessToken: (onGetAccessToken: (token: string, expire: number) => void) => {
          onGetAccessToken(access_token, 3599);
        },
      };

      window.Autodesk.Viewing.Initializer(options, () => {
        const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current!);
        
        // Viewer-Instanz speichern
        setViewerInstance(viewer);
        
        // Standard-Navigation und Tools aktivieren
        viewer.setTheme('light-theme');
        
        // Viewer starten
        viewer.start();
        
        const documentId = 'urn:' + urn;
        window.Autodesk.Viewing.Document.load(documentId, (doc) => {
          const viewables = doc.getRoot().getDefaultGeometry();
          viewer.loadDocumentNode(doc, viewables);
          
          // Nach dem Laden des Models: Standard-Tools aktivieren
          viewer.addEventListener(window.Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
            console.log('Model loaded, activating standard tools...');
            
            // Standard-Navigation aktivieren
            viewer.setNavigationLock(false);
            
            // Standard-Tools aktivieren
            try {
              // Measurement-Tool aktivieren
              if (viewer.toolController) {
                viewer.toolController.activateTool('measure');
              }
              
              // Explode-Tool aktivieren (falls verfügbar)
              if (viewer.impl && viewer.impl.toolController) {
                // Explode-Funktionalität
                viewer.addEventListener(window.Autodesk.Viewing.ISOLATE_EVENT, (event) => {
                  console.log('Isolation event:', event);
                });
              }
              
              // Section-Plane-Tool aktivieren
              if (viewer.toolController) {
                viewer.toolController.activateTool('section');
              }
              
              // ViewCube aktivieren
              if (viewer.navigation) {
                viewer.navigation.setViewCube('NE');
              }
              
              // Standard-Kamera-Position setzen
              viewer.navigation.setView({ 
                position: { x: 100, y: 100, z: 100 },
                target: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 0, z: 1 }
              });
              
              console.log('Standard tools activated successfully');
            } catch (toolError) {
              console.warn('Some tools could not be activated:', toolError);
            }
          });
          
          setIsViewerInitialized(true);
          toast.success("Model loaded successfully with navigation tools!");
        }, (errorCode, errorMsg) => {
          console.error('Model Loading failed:', errorCode, errorMsg);
          toast.error(`Failed to load model: ${errorMsg} (${errorCode})`);
        });
      });
    } catch (error) {
      console.error("Viewer initialization failed:", error);
      toast.error("Viewer initialization failed.");
    }
  }, [isSdkLoaded]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const newFile: UploadedFile = { file, status: 'uploading', progress: 0 };
    setUploadedFiles([newFile]); // Replace previous files

    const toastId = toast.loading('Uploading file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch('/api/aps/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { urn } = await uploadResponse.json();
      toast.success('Upload complete!', { id: toastId });
      setUploadedFiles([{ ...newFile, status: 'translating', urn }]);

      await startTranslation(urn, newFile);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed.', { id: toastId });
      setUploadedFiles([{ ...newFile, status: 'failed', error: 'Upload failed' }]);
    }
  }, []);
  
  const startTranslation = async (urn: string, fileState: UploadedFile) => {
    const toastId = toast.loading('Starting translation...');

    try {
        const translateResponse = await fetch('/api/aps/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urn }),
        });

        if (!translateResponse.ok) {
            throw new Error('Translation failed to start');
        }
        
        toast.success('Translation started...', { id: toastId });
        setUploadedFiles([{ ...fileState, status: 'translating', urn: urn }]);
        
        // Monitor translation progress
        const intervalId = setInterval(async () => {
            const statusResponse = await fetch(`/api/aps/translate?urn=${urn}`);
            const { status, progress } = await statusResponse.json();

            setUploadedFiles([{ ...fileState, status: 'translating', urn: urn, progress: parseInt(progress) || 0 }]);

            if (status === 'success') {
                clearInterval(intervalId);
                toast.success('Translation successful!', { id: toastId });
                setUploadedFiles([{ ...fileState, status: 'success', urn: urn, progress: 100 }]);
            } else if (status === 'failed') {
                clearInterval(intervalId);
                toast.error('Translation failed.', { id: toastId });
                setUploadedFiles([{ ...fileState, status: 'failed', urn: urn, error: 'Translation failed' }]);
            }
        }, 5000); // Poll every 5 seconds

    } catch (error) {
        console.error('Translation error:', error);
        toast.error('Translation failed to start.', { id: toastId });
        setUploadedFiles([{ ...fileState, status: 'failed', urn, error: 'Translation failed to start' }]);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const selectedFile = uploadedFiles[0];

  // ACC Projects List Test
  const testAccProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const response = await fetch('/api/acc/projects-list');
      const result = await response.json();
      setAccProjectsList(result);
      if (result.success) {
        toast.success(`ACC Projects Test erfolgreich! ${result.summary.accProjects} Projekte gefunden`);
      } else {
        toast.error('ACC Projects Test fehlgeschlagen');
      }
    } catch (error) {
      console.error('ACC Projects Test error:', error);
      toast.error('ACC Projects Test fehlgeschlagen');
    } finally {
      setIsProjectsLoading(false);
    }
  };

  // ACC Folders Test für ausgewähltes Projekt
  const testAccFolders = async () => {
    if (!selectedProject) {
      toast.error('Bitte wähle zuerst ein Projekt aus!');
      return;
    }
    
    setIsAccTestLoading(true);
    try {
      // Zuerst versuche die korrekte Projekt-ID zu finden
      console.log('🔍 Suche korrekte Projekt-ID für:', selectedProject.id);
      const findResponse = await fetch(`/api/acc/find-correct-project-id?projectId=${selectedProject.id}`);
      const findResult = await findResponse.json();
      
      if (findResult.success) {
        console.log('✅ Korrekte Projekt-ID gefunden:', findResult.correctFormat);
        setAccFoldersTest(findResult);
        toast.success(`ACC Projekt-ID gefunden: ${findResult.correctFormat.name} - ${findResult.correctFormat.id}`);
      } else {
        // Fallback: Versuche den alten Test
        console.log('⚠️ Fallback zu altem Test...');
        const response = await fetch(`/api/acc/test-folders?projectId=${selectedProject.id}`);
        const result = await response.json();
        setAccFoldersTest(result);
        if (result.success) {
          toast.success(`ACC Folders Test erfolgreich für Projekt: ${selectedProject.name}!`);
        } else {
          toast.error('ACC Folders Test fehlgeschlagen');
        }
      }
    } catch (error) {
      console.error('ACC Folders Test error:', error);
      toast.error('ACC Folders Test fehlgeschlagen');
    } finally {
      setIsAccTestLoading(false);
    }
  };

  return (
    <DefaultPageLayout>
      <Toaster position="bottom-right" />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">APS Viewer Test Page</h1>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-2">🎯 Verfügbare Tools:</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>📏 Messen:</strong> Distanzen und Winkel messen</li>
            <li>• <strong>✂️ Schnitt:</strong> Section-Planes für Querschnitte</li>
            <li>• <strong>💥 Explode View:</strong> Alle Komponenten sichtbar machen</li>
            <li>• <strong>🧊 ViewCube:</strong> Standard-Ansichten (TOP, FRONT, etc.)</li>
            <li>• <strong>🔍 Zoom to Fit:</strong> Modell optimal einpassen</li>
            <li>• <strong>🔄 Reset View:</strong> Standard-Kamera-Position</li>
            <li>• <strong>📷 Camera Info:</strong> Aktuelle Kameraposition (Console)</li>
          </ul>
        </div>

        {/* ACC Folders Test Section */}
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold text-green-800 mb-2">🏗️ ACC Construction Cloud Test</h2>
          <p className="text-sm text-green-700 mb-3">
            Test der Autodesk Construction Cloud Integration. Diese Seite testet die Authentifizierung und den Zugriff auf deine ACC-Projekte.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              onClick={testAccProjects}
              disabled={isProjectsLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProjectsLoading ? '🔄 Lade...' : '📋 ACC Projekte Liste'}
            </Button>
            <Button
              onClick={testAccFolders}
              disabled={isAccTestLoading || !selectedProject}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isAccTestLoading ? '🔄 Teste...' : `📁 ACC Ordner Test${selectedProject ? ` (${selectedProject.name})` : ''}`}
            </Button>
          </div>

          {accFoldersTest && (
            <div className="mt-4 p-3 bg-white border rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📊 ACC Test Ergebnisse:</h3>
              
              {accFoldersTest.success ? (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>📁 Root-Ordner:</strong>
                      <div>Ordner: {accFoldersTest.tests.rootContents.folders}</div>
                      <div>Dateien: {accFoldersTest.tests.rootContents.items}</div>
                    </div>
                    <div>
                      <strong>🔍 Viewer-kompatible Dateien:</strong>
                      <div>Anzahl: {accFoldersTest.tests.viewerCompatibleFiles.count}</div>
                    </div>
                  </div>
                  
                  {accFoldersTest.tests.viewerCompatibleFiles.count > 0 && (
                    <div className="mt-3">
                      <strong>📄 Verfügbare Dateien:</strong>
                      <div className="mt-1 space-y-1">
                        {accFoldersTest.tests.viewerCompatibleFiles.files.map((file: any, index: number) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                            📄 {file.name} ({file.extension}) - {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Größe unbekannt'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Zeige alle Ordner */}
                  {accFoldersTest.tests.rootContents.folders > 0 && (
                    <div className="mt-3">
                      <strong>📁 Verfügbare Ordner ({accFoldersTest.tests.rootContents.folders}):</strong>
                      <div className="mt-1 space-y-1">
                        {accFoldersTest.tests.rootContents.data.folders.map((folder: any, index: number) => (
                          <div key={index} className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                            📁 {folder.attributes?.displayName || folder.attributes?.name || folder.id}
                            <div className="text-gray-500 text-xs mt-1">
                              ID: {folder.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {accFoldersTest.tests.topFolders.available && (
                    <div className="mt-3">
                      <strong>📂 TopFolders verfügbar:</strong> ✅
                    </div>
                  )}
                  
                  {accFoldersTest.tests.firstFolderContents.available && (
                    <div className="mt-3">
                      <strong>📂 Erster Ordner-Inhalt:</strong>
                      <div>Unterordner: {accFoldersTest.tests.firstFolderContents.folders}</div>
                      <div>Dateien: {accFoldersTest.tests.firstFolderContents.items}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  ❌ Test fehlgeschlagen: {accFoldersTest.error}
                </div>
              )}
            </div>
          )}

          {/* ACC Projects List Results */}
          {accProjectsList && (
            <div className="mt-4 p-3 bg-white border rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📋 ACC Projekte Liste:</h3>
              
              {accProjectsList.success ? (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <strong>🏢 Hubs:</strong> {accProjectsList.summary.totalHubs}
                    </div>
                    <div>
                      <strong>📋 Alle Projekte:</strong> {accProjectsList.summary.totalProjects}
                    </div>
                    <div>
                      <strong>🏗️ ACC Projekte:</strong> {accProjectsList.summary.accProjects}
                    </div>
                    <div>
                      <strong>🔍 Filter-Ergebnisse:</strong>
                      <div className="text-xs">
                        F1: {accProjectsList.summary.filterResults?.filter1 || 0} | 
                        F2: {accProjectsList.summary.filterResults?.filter2 || 0} | 
                        F3: {accProjectsList.summary.filterResults?.filter3 || 0} | 
                        F4: {accProjectsList.summary.filterResults?.filter4 || 0}
                      </div>
                    </div>
                  </div>
                  
                  {/* Alle Projekte anzeigen (Debug) */}
                  <div className="mt-4">
                    <strong>🔍 Alle Projekte (Debug):</strong>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {accProjectsList.allProjects?.slice(0, 10).map((project: any, index: number) => (
                        <div key={index} className="text-xs bg-blue-50 p-1 rounded border">
                          <div className="font-semibold">📋 {project.name}</div>
                          <div>Type: {project.projectType}</div>
                          <div>Hub: {project.hub.name}</div>
                        </div>
                      ))}
                      {accProjectsList.allProjects?.length > 10 && (
                        <div className="text-xs text-gray-500">
                          ... und {accProjectsList.allProjects.length - 10} weitere Projekte
                        </div>
                      )}
                    </div>
                  </div>

                  {accProjectsList.projects.length > 0 ? (
                    <div className="mt-4">
                      <strong>📋 Verfügbare ACC-Projekte (klicke zum Auswählen):</strong>
                      <div className="mt-2 space-y-2">
                        {accProjectsList.projects.map((project: any, index: number) => (
                          <div 
                            key={index} 
                            className={`text-xs p-2 rounded border cursor-pointer transition-colors ${
                              selectedProject?.id === project.id 
                                ? 'bg-green-100 border-green-400' 
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedProject(project)}
                          >
                            <div className="font-semibold">🏗️ {project.name}</div>
                            <div>ID: {project.id}</div>
                            <div>Type: {project.projectType}</div>
                            <div>Hub: {project.hub.name}</div>
                            <div>Status: {project.status}</div>
                            {project.description && (
                              <div className="text-gray-600">Beschreibung: {project.description}</div>
                            )}
                            {selectedProject?.id === project.id && (
                              <div className="text-green-600 font-semibold mt-1">✅ Ausgewählt</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-orange-600">
                      ⚠️ Keine ACC-Projekte gefunden
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  ❌ Projekte-Liste fehlgeschlagen: {accProjectsList.error}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input {...getInputProps()} />
          <p>Drag 'n' drop a file here, or click to select a file</p>
        </div>

        {selectedFile && (
          <div className="mt-4">
            <h2 className="font-semibold">{selectedFile.file.name}</h2>
            <div className="flex items-center gap-4">
              <span className="capitalize">{selectedFile.status}</span>
              {(selectedFile.status === 'uploading' || selectedFile.status === 'translating') && (
                <Progress value={selectedFile.progress} className="w-full" />
              )}
            </div>
            {selectedFile.status === 'failed' && (
              <Alert variant="destructive">{selectedFile.error}</Alert>
            )}
            <Button
              onClick={() => initializeViewer(selectedFile.urn!)}
              disabled={selectedFile.status !== 'success' || !isSdkLoaded}
              className="mt-2"
            >
              Anzeigen
            </Button>
          </div>
        )}

        <div className="mt-8 border rounded-lg overflow-hidden" style={{ height: '600px' }}>
          {/* Custom Toolbar */}
          {isViewerInitialized && viewerInstance && (
            <div className="bg-gray-100 p-2 border-b flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.toolController) {
                    viewerInstance.toolController.activateTool('measure');
                    toast.success('Measurement tool activated');
                  }
                }}
              >
                📏 Messen
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.toolController) {
                    viewerInstance.toolController.activateTool('section');
                    toast.success('Section plane tool activated');
                  }
                }}
              >
                ✂️ Schnitt
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.impl && viewerInstance.impl.model) {
                    // Explode-Funktionalität - alle Objekte isolieren
                    const model = viewerInstance.impl.model;
                    const fragIds = [];
                    
                    model.getFragmentList().fragments.forEach((fragId: number) => {
                      fragIds.push(fragId);
                    });
                    
                    if (fragIds.length > 0) {
                      viewerInstance.impl.visibilityManager.setFragmentsVisible(fragIds, true);
                      viewerInstance.impl.invalidate(true, true, true);
                      toast.success('All components visible');
                    }
                  }
                }}
              >
                💥 Explode View
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setView({ 
                      position: { x: 100, y: 100, z: 100 },
                      target: { x: 0, y: 0, z: 0 },
                      up: { x: 0, y: 0, z: 1 }
                    });
                    toast.success('Reset view');
                  }
                }}
              >
                🔄 Reset View
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('NE');
                    toast.success('ViewCube set to NE');
                  }
                }}
              >
                🧊 ViewCube NE
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('SW');
                    toast.success('ViewCube set to SW');
                  }
                }}
              >
                🧊 ViewCube SW
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('TOP');
                    toast.success('ViewCube set to TOP');
                  }
                }}
              >
                🧊 ViewCube TOP
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('BOTTOM');
                    toast.success('ViewCube set to BOTTOM');
                  }
                }}
              >
                🧊 ViewCube BOTTOM
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('FRONT');
                    toast.success('ViewCube set to FRONT');
                  }
                }}
              >
                🧊 ViewCube FRONT
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('BACK');
                    toast.success('ViewCube set to BACK');
                  }
                }}
              >
                🧊 ViewCube BACK
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('LEFT');
                    toast.success('ViewCube set to LEFT');
                  }
                }}
              >
                🧊 ViewCube LEFT
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.setViewCube('RIGHT');
                    toast.success('ViewCube set to RIGHT');
                  }
                }}
              >
                🧊 ViewCube RIGHT
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    viewerInstance.navigation.fitToView();
                    toast.success('Zoom to fit');
                  }
                }}
              >
                🔍 Zoom to Fit
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  if (viewerInstance.navigation) {
                    const camera = viewerInstance.navigation.getCamera();
                    console.log('Current camera position:', camera);
                    toast.success('Camera info logged to console');
                  }
                }}
              >
                📷 Camera Info
              </Button>
            </div>
          )}
          
          <div ref={viewerRef} className="w-full h-full" />
        </div>
      </div>
    </DefaultPageLayout>
  );
}
