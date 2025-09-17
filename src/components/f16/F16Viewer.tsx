'use client';

import React, { useEffect, useRef, useState } from 'react';

interface F16ViewerProps {
  onClose: () => void;
  modelPath: string;
  viewName?: string;
}

declare global {
  interface Window {
    Autodesk: any;
  }
}

export default function F16Viewer({ onClose, modelPath, viewName = 'KP-AXO-ZZ' }: F16ViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerInstance, setViewerInstance] = useState<any>(null);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [availableViews, setAvailableViews] = useState<any[]>([]);

  // Function to load a specific view
  const loadView = (view: any) => {
    if (viewerInstance && currentDocument) {
      try {
        console.log('🔍 F16 Viewer: Loading view:', view.name, '(', view.type, ')');
        return viewerInstance
          .loadDocumentNode(currentDocument, view.viewable)
          .then(() => {
            console.log('✅ F16 Viewer: View loaded successfully');
            setLoading(false);
          });
      } catch (err) {
        console.log('⚠️ F16 Viewer: Could not load view:', err);
      }
    }
  };

  useEffect(() => {
    const loadViewer = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('🔍 F16 Viewer: Starting viewer load process...');
        
        // Parse model path to get project ID and item ID
        const pathParts = modelPath.split('/');
        if (pathParts.length < 3 || pathParts[1] !== 'items') {
          throw new Error('Invalid model path format. Expected: b.{projectId}/items/{itemId}');
        }
        
        const projectId = pathParts[0];
        const itemId = pathParts[2];
        
        console.log('🔍 F16 Viewer: Project ID:', projectId);
        console.log('🔍 F16 Viewer: Item ID:', itemId);
        
        // Get access token
        const tokenResponse = await fetch('/api/acc/token');
        if (!tokenResponse.ok) {
          throw new Error('Failed to get access token');
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.token;
        console.log('🔍 F16 Viewer: Access token obtained, length:', accessToken?.length);
        
        // Use ACCDerivativeFinder to get the correct URN (derivatives.data.id)
        console.log('🔍 F16 Viewer: Getting derivatives from ACC API...');
        const derivativesResponse = await fetch(`/api/acc/derivatives`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileId: itemId,
            projectId: projectId
          })
        });
        
        if (!derivativesResponse.ok) {
          throw new Error('Failed to get derivatives from ACC API');
        }
        
        const derivativesData = await derivativesResponse.json();
        if (!derivativesData.success) {
          throw new Error(`Failed to get derivatives: ${derivativesData.error}`);
        }
        
        if (!derivativesData.isTranslated) {
          throw new Error('Model is not translated yet. Please wait for automatic translation to complete.');
        }
        
        const base64Urn = derivativesData.urn;
        console.log('🔍 F16 Viewer: Derivatives URN obtained from API:', base64Urn);
        console.log('🔍 F16 Viewer: Derivative type:', derivativesData.derivative_type);
        console.log('🔍 F16 Viewer: Status:', derivativesData.status);
        
        // The derivatives.data.id is already the correct URN for the APS Viewer!
        // No manifest query needed - ACC has already translated the file
        const urn = base64Urn;
        const token = accessToken;
        
        console.log('🔍 F16 Viewer: Original Item ID:', itemId);
        console.log('🔍 F16 Viewer: Derivatives URN from API:', base64Urn);
        
        // URN Validation and Debugging
        console.log('🔍 F16 Viewer: URN Validation:');
        console.log('  - Derivatives URN length:', base64Urn.length);
        console.log('  - Expected format for APS Viewer: Base64-encoded Derivatives-URN from ACC');
        console.log('  - URN consistency: Derivatives URN used directly for APS Viewer (no manifest query needed)');

        // Wait for Autodesk SDK to be fully loaded (loaded statically in HTML)
        // This ensures the SDK is truly external and not bundled by Next.js
        const waitForAutodesk = () => {
          if (typeof window !== 'undefined' && window.Autodesk && window.Autodesk.Viewing) {
            console.log('🔍 F16 Viewer: Autodesk SDK fully loaded from CDN, initializing...');
            console.log('🔍 F16 Viewer: SDK source verification - should be from developer.api.autodesk.com');
            console.log('🔍 F16 Viewer: window.Autodesk object:', window.Autodesk);
            initializeViewer(token, urn);
          } else {
            console.log('🔍 F16 Viewer: Waiting for Autodesk SDK to load...');
            console.log('🔍 F16 Viewer: Current window.Autodesk state:', typeof window !== 'undefined' ? window.Autodesk : 'undefined');
            setTimeout(waitForAutodesk, 100);
          }
        };
        
        // Start waiting for Autodesk SDK - ONLY in browser context
        if (typeof window !== 'undefined') {
          waitForAutodesk();
        } else {
          console.log('🔍 F16 Viewer: Server-side rendering detected, skipping viewer initialization');
        }
      } catch (err) {
        console.error('🔍 F16 Viewer: Error loading viewer:', err);
        setError('Failed to load viewer');
        setLoading(false);
      }
    };

    const initializeViewer = (accessToken: string, urn: string) => {
      if (!viewerRef.current) return;

      try {
        console.log('🔍 F16 Viewer: Initializing viewer with URN:', urn);
        
        // SVF2 Configuration for ACC Cloud Models
        const options = {
          env: 'AutodeskProduction2', // For SVF2 models - MUST be AutodeskProduction2 (NOT 'Local'!)
          api: 'streamingV2',         // Use streamingV2 for SVF2
          getAccessToken: (onGetAccessToken: (token: string, expires: number) => void) => {
            onGetAccessToken(accessToken, 3600);
          }
        };

        window.Autodesk.Viewing.Initializer(options, () => {
          console.log('🔍 F16 Viewer: Initializer callback executed');
          
          // Create viewer with Revit-specific UI components
          const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current);
          console.log('🔍 F16 Viewer: GuiViewer3D created');
          
          // Store viewer instance for toggle functionality
          setViewerInstance(viewer);
          
          // Enable Revit-specific UI components
          viewer.setTheme('light-theme');
          console.log('🔍 F16 Viewer: Theme set to light-theme');
          
          // Start the viewer
          viewer.start();
          console.log('🔍 F16 Viewer: Viewer started');

          // Hide loading spinner once geometry/model is fully loaded
          const onModelReady = () => {
            console.log('✅ F16 Viewer: Geometry/model fully loaded');
            setLoading(false);
          };
          try {
            viewer.addEventListener(window.Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onModelReady);
            viewer.addEventListener(window.Autodesk.Viewing.MODEL_COMPLETED_EVENT, onModelReady);
          } catch (e) {
            // ignore listener errors in case of missing enums
          }

          // Load the document using the URN (Base64-encoded derivatives URN)
          console.log('🔍 F16 Viewer: Loading document with URN:', urn);
          console.log('🔍 F16 Viewer: URN length:', urn.length);
          console.log('🔍 F16 Viewer: URN type check - should be Base64 string, not URL');
          console.log('🔍 F16 Viewer: Viewer should make requests to Autodesk Cloud, NOT localhost!');
          
          // Use the correct Document.load API for APS Viewer v7
          window.Autodesk.Viewing.Document.load(
            'urn:' + urn, // Prefix with 'urn:' so Viewer resolves against Autodesk Cloud
            (doc: any) => {
              console.log('🔍 F16 Viewer: Document loaded successfully');
              console.log('🔍 F16 Viewer: Document object:', doc);
              console.log('🔍 F16 Viewer: Document methods:', Object.getOwnPropertyNames(doc));
              
              // Check if document has getRoot method
              if (typeof doc.getRoot === 'function') {
                const root = doc.getRoot();
                console.log('🔍 F16 Viewer: Root object:', root);
                
                const defaultModel = root.getDefaultGeometry();
                
                viewer.loadDocumentNode(doc, defaultModel).then(() => {
                  console.log('🔍 F16 Viewer: Model loaded successfully');
                  
                  // Store document for view panel functionality
                  setCurrentDocument(doc);
                  
                  // Wait for the model to be fully loaded before checking type
                  setTimeout(() => {
                    // Always extract viewables from the document, regardless of model type
                    console.log('🔍 F16 Viewer: Extracting viewables from document...');
                    
                    // Extract 3D geometry views
                    const geometryViewables = root.search({ type: 'geometry' });
                    // Extract 2D sheet views
                    const sheetViewables = root.search({ type: 'sheet' });
                    
                    console.log('🔍 F16 Viewer: Found geometry viewables:', geometryViewables.length);
                    console.log('🔍 F16 Viewer: Found sheet viewables:', sheetViewables.length);
                    
                    // Prepare views for UI
                    const views = [
                      ...geometryViewables.map((viewable: any) => ({ 
                        type: '3D', 
                        name: viewable.data?.name || viewable.name || '3D View', 
                        viewable,
                        role: viewable.data?.role || '3d',
                        guid: viewable.getGuid?.() || viewable.guid
                      })),
                      ...sheetViewables.map((viewable: any) => ({ 
                        type: '2D', 
                        name: viewable.data?.name || viewable.name || '2D Sheet', 
                        viewable,
                        role: viewable.data?.role || '2d',
                        guid: viewable.getGuid?.() || viewable.guid
                      }))
                    ];
                    
                    setAvailableViews(views);
                    console.log('✅ F16 Viewer: Extracted', views.length, 'available views');
                    console.log('🔍 F16 Viewer: Available views:', views.map(v => `${v.type}: ${v.name} (${v.role})`));
                    
                    // Auto-load specific view if viewName is provided
                    if (viewName) {
                      console.log('🔍 F16 Viewer: Looking for specific view:', viewName);
                      const targetView = views.find(v => 
                        v.name === viewName || 
                        v.name.toLowerCase().includes(viewName.toLowerCase()) ||
                        v.name.toLowerCase().includes('kp-axo-zz')
                      );
                      
                      if (targetView) {
                        console.log('✅ F16 Viewer: Found target view:', targetView.name);
                        setTimeout(() => {
                          loadView(targetView);
                          // Auto-switch to phase view "Nachnutzung" if available
                          const phaseView = views.find((v: any) => v.name && v.name.toLowerCase().includes('nachnutzung'));
                          if (phaseView && phaseView !== targetView) {
                            setTimeout(() => {
                              console.log('🔍 F16 Viewer: Switching to phase view Nachnutzung');
                              loadView(phaseView);
                            }, 1000);
                          }
                        }, 1000); // Wait 1 second for viewer to be fully ready
                      } else {
                        console.log('⚠️ F16 Viewer: Target view not found:', viewName);
                        console.log('Available views:', views.map(v => v.name));
                      }
                    }
                  }, 2000); // Wait 2 seconds for model to be fully loaded
                }).catch((error: any) => {
                  console.error('🔍 F16 Viewer: Error loading model:', error);
                  setError('Failed to load model');
                  setLoading(false);
                });
              } else {
                console.error('🔍 F16 Viewer: Document does not have getRoot method');
                console.log('🔍 F16 Viewer: Available methods:', Object.getOwnPropertyNames(doc));
                setError('Document format not supported');
                setLoading(false);
              }
            },
            (error: any) => {
              console.error('🔍 F16 Viewer: Error loading document:', error);
              setError('Failed to load document');
              setLoading(false);
            }
          );
        });
      } catch (err) {
        console.error('🔍 F16 Viewer: Error initializing viewer:', err);
        setError('Failed to initialize viewer');
        setLoading(false);
      }
    };

    loadViewer();
  }, [modelPath, viewName]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Viewer Header with horizontal buttons */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">3D-Viewer</h2>
          <span className="text-gray-600">- {modelPath.split('/').pop()}</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-md"
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 relative bg-white">
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Lade 3D-Viewer...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        )}

        {/* Viewer Canvas */}
        <div ref={viewerRef} className="w-full h-full bg-white"></div>
      </div>
    </div>
  );
}