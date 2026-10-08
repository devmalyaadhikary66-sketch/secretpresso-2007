/**
 * Image Storage Types & Abstractions for SECRETpresso
 * Supports persistent local storage via IndexedDB (SECRETPRESSO_LocalStorage)
 * Designed for seamless future migration to permanent cloud storage.
 */

export type ImageStorageMode = 'local' | 'firebase' | 'cloud';

export const CURRENT_IMAGE_STORAGE_MODE: ImageStorageMode = 'local';

export type ImageEntityType =
  | 'product'
  | 'gallery'
  | 'category'
  | 'hero'
  | 'banner'
  | 'homepage'
  | 'section'
  | 'surprise'
  | 'story'
  | 'tiramisu'
  | 'other';

export interface StoredImageRecord {
  id: string; // Permanent ID, e.g. "img_173456789_abc"
  blob: Blob; // Actual persistent image Blob
  fileName: string;
  mimeType: string;
  fileSize: number; // In bytes
  width?: number;
  height?: number;
  entityType: ImageEntityType;
  entityId?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isMigrated?: boolean;
  permanentUrl?: string; // Populated during future permanent cloud migration
}

export interface ImageStorageStats {
  storageMode: ImageStorageMode;
  totalImages: number;
  totalBytes: number;
  formattedTotalSize: string;
  productsCount: number;
  categoriesCount: number;
  homepageCount: number;
  otherCount: number;
  lastUploadedAt?: string;
}

export interface ImageManifestEntry {
  imageId: string;
  fileName: string;
  entityType: ImageEntityType;
  entityId?: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  relativePath: string;
  createdAt: string;
  updatedAt: string;
  isMigrated?: boolean;
  permanentUrl?: string;
}

export interface ImageBackupManifest {
  version: string;
  appName: string;
  storageMode: ImageStorageMode;
  exportedAt: string;
  totalImages: number;
  totalBytes: number;
  images: ImageManifestEntry[];
}
