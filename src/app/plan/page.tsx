"use client";

import React, { useState } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { TreeMenuTemplate } from "@/components/TreeMenuTemplate";
import { useNextcloud } from "@/hooks/useNextcloud";

export default function PlanPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Use Nextcloud hook to fetch real folder structure
  const { 
    folders, 
    loading, 
    error, 
    refreshFolders, 
    expandFolder, 
    expandedFolders,
    loadingExpandedItems 
  } = useNextcloud('/');

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    console.log("Selected folder:", folderId);
  };

  const handleExpandedChange = (itemId: string, expanded: boolean) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: expanded
    }));
  };

  const handleExpandFolder = async (path: string) => {
    try {
      await expandFolder(path);
    } catch (error) {
      console.error('Failed to expand folder:', error);
    }
  };

  return (
    <DefaultPageLayout>
      <div className="flex h-full">
        {/* Tree Menu */}
        <TreeMenuTemplate
          title="Nextcloud Ordner"
          categories={folders}
          loading={loading}
          error={error}
          onCategorySelect={handleFolderSelect}
          selectedCategoryId={selectedFolderId}
          onExpandFolder={handleExpandFolder}
          loadingExpandedItems={loadingExpandedItems}
          expandedFolders={expandedFolders}
        />
        
        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-full p-8 flex-1">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Plan - BRAIN DB
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Planungs- und Projektmanagement für Baumaterialien
            </p>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold mb-3 text-blue-600">Planungsfunktionen</h2>
              <p className="text-gray-600 mb-4">
                Hier werden zukünftige Planungs- und Projektmanagement-Funktionen implementiert.
              </p>
              <div className="text-left space-y-2 text-gray-600">
                <li>• Projektplanung mit Materiallisten</li>
                <li>• Kostenkalkulation</li>
                <li>• Zeitplanung und Meilensteine</li>
                <li>• Ressourcenverwaltung</li>
                <li>• Dokumentenmanagement</li>
              </div>
            </div>
            
            {/* Debug Info */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold">Fehler beim Laden der Ordner:</h3>
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            {loading && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-600">Lade Nextcloud-Ordnerstruktur...</p>
              </div>
            )}
            
            {!loading && !error && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600">
                  ✅ {folders.length} Ordner aus Nextcloud geladen
                </p>
                {expandedFolders.size > 0 && (
                  <p className="text-green-600 text-sm mt-1">
                    📁 {expandedFolders.size} Ordner expandiert
                  </p>
                )}
                {loadingExpandedItems.size > 0 && (
                  <p className="text-blue-600 text-sm mt-1">
                    🔄 {loadingExpandedItems.size} Ordner werden geladen...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
} 