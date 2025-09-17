"use client";

import React, { useState, useEffect } from "react";
import { F16Sidebar } from "@/components/f16/F16Sidebar";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { FeatherMapPin } from "@subframe/core";
import { FeatherSave } from "@subframe/core";
import { FeatherFolder } from "@subframe/core";
import { FeatherFile } from "@subframe/core";
import { FeatherChevronLeft } from "@subframe/core";
import { useF16Settings } from "@/hooks/useF16Settings";
import { ACCService } from "@/lib/acc";
import { ACCOAuthService } from "@/lib/acc-oauth";

interface FolderItem {
  id: string;
  name: string;
  type: 'folders' | 'items';
  extension?: string;
}

export default function F16SettingsPage() {
  const { settings, loading, error, updateSettings } = useF16Settings();
  const [tempPath, setTempPath] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [items, setItems] = useState<FolderItem[]>([]);
  const [browsing, setBrowsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated'>('checking');
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    if (settings?.model_path) {
      setTempPath(settings.model_path);
    }
  }, [settings]);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 F16 Settings: Checking authentication status...');
        
        // First check token status via API
        const tokenStatusResponse = await fetch('/api/acc/token-status');
        const tokenStatusData = await tokenStatusResponse.json();
        console.log('🔍 F16 Settings: Token status API response:', tokenStatusData);
        setTokenInfo(tokenStatusData);
        
        console.log('🔍 F16 Settings: Token status check:', {
          success: tokenStatusData.success,
          tokenStatus: tokenStatusData.tokenStatus,
          tokenLength: tokenStatusData.tokenLength
        });
        
        // Simplified condition - if we have a valid token, we're authenticated
        if (tokenStatusData.tokenStatus === 'valid' && tokenStatusData.tokenLength > 0) {
          console.log('🔍 F16 Settings: Authentication status: AUTHENTICATED');
          setAuthStatus('authenticated');
        } else {
          console.log('🔍 F16 Settings: Authentication status: NOT AUTHENTICATED');
          console.log('🔍 F16 Settings: Reason:', tokenStatusData.error || 'Token not valid');
          setAuthStatus('not_authenticated');
        }
      } catch (error) {
        console.log('🔍 F16 Settings: Authentication status: NOT AUTHENTICATED (error)');
        console.log('🔍 F16 Settings: Error details:', error);
        setAuthStatus('not_authenticated');
        
        // Don't auto-redirect, let user click manually
        console.log('🔍 F16 Settings: Authentication failed, but not auto-redirecting');
      }
    };

    checkAuthStatus();
  }, []);

  // Auto-start folder browser after authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth') === 'success';
    const authError = urlParams.get('error');
    
    console.log('🔍 F16 Settings: URL params check:', { authSuccess, authError, browsing, itemsLength: items.length, authStatus });
    
    if (authSuccess && !browsing && items.length === 0 && authStatus === 'authenticated') {
      console.log('🔍 F16 Settings: Auto-starting folder browser after authentication...');
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Start folder browser immediately since we know we're authenticated
      console.log('🔍 F16 Settings: Starting folder browser immediately...');
      loadFolderContents('root');
    } else if (authError) {
      console.log('🔍 F16 Settings: Authentication error detected:', authError);
      setAuthStatus('not_authenticated');
    }
  }, [browsing, items.length, authStatus]);

  const loadFolderContents = async (folderId: string) => {
    try {
      setBrowsing(true);
      console.log('🔍 F16 Settings: Loading folder contents for:', folderId);

      // First get the F16 project ID
      console.log('🔍 F16 Settings: Getting projects...');
      const projectsResponse = await fetch('/api/acc/projects');
      if (!projectsResponse.ok) throw new Error('Failed to load projects');
      
      const projectsData = await projectsResponse.json();
      console.log('🔍 F16 Settings: Projects received:', projectsData.data?.length);
      
      const f16Project = projectsData.data?.find((p: any) => p.name.includes('F16') || p.name.includes('Fontaneallee'));
      console.log('🔍 F16 Settings: F16 project found:', f16Project ? f16Project.name : 'NOT FOUND');
      
      if (!f16Project) {
        throw new Error('F16 project not found');
      }

      // Now get folder contents using the existing API route
      console.log('🔍 F16 Settings: Getting folder contents for project:', f16Project.id, 'folder:', folderId);
      const response = await fetch(`/api/acc/projects/${f16Project.id}/folders/${folderId}/contents`);
      if (!response.ok) throw new Error('Failed to load folder contents');
      
      const data = await response.json();
      console.log('🔍 F16 Settings: Folder contents received:', data.data?.length);
      
      const folderItems: FolderItem[] = (data.data || []).map((item: any) => ({
        id: item.id,
        name: item.attributes?.name || item.attributes?.displayName || 'Unknown',
        type: item.type,
        extension: item.attributes?.extension?.type
      }));

      setItems(folderItems);
      console.log('🔍 F16 Settings: Loaded items:', folderItems);
    } catch (err) {
      console.error('🔍 F16 Settings: Error loading folder contents:', err);
      console.error('🔍 F16 Settings: Error type:', typeof err);
      console.error('🔍 F16 Settings: Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('🔍 F16 Settings: Error stack:', err instanceof Error ? err.stack : 'No stack');
      
      // If it's an authentication error, update auth status but don't redirect
      if (err instanceof Error && err.message.includes('No valid access token')) {
        console.log('🔍 F16 Settings: Authentication error detected, updating auth status...');
        setAuthStatus('not_authenticated');
        alert('Authentifizierung fehlgeschlagen. Bitte klicken Sie auf "Authentifizieren".');
        return;
      }
      
      // Show error to user
      alert(`Fehler beim Laden der Ordner-Inhalte: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setBrowsing(false);
    }
  };

  const handleLocateClick = async () => {
    // Check authentication status first
    if (authStatus === 'authenticated') {
      console.log('🔍 F16 Settings: User is authenticated, starting folder browser...');
      loadFolderContents(currentFolderId);
      return;
    }
    
    // If not authenticated, redirect to authentication
    console.log('🔍 F16 Settings: User not authenticated, redirecting to ACC authorization...');
    window.location.href = '/auth/acc-authorize';
  };

  const handleFolderClick = (item: FolderItem) => {
    if (item.type === 'folders') {
      setCurrentPath([...currentPath, item.name]);
      setCurrentFolderId(item.id);
      setSelectedFile(null);
      loadFolderContents(item.id);
    } else if (item.type === 'items') {
      // Check if it's a 3D model file
      const is3DModel = item.extension?.includes('Revit') || 
                       item.extension?.includes('IFC') ||
                       item.name.toLowerCase().includes('.rvt') ||
                       item.name.toLowerCase().includes('.ifc');
      
      if (is3DModel) {
        setSelectedFile(item.name);
        const fullPath = currentPath.length > 0 
          ? `${currentPath.join(' > ')} > ${item.name}`
          : item.name;
        setTempPath(fullPath);
      } else {
        alert('Bitte wähle eine 3D-Modell-Datei (.rvt, .ifc) aus.');
      }
    }
  };

  const handleBackClick = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      setCurrentFolderId('root');
      setCurrentPath([]);
      setSelectedFile(null);
      loadFolderContents('root');
    }
  };

  const handleSave = async () => {
    if (tempPath) {
      try {
        const success = await updateSettings({ model_path: tempPath });
        if (success) {
          alert("3D-Modell Pfad gespeichert!");
        } else {
          alert("Fehler beim Speichern des Pfads. Bitte versuchen Sie es erneut.");
        }
      } catch (err) {
        console.error('🔍 F16 Settings: Error in handleSave:', err);
        alert(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      }
    } else {
      alert("Bitte wähle zuerst eine Datei aus.");
    }
  };

  if (loading) {
    return (
      <div className="f16-portal">
        <div className="flex h-screen w-full items-center">
          <F16Sidebar currentPage="settings" />
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <div className="text-heading-2 font-heading-2 text-default-font mb-4">
                  Lade Einstellungen...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="f16-portal">
      <div className="flex h-screen w-full items-center">
        <F16Sidebar currentPage="settings" />
        
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          <div className="container max-w-none flex h-full w-full flex-col items-center gap-4 bg-neutral-50 py-12">
            <div className="flex w-full max-w-[768px] flex-col items-start gap-8">
              
              {/* Header */}
              <div className="flex w-full flex-col items-start gap-2">
                <h1 className="text-heading-1 font-heading-1 text-default-font">
                  Einstellungen
                </h1>
                <p className="text-body font-body text-subtext-color">
                  Konfiguriere die Einstellungen für das F16-Projekt
                </p>
              </div>

                      {/* Authentication Status Indicator */}
                      <div className="w-full rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${
                              authStatus === 'checking' ? 'bg-yellow-400' :
                              authStatus === 'authenticated' ? 'bg-green-400' :
                              'bg-red-400'
                            }`}></div>
                            <span className="text-body font-body text-default-font">
                              {authStatus === 'checking' ? 'Prüfe Authentifizierung...' :
                               authStatus === 'authenticated' ? 'Autodesk authentifiziert' :
                               'Nicht authentifiziert'}
                            </span>
                          </div>
                          {authStatus === 'not_authenticated' && (
                            <Button 
                              onClick={() => window.location.href = '/auth/acc-authorize'}
                              variant="primary"
                              size="small"
                            >
                              Authentifizieren
                            </Button>
                          )}
                        </div>
                        
                        {/* Token Info Debug */}
                        {tokenInfo && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Token Debug Info:</h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Status: {tokenInfo.tokenStatus}</div>
                              <div>Token Length: {tokenInfo.tokenLength}</div>
                              <div>Expires: {tokenInfo.expiresAt}</div>
                              <div>Memory Cache: {tokenInfo.memoryCache?.hasTokens ? 'Yes' : 'No'}</div>
                              <div>Global Storage: {tokenInfo.globalStorage?.hasTokens ? 'Yes' : 'No'}</div>
                              {tokenInfo.error && <div className="text-red-600">Error: {tokenInfo.error}</div>}
                            </div>
                          </div>
                        )}
                      </div>

              {/* 3D Model Path Section */}
              <div className="w-full rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex w-full flex-col items-start gap-6">
                  <div className="flex w-full flex-col items-start gap-2">
                    <h2 className="text-heading-2 font-heading-2 text-default-font">
                      3D-Modell Pfad
                    </h2>
                    <p className="text-body font-body text-subtext-color">
                      Wähle den Pfad zu deinem 3D-Modell im ACC-Projekt
                    </p>
                  </div>

                  <div className="flex w-full flex-col items-start gap-4">
                    <TextField
                      className="h-auto w-full flex-none"
                      variant="filled"
                      label="Aktueller Pfad"
                      helpText="Der Pfad zu deinem 3D-Modell im ACC-Projekt"
                    >
                      <TextField.Input
                        placeholder="Kein Pfad ausgewählt"
                        value={tempPath}
                        readOnly
                      />
                    </TextField>

                        <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center">
                          <Button
                            variant="brand"
                            size="medium"
                            icon={<FeatherMapPin />}
                            onClick={handleLocateClick}
                            disabled={browsing || authStatus === 'checking'}
                          >
                            {browsing ? 'Lädt...' : 
                             authStatus === 'checking' ? 'Prüfe Auth...' :
                             authStatus === 'not_authenticated' ? 'Authentifizieren & Durchsuchen' :
                             'Ordner durchsuchen'}
                          </Button>
                          
                          <Button
                            variant="neutral"
                            size="medium"
                            icon={<FeatherSave />}
                            onClick={handleSave}
                            disabled={!tempPath}
                          >
                            Speichern
                          </Button>
                        </div>

                        <div className={`w-full rounded-md p-4 ${
                          authStatus === 'authenticated' ? 'bg-green-50' : 'bg-blue-50'
                        }`}>
                          <p className={`text-body font-body ${
                            authStatus === 'authenticated' ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            <strong>
                              {authStatus === 'authenticated' ? 'Bereit:' : 'Hinweis:'}
                            </strong> {
                              authStatus === 'authenticated' ? 
                              'Du bist authentifiziert. Klicke auf "Ordner durchsuchen" um das ACC-Projekt zu durchbrowsen.' :
                              'Beim ersten Klick auf "Ordner durchsuchen" wirst du zur Autodesk-Authentifizierung weitergeleitet. ' +
                              'Nach der Anmeldung kehrst du automatisch zu dieser Seite zurück und der Ordner-Browser startet automatisch.'
                            }
                          </p>
                        </div>

                        {browsing && (
                          <div className="w-full rounded-md bg-green-50 p-4">
                            <p className="text-body font-body text-green-700">
                              <strong>Lädt...</strong> Durchsuche ACC-Projekt F16 nach 3D-Modellen...
                            </p>
                          </div>
                        )}
                  </div>

                  {/* Folder Browser */}
                  {items.length > 0 && (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex w-full items-center gap-4 mb-4">
                        <Button
                          variant="neutral"
                          size="small"
                          icon={<FeatherChevronLeft />}
                          onClick={handleBackClick}
                          disabled={currentPath.length === 0}
                        >
                          Zurück
                        </Button>
                        <div className="text-body font-body text-subtext-color">
                          <strong>Aktueller Pfad:</strong> {currentPath.length > 0 ? currentPath.join(' > ') : 'Root'}
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto">
                        <div className="flex w-full flex-col items-start gap-2">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              className={`w-full flex items-center gap-3 rounded-md p-3 text-left hover:bg-white ${
                                selectedFile === item.name ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                              onClick={() => handleFolderClick(item)}
                            >
                              {item.type === 'folders' ? (
                                <FeatherFolder className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FeatherFile className="h-5 w-5 text-gray-500" />
                              )}
                              <div className="flex flex-col">
                                <span className="text-body font-body text-default-font">
                                  {item.name}
                                </span>
                                {item.extension && (
                                  <span className="text-caption font-caption text-subtext-color">
                                    {item.extension}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedFile && (
                        <div className="mt-4 rounded-md bg-green-50 p-3">
                          <p className="text-body font-body text-green-700">
                            <strong>Ausgewählte Datei:</strong> {selectedFile}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="w-full rounded-md bg-red-50 p-4">
                      <p className="text-body font-body text-red-600">
                        Fehler: {error}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Settings Sections can be added here */}
              
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
