"use client";

import React, { useState, useEffect } from "react";
import { CustomTreeView } from "@/components/CustomTreeView";
import { TextField } from "@/ui/components/TextField";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSearch, FeatherChevronDown } from "@subframe/core";

interface TreeMenuTemplateProps {
  title?: string;
  categories: Array<{
    id: string;
    label: string;
    main_category: string;
    sub_category: string;
    path?: string;
    type?: 'folder' | 'file';
    children?: any[];
    hasChildren?: boolean;
  }>;
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

  // Sync expandedItems with expandedFolders from hook
  useEffect(() => {
    const newExpandedItems: Record<string, boolean> = {};
    
    // Convert Set to Record for CustomTreeView
    expandedFolders.forEach(path => {
      // Find the item with this path and use its id
      const findItemByPath = (items: any[]): string | null => {
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

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.main_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.sub_category.toLowerCase().includes(searchTerm.toLowerCase())
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
    const allMainCategories = [...new Set(categories.map(cat => cat.main_category))];
    const currentStates = allMainCategories.map(cat => expandedItems[cat] || false);
    const allExpanded = currentStates.every(state => state);
    
    const newStates: Record<string, boolean> = {};
    allMainCategories.forEach(cat => {
      newStates[cat] = !allExpanded;
    });
    
    setExpandedItems(newStates);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="flex w-80 flex-none flex-col items-start gap-2 self-stretch px-4 py-4 shadow-lg overflow-auto">
      {/* Header */}
      <div className="flex w-full items-center gap-2 pl-2 py-2">
        <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
          {title}
        </span>
      </div>

      {/* Search Field with Clear Button */}
      <div className="flex w-full items-center gap-2">
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
            const allMainCategories = [...new Set(categories.map(cat => cat.main_category))];
            const currentStates = allMainCategories.map(cat => expandedItems[cat] || false);
            const allExpanded = currentStates.every(state => state);
            return allExpanded ? <span>−</span> : <FeatherChevronDown />;
          })()}
        />
      </div>

      {/* Tree View */}
      <CustomTreeView
        items={treeItems}
        expandedItems={expandedItems}
        onItemSelect={handleItemSelect}
        onExpandedChange={handleExpandedChange}
        selectedItemId={selectedCategoryId}
        onExpandFolder={onExpandFolder}
        loadingExpandedItems={loadingExpandedItems}
      />

      {/* Loading/Error States */}
      {loading && (
        <div className="text-caption text-subtext-color mt-2">Lade Kategorien...</div>
      )}
      {error && (
        <div className="text-caption text-red-500 mt-2">{error}</div>
      )}
    </div>
  );
} 