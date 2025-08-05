"use client";

import React from "react";
import { FeatherChevronDown, FeatherChevronRight, FeatherFolder, FeatherFile } from "@subframe/core";

interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
  path?: string;
  type?: 'folder' | 'file';
  hasChildren?: boolean;
}

interface CustomTreeViewProps {
  items: TreeItem[];
  expandedItems: Record<string, boolean>;
  onItemSelect: (itemId: string) => void;
  onExpandedChange: (itemId: string, expanded: boolean) => void;
  selectedItemId?: string | null;
  onExpandFolder?: (path: string) => Promise<void>;
  loadingExpandedItems?: Set<string>;
}

interface TreeItemProps {
  item: TreeItem;
  level?: number;
  expandedItems: Record<string, boolean>;
  onItemSelect: (itemId: string) => void;
  onExpandedChange: (itemId: string, expanded: boolean) => void;
  selectedItemId?: string | null;
  onExpandFolder?: (path: string) => Promise<void>;
  loadingExpandedItems?: Set<string>;
}

const TreeItemComponent: React.FC<TreeItemProps> = ({ 
  item, 
  level = 0, 
  expandedItems, 
  onItemSelect, 
  onExpandedChange,
  selectedItemId,
  onExpandFolder,
  loadingExpandedItems = new Set()
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems[item.id] || false;
  const isSelected = selectedItemId === item.id;
  const isLoading = loadingExpandedItems.has(item.path || '');

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (item.type === 'folder') {
      if (!isExpanded && onExpandFolder && item.path) {
        // Try to expand and load children
        try {
          await onExpandFolder(item.path);
        } catch (error) {
          console.error('Failed to expand folder:', error);
        }
      }
      
      if (onExpandedChange) {
        onExpandedChange(item.id, !isExpanded);
      }
    }
  };

  const handleSelect = () => {
    if (onItemSelect) {
      onItemSelect(item.id);
    }
  };

  const handleRowClick = async () => {
    if (item.type === 'folder') {
      // If it's a folder, toggle expand/collapse
      if (!isExpanded && onExpandFolder && item.path) {
        try {
          await onExpandFolder(item.path);
        } catch (error) {
          console.error('Failed to expand folder:', error);
        }
      }
      
      if (onExpandedChange) {
        onExpandedChange(item.id, !isExpanded);
      }
    } else {
      // If it's a file, select it
      if (onItemSelect) {
        onItemSelect(item.id);
      }
    }
  };

  const getIcon = () => {
    if (item.type === 'file') {
      return <FeatherFile size={16} className="text-neutral-500" />;
    }
    
    if (item.type === 'folder') {
      return <FeatherFolder size={16} className="text-neutral-500" />;
    }
    
    return null;
  };

  const getChevronIcon = () => {
    if (item.type !== 'folder') return null;
    
    if (isLoading) {
      return <div className="animate-spin w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full" />;
    }
    
    if (isExpanded) {
      return <FeatherChevronDown size={14} />;
    }
    
    return <FeatherChevronRight size={14} />;
  };

  return (
    <div className="w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-50 min-h-[40px] ${
          isSelected ? "bg-brand-500 text-white" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleRowClick}
      >
        {item.type === 'folder' ? (
          <div className="flex items-center justify-center w-4 h-4 text-neutral-500">
            {getChevronIcon()}
          </div>
        ) : (
          <div className="w-4 h-4" />
        )}
        
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getIcon()}
          <span className={`text-body font-body text-default-font truncate ${
            item.type === 'file' ? "text-subtext-color" : ""
          }`} title={item.label}>
            {item.label}
          </span>
        </div>
      </div>
      
      {item.type === 'folder' && isExpanded && item.children && (
        <div className="w-full">
          {item.children.map((child) => (
            <TreeItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              selectedItemId={selectedItemId}
              onItemSelect={onItemSelect}
              expandedItems={expandedItems}
              onExpandedChange={onExpandedChange}
              onExpandFolder={onExpandFolder}
              loadingExpandedItems={loadingExpandedItems}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CustomTreeView: React.FC<CustomTreeViewProps> = ({
  items,
  expandedItems,
  onItemSelect,
  onExpandedChange,
  selectedItemId,
  onExpandFolder,
  loadingExpandedItems
}) => {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <TreeItemComponent
          key={item.id}
          item={item}
          level={0}
          expandedItems={expandedItems}
          onItemSelect={onItemSelect}
          onExpandedChange={onExpandedChange}
          selectedItemId={selectedItemId}
          onExpandFolder={onExpandFolder}
          loadingExpandedItems={loadingExpandedItems}
        />
      ))}
    </div>
  );
}; 