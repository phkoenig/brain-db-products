"use client";

import React from "react";
import { FeatherChevronDown, FeatherChevronRight, FeatherFolder } from "@subframe/core";

interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
}

interface CustomTreeViewProps {
  items: TreeItem[];
  expandedItems: Record<string, boolean>;
  onItemSelect: (itemId: string) => void;
  onExpandedChange: (itemId: string, expanded: boolean) => void;
  selectedItemId?: string | null;
}

interface TreeItemProps {
  item: TreeItem;
  level?: number;
  expandedItems: Record<string, boolean>;
  onItemSelect: (itemId: string) => void;
  onExpandedChange: (itemId: string, expanded: boolean) => void;
  selectedItemId?: string | null;
}

const TreeItemComponent: React.FC<TreeItemProps> = ({ 
  item, 
  level = 0, 
  expandedItems, 
  onItemSelect, 
  onExpandedChange,
  selectedItemId 
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems[item.id] || false;
  const isSelected = selectedItemId === item.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren && onExpandedChange) {
      onExpandedChange(item.id, !isExpanded);
    }
  };

  const handleSelect = () => {
    if (onItemSelect) {
      onItemSelect(item.id);
    }
  };

  const handleRowClick = () => {
    if (hasChildren) {
      // If it has children, toggle expand/collapse
      if (onExpandedChange) {
        onExpandedChange(item.id, !isExpanded);
      }
    } else {
      // If it's a leaf node, select it
      if (onItemSelect) {
        onItemSelect(item.id);
      }
    }
  };

  return (
    <div className="w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-50 ${
          isSelected ? "bg-brand-500 text-white" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleRowClick}
      >
        {hasChildren ? (
          <div className="flex items-center justify-center w-4 h-4 text-neutral-500">
            {isExpanded ? (
              <FeatherChevronDown size={14} />
            ) : (
              <FeatherChevronRight size={14} />
            )}
          </div>
        ) : (
          <div className="w-4 h-4" />
        )}
        
        <div className="flex items-center gap-2">
          {hasChildren && (
            <FeatherFolder size={16} className="text-neutral-500" />
          )}
          <span className={`text-body font-body text-default-font ${
            !hasChildren ? "text-subtext-color" : ""
          }`}>
            {item.label}
          </span>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="w-full">
          {item.children!.map((child) => (
            <TreeItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              selectedItemId={selectedItemId}
              onItemSelect={onItemSelect}
              expandedItems={expandedItems}
              onExpandedChange={onExpandedChange}
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
  selectedItemId
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
        />
      ))}
    </div>
  );
}; 