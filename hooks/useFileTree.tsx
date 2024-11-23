import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TrashIcon, FolderIcon, FolderOpenIcon, PlusIcon } from 'lucide-react';
import { BlobFile, TreeDataItem } from '@/types';

interface UseFileTreeProps {
  files: BlobFile[];
  handleDeleteClick: (file: BlobFile) => void;
  handleFolderDeleteClick: (folderPath: string) => void;
  onFileSelect: (file: BlobFile | null) => void;
  onAddDirectory: (directoryPath: string) => void;
}

function sortItems(items: TreeDataItem[]): TreeDataItem[] {
  const folders = items.filter((item) => Array.isArray(item.children));
  const files = items.filter((item) => !Array.isArray(item.children));

  const sortByDate = (a: TreeDataItem, b: TreeDataItem) => {
    const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return bTime - aTime;
  };

  folders.sort(sortByDate);
  files.sort(sortByDate);

  return [...folders, ...files];
}

export function useFileTree({
  files,
  handleDeleteClick,
  handleFolderDeleteClick,
  onFileSelect,
  onAddDirectory,
}: UseFileTreeProps) {
  const buildTreeData = useCallback(
    (files: BlobFile[]): TreeDataItem[] => {
      const directories = new Map<string, TreeDataItem>();
      const rootItems: TreeDataItem[] = [];

      files.forEach((file) => {
        if (!file.isDirectory) return;
        const parts = file.pathname.split('/');
        let currentPath = '';
        let currentArray = rootItems;

        parts.forEach((part) => {
          if (part === '') return;
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!directories.has(currentPath)) {
            const dirItem: TreeDataItem = {
              id: currentPath,
              name: part,
              icon: FolderIcon,
              openIcon: FolderOpenIcon,
              children: [],
              uploadedAt: file.uploadedAt,
              actions: (
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddDirectory(currentPath);
                      onFileSelect(null);
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFolderDeleteClick(currentPath);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ),
            };
            directories.set(currentPath, dirItem);
            currentArray.push(dirItem);
          }
          currentArray = directories.get(currentPath)!.children!;
        });
      });

      files.forEach((file) => {
        if (file.isDirectory) return;
        const parts = file.pathname.split('/');
        let currentPath = '';
        let currentArray = rootItems;

        parts.slice(0, -1).forEach((part) => {
          if (part === '') return;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          currentArray = directories.get(currentPath)?.children || currentArray;
        });

        const fileItem: TreeDataItem = {
          id: file.pathname,
          name: parts[parts.length - 1],
          uploadedAt: file.uploadedAt,
          actions: (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(file);
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          ),
          onClick: () => onFileSelect(file),
        };
        currentArray.push(fileItem);
      });

      const sortRecursively = (items: TreeDataItem[]) => {
        const sortedItems = sortItems(items);
        sortedItems.forEach((item) => {
          if (Array.isArray(item.children)) {
            item.children = sortRecursively(item.children);
          }
        });
        return sortedItems;
      };

      return sortRecursively(rootItems);
    },
    [handleDeleteClick, handleFolderDeleteClick, onFileSelect, onAddDirectory]
  );

  const treeData = buildTreeData(files);

  return { treeData };
}
