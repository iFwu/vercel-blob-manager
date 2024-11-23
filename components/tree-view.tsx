'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TreeDataItem } from '../types';

interface TreeViewProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TreeDataItem[];
  initialSelectedItemId?: string | undefined;
  selectedItemId?: string | undefined;
  onSelectChange?: (item: TreeDataItem) => void;
  expandAll?: boolean;
  defaultNodeIcon?: React.ComponentType<{ className?: string }>;
  defaultLeafIcon?: React.ComponentType<{ className?: string }>;
}

export const TreeView = ({
  data,
  initialSelectedItemId,
  selectedItemId: controlledSelectedItemId,
  onSelectChange,
  expandAll = false,
  defaultNodeIcon,
  defaultLeafIcon,
  className,
  ...props
}: TreeViewProps) => {
  const [uncontrolledSelectedItemId, setUncontrolledSelectedItemId] = useState<string | undefined>(
    initialSelectedItemId
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  const expandedItemsRef = useRef<Set<string>>(expandedItems);
  expandedItemsRef.current = expandedItems;

  const selectedItemId = controlledSelectedItemId ?? uncontrolledSelectedItemId;

  const normalizePath = (path: string) => path.replace(/\/+$/, '');

  const updateExpandedItems = useCallback((itemId: string, shouldExpand: boolean = true) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      
      if (shouldExpand) {
        // 添加所有父文件夹到展开集合
        const parts = itemId.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          if (parts[i] === '') continue;
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          newSet.add(currentPath);
        }
        
        // 如果是文件夹，也将其添加到展开集合
        if (itemId.endsWith('/')) {
          newSet.add(itemId);
        }
      } else {
        newSet.delete(itemId);
      }
      
      return newSet;
    });
  }, []);

  const handleSelectChange = useCallback((item: TreeDataItem) => {
    setUncontrolledSelectedItemId(item.id);
    onSelectChange?.(item);
    updateExpandedItems(item.id);
  }, [onSelectChange, updateExpandedItems]);

  const toggleExpand = useCallback((itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // 当选中项改变时，确保其父文件夹保持展开
  useEffect(() => {
    if (selectedItemId) {
      updateExpandedItems(selectedItemId);
    }
  }, [selectedItemId, updateExpandedItems]);

  const renderTreeItem = (item: TreeDataItem, level: number = 0) => {
    const shouldKeepExpanded = (itemId: string): boolean => {
      if (normalizePath(selectedItemId || '') === normalizePath(itemId)) return true;
      const selected = normalizePath(selectedItemId || '').split('/');
      const current = normalizePath(itemId).split('/');
      return (
        selected.length > current.length &&
        selected.slice(0, current.length).join('/') === current.join('/')
      );
    };

    const isExpanded = expandAll || expandedItemsRef.current.has(item.id) || shouldKeepExpanded(item.id);
    const hasChildren = (item.children && item.children.length > 0) ?? false;
    const IconComponent = item.icon || (hasChildren ? defaultNodeIcon : defaultLeafIcon);

    const isParentOfSelected = selectedItemId
      ? (() => {
          const selectedParts = normalizePath(selectedItemId).split('/');
          const currentParts = normalizePath(item.id).split('/');
          return (
            normalizePath(item.id) === normalizePath(selectedItemId) ||
            (selectedParts.length > currentParts.length &&
              selectedParts.slice(0, currentParts.length).join('/') === normalizePath(item.id))
          );
        })()
      : false;

    return (
      <div key={item.id} className="relative">
        <div
          className={cn(
            'flex items-center py-1 px-2 cursor-pointer hover:bg-accent/50 rounded-md',
            selectedItemId === item.id && 'bg-accent text-accent-foreground',
            level > 0 && 'ml-4'
          )}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => setHoveredItemId(item.id)}
          onMouseLeave={() => setHoveredItemId(null)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-4 w-4 p-0 mr-1',
                isParentOfSelected && 'opacity-30 cursor-not-allowed hover:bg-transparent'
              )}
              onClick={(e) => toggleExpand(item.id, e)}
              title={
                isParentOfSelected ? 'Cannot collapse while containing selected item' : undefined
              }
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {IconComponent && (
            <IconComponent
              className={cn(
                'h-4 w-4 mr-2 shrink-0',
                isExpanded && item.openIcon ? 'hidden' : 'inline-block'
              )}
            />
          )}
          {isExpanded && item.openIcon && <item.openIcon className="h-4 w-4 mr-2 shrink-0" />}
          <span className="text-sm truncate flex-grow">{item.name}</span>
          <div className="w-6 h-6 flex items-center justify-center">
            {item.actions && hoveredItemId === item.id && item.actions}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {item.children!.map((child) => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleItemClick = (item: TreeDataItem) => {
    handleSelectChange(item);
    // 如果点击的是文件夹，自动展开它
    if (item.children && item.children.length > 0) {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(item.id);
        return newSet;
      });
    }
    item.onClick?.();
  };

  return (
    <div className={cn('space-y-1', className)} {...props}>
      {Array.isArray(data) ? data.map((item) => renderTreeItem(item)) : renderTreeItem(data)}
    </div>
  );
}
