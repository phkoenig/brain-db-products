"use client";

import React, { useState, useEffect } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { TreeMenuTemplate } from "@/components/TreeMenuTemplate";
import { useNextcloudOptimized } from "@/hooks/useNextcloudOptimized";
import { useNextcloudDocuments } from "@/hooks/useNextcloudDocuments";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { IconButton } from "@/ui/components/IconButton";
import { 
  FeatherSquare, 
  FeatherSquareCheckBig, 
  FeatherFolder, 
  FeatherFileText, 
  FeatherImage, 
  FeatherMoreHorizontal 
} from "@subframe/core";
import { NextcloudFolder } from "@/lib/nextcloud-optimized";

export default function PlanPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('/ARCH');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  
  const { 
    folders, 
    loading, 
    error, 
    expandFolder, 
    expandedFolders, 
    loadingExpandedItems 
  } = useNextcloudOptimized('/ARCH');

  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    fetchDocuments,
    refreshDocuments
  } = useNextcloudDocuments(selectedFolderPath);

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    console.log("Selected folder:", folderId);
    
    // Find the selected folder path
    const findFolderPath = (items: NextcloudFolder[], targetId: string): string | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return item.path;
        }
        if (item.children) {
          const found = findFolderPath(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const folderPath = findFolderPath(folders, folderId);
    if (folderPath) {
      setSelectedFolderPath(folderPath);
      fetchDocuments(folderPath);
    }
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

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '--';
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return '--';
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    
    return dateObj.toLocaleDateString();
  };

  const getFileIcon = (document: NextcloudFolder) => {
    if (document.type === 'folder') {
      return <FeatherFolder className="text-body font-body text-brand-primary" />;
    }
    
    const extension = document.fileExtension?.toLowerCase();
    if (extension === 'pdf') {
      return <FeatherFileText className="text-body font-body text-brand-primary" />;
    }
    if (['dwg', 'dxf'].includes(extension || '')) {
      return <FeatherImage className="text-body font-body text-brand-primary" />;
    }
    
    return <FeatherFileText className="text-body font-body text-brand-primary" />;
  };

  const getBadgeVariant = (document: NextcloudFolder) => {
    if (document.type === 'folder') return undefined;
    
    const extension = document.fileExtension?.toLowerCase();
    if (extension === 'pdf') return 'neutral';
    if (['dwg', 'dxf'].includes(extension || '')) return 'warning';
    
    return 'neutral';
  };

  const getDocumentType = (document: NextcloudFolder): string => {
    if (document.type === 'folder') return 'Folder';
    return document.fileExtension?.toUpperCase() || 'File';
  };

  return (
    <DefaultPageLayout>
      <div className="flex h-full">
        {/* Tree Menu */}
        <TreeMenuTemplate
          title="ARCH Projekte"
          categories={folders}
          loading={loading}
          error={error}
          onCategorySelect={handleFolderSelect}
          selectedCategoryId={selectedFolderId}
          onExpandFolder={handleExpandFolder}
          loadingExpandedItems={loadingExpandedItems}
          expandedFolders={expandedFolders}
        />
        
        {/* Main Content - Dokumenten-Tabelle */}
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch px-6 py-6 overflow-auto">
          {documentsLoading ? (
            <div className="flex items-center justify-center w-full h-32">
              <div className="text-body font-body text-neutral-500">Loading documents...</div>
            </div>
          ) : documentsError ? (
            <div className="flex items-center justify-center w-full h-32">
              <div className="text-body font-body text-red-500">Error: {documentsError}</div>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex items-center justify-center w-full h-32">
              <div className="text-body font-body text-neutral-500">No documents found in this folder</div>
            </div>
          ) : (
            <Table
              header={
                <Table.HeaderRow>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Dokument-Titel</Table.HeaderCell>
                  <Table.HeaderCell>Modified</Table.HeaderCell>
                  <Table.HeaderCell>Size</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell />
                </Table.HeaderRow>
              }
            >
              {documents.map((doc) => (
                <Table.Row key={doc.id} onClick={() => handleDocumentSelect(doc.id)}>
                  <Table.Cell>
                    {selectedDocuments.has(doc.id) ? (
                      <FeatherSquareCheckBig className="text-heading-3 font-heading-3 text-default-font" />
                    ) : (
                      <FeatherSquare className="text-heading-3 font-heading-3 text-default-font" />
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc)}
                      <span className="text-body-bold font-body-bold text-neutral-700">
                        {doc.label}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {doc.type === 'folder' ? '--' : doc.label}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-body font-body text-neutral-500">
                      {formatDate(doc.lastModified)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-body font-body text-neutral-500">{formatFileSize(doc.size)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={getBadgeVariant(doc)}>{getDocumentType(doc)}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex grow shrink-0 basis-0 items-center justify-end">
                      <IconButton
                        icon={<FeatherMoreHorizontal />}
                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation();
                          console.log('More options for:', doc.label);
                        }}
                      />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>
          )}
        </div>
      </div>
    </DefaultPageLayout>
  );
} 