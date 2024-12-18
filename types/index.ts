declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_IS_TEST: string;
  }
}

export interface TreeDataItem {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className: string | undefined }>;
  openIcon?: React.ComponentType<{ className: string | undefined }>;
  selectedIcon?: React.ComponentType<{ className: string | undefined }>;
  children?: TreeDataItem[];
  actions?: React.ReactNode;
  onClick?: () => void;
  uploadedAt?: string;
}

export interface ItemToDelete {
  type: 'file' | 'folder';
  item: BlobFile | string;
}

export interface BlobFile {
  pathname: string;
  url?: string;
  downloadUrl?: string;
  size: number;
  uploadedAt: string;
  isDirectory: boolean;
}

export type BlobFileResult = {
  type: 'file';
  url: string;
  downloadUrl: string;
};

export type BlobFolderResult = {
  type: 'folder';
  url: string;
};

export type BlobResult = BlobFileResult | BlobFolderResult;

export type ValidationResult = {
  isValid: boolean;
  error: string | null;
};

export interface BlobOperations {
  listBlobs: () => Promise<BlobFile[]>;
  getBlob: (url: string) => Promise<string>;
  putBlob: (pathname: string, content?: string | File) => Promise<BlobResult>;
  deleteBlob: (urls: string | string[]) => Promise<void>;
}

export interface ValidateFileNameParams {
  pathname: string;
  isEditing: boolean;
}

export interface SaveFileParams {
  content: string;
  pathname: string;
  isEditing: boolean;
}
