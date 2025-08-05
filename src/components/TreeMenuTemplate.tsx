"use client";

import React, { useState, useEffect } from "react";
import { CustomTreeView } from "@/components/CustomTreeView";
import { TextField } from "@/ui/components/TextField";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSearch, FeatherChevronDown } from "@subframe/core";
import { NextcloudFolder } from "@/lib/nextcloud-optimized";

interface TreeMenuTemplateProps {
  title?: string;
  categories: NextcloudFolder[];
  loading?: boolean;
  error?: string | null;
  onCategorySelect: (categoryId: string) => void;
  selectedCategoryId?: string | null;
  onExpandFolder?: (path: string) => Promise<void>;
  loadingExpandedItems?: Set<string>;
  expandedFolders?: Set<string>;
}

export function TreeMenuTemplate({
  title = "Kategorie",
  categories,
  loading = false,
  error = null,
  onCategorySelect,
  selectedCategoryId = null,
  onExpandFolder,
  loadingExpandedItems = new Set(),
  expandedFolders = new Set()
}: TreeMenuTemplateProps) {
  // State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [treeWidth, setTreeWidth] = useState(320); // Default width
  const [isResizing, setIsResizing] = useState(false);

  // Sync expandedItems with expandedFolders from hook
  useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    
    // Convert Set to Record for CustomTreeView
    expandedFolders.forEach(path => {
      // Find the item with this path and use its id
      const findItemByPath = (items: NextcloudFolder[]): string | null => {
        for (const item of items) {
          if (item.path === path) {
            return item.id;
          }
          if (item.children) {
            const found = findItemByPath(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const itemId = findItemByPath(categories);
      if (itemId) {
        newExpandedItems[itemId] = true;
      }
    });
    
    setExpandedItems(newExpandedItems);
  }, [expandedFolders, categories]);

  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) { // Min 200px, Max 600px
        setTreeWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Convert to tree structure for CustomTreeView
  const treeItems = filteredCategories.map(category => ({
    id: category.id,
    label: category.label,
    path: category.path,
    type: category.type || 'folder',
    hasChildren: category.hasChildren,
    children: category.children || []
  }));

  // Event Handlers
  const handleItemSelect = (itemId: string) => {
    onCategorySelect(itemId);
  };

  const handleExpandedChange = (itemId: string, expanded: boolean) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: expanded
    }));
  };

  const toggleAllFolders = () => {
    const allExpanded = Object.values(expandedItems).every(state => state);
    
    const newStates: Record<string, boolean> = {};
    categories.forEach(cat => {
      if (cat.type === 'folder') {
        newStates[cat.id] = !allExpanded;
      }
    });
    
    setExpandedItems(newStates);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div 
      className="flex flex-none flex-col items-start gap-2 self-stretch px-4 py-4 shadow-lg h-full relative"
      style={{ width: `${treeWidth}px` }}
    >
      {/* Header */}
      <div className="flex w-full items-center gap-2 pl-2 py-2 flex-shrink-0">
        <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
          {title}
        </span>
      </div>

      {/* Search Field with Clear Button */}
      <div className="flex w-full items-center gap-2 flex-shrink-0">
        <TextField
          className="h-auto grow shrink-0 basis-0"
          variant="filled"
          label=""
          helpText=""
          icon={<FeatherSearch />}
        >
          <TextField.Input
            placeholder="Search"
            value={searchTerm}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
          />
        </TextField>
        
        {/* Clear Button */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-800 text-sm font-medium"
            title="Suche löschen"
          >
            ×
          </button>
        )}

        {/* Expand/Collapse All Button */}
        <IconButton
          variant="neutral-primary"
          onClick={toggleAllFolders}
          icon={(() => {
            const allExpanded = Object.values(expandedItems).every(state => state);
            return allExpanded ? <span>−</span> : <FeatherChevronDown />;
          })()}
        />
      </div>

      {/* Tree View Container with fixed height and scroll */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        <CustomTreeView
          items={treeItems}
          expandedItems={expandedItems}
          onItemSelect={handleItemSelect}
          onExpandedChange={handleExpandedChange}
          selectedItemId={selectedCategoryId}
          onExpandFolder={onExpandFolder}
          loadingExpandedItems={loadingExpandedItems}
        />
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-caption text-subtext-color mt-2 flex-shrink-0">Lade Kategorien...</div>
      )}
      {error && (
        <div className="text-caption text-red-500 mt-2 flex-shrink-0">{error}</div>
      )}

      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-200 transition-colors"
        onMouseDown={handleMouseDown}
        style={{ transform: 'translateX(50%)' }}
      />
    </div>
  );
} 