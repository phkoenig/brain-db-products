"use client";

import React, { useState } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { TreeMenuTemplate } from "@/components/TreeMenuTemplate";
import { useNextcloud } from "@/hooks/useNextcloud";
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

export default function PlanPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  const { 
    folders, 
    loading, 
    error, 
    expandFolder, 
    expandedFolders, 
    loadingExpandedItems 
  } = useNextcloud('/ARCH');

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

  // Mock-Daten für die Dokumenten-Tabelle
  const documents = [
    {
      id: '1',
      name: 'Archiv',
      title: '...',
      modified: '2 hours ago',
      size: '--',
      type: 'Folder',
      isFolder: true,
      selected: false
    },
    {
      id: '2',
      name: 'F16-ZEPTA-AP-GRS-O1-A.pdf',
      title: 'Grundriss 1. Obergeschoss',
      modified: '1 day ago',
      size: '2.4 MB',
      type: 'PDF',
      isFolder: false,
      selected: true
    },
    {
      id: '3',
      name: 'F16-ZEPTA-AP-DET-O2-KÜCHE-A.dwg',
      title: 'Details Küche 2. Obergeschoss',
      modified: '3 days ago',
      size: '8.1 MB',
      type: 'DWG',
      isFolder: false,
      selected: true
    }
  ];

  const getFileIcon = (type: string, isFolder: boolean) => {
    if (isFolder) return <FeatherFolder className="text-body font-body text-brand-primary" />;
    if (type === 'PDF') return <FeatherFileText className="text-body font-body text-brand-primary" />;
    if (type === 'DWG') return <FeatherImage className="text-body font-body text-brand-primary" />;
    return <FeatherFileText className="text-body font-body text-brand-primary" />;
  };

  const getBadgeVariant = (type: string) => {
    if (type === 'Folder') return undefined;
    if (type === 'PDF') return 'neutral';
    if (type === 'DWG') return 'warning';
    return 'neutral';
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
              <Table.Row key={doc.id}>
                <Table.Cell>
                  {doc.selected ? (
                    <FeatherSquareCheckBig className="text-heading-3 font-heading-3 text-default-font" />
                  ) : (
                    <FeatherSquare className="text-heading-3 font-heading-3 text-default-font" />
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    {getFileIcon(doc.type, doc.isFolder)}
                    <span className="text-body-bold font-body-bold text-neutral-700">
                      {doc.name}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {doc.title}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-body font-body text-neutral-500">
                    {doc.modified}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-body font-body text-neutral-500">{doc.size}</span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={getBadgeVariant(doc.type)}>{doc.type}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <IconButton
                      icon={<FeatherMoreHorizontal />}
                      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        </div>
      </div>
    </DefaultPageLayout>
  );
} 