/**
 * MediaStorageService Abstraction Layer
 * 
 * Future Firebase Migration Ready:
 * This interface defines the contract for media storage operations.
 * Currently backed by LocalServerMediaStorageService (real server-side file system + data/media.json).
 * When Firebase Storage is reintroduced in the future, only a FirebaseMediaStorageService implementation
 * needs to be plugged in here without altering any Admin Panel UI or Storefront logic.
 */

import { MediaItem, MediaType } from '../types';

export interface MediaUploadOptions {
  mediaType: MediaType;
  productId?: string;
  bannerId?: string;
  isPrimary?: boolean;
  displayOrder?: number;
  deviceType?: 'desktop' | 'mobile';
  altText?: string;
  onProgress?: (progressPercent: number) => void;
}

export interface MediaFilterOptions {
  mediaType?: string;
  productId?: string;
  bannerId?: string;
  isActive?: boolean;
}

export interface MediaStorageService {
  /**
   * Uploads an image or video file permanently to server storage and registers metadata
   */
  upload(file: File, options?: MediaUploadOptions): Promise<MediaItem>;

  /**
   * Replaces an existing media asset with a new file.
   * Safety guarantee: New file is verified on server before old file is deleted.
   */
  replace(
    oldMediaId: string,
    newFile: File,
    options?: Partial<MediaUploadOptions>
  ): Promise<MediaItem>;

  /**
   * Permanently deletes a media file from disk and removes its metadata record
   */
  delete(mediaId: string): Promise<boolean>;

  /**
   * Retrieves a single media item by ID
   */
  get(mediaId: string): Promise<MediaItem | null>;

  /**
   * Lists all media items, with optional category/target filters
   */
  list(filter?: MediaFilterOptions): Promise<MediaItem[]>;

  /**
   * Checks whether a given media URL or storage path exists on persistent server storage
   */
  exists(urlOrPath: string): Promise<boolean>;

  /**
   * Resolves the public access URL for a given item or path
   */
  getPublicUrl(itemOrPath: string | MediaItem): string;

  /**
   * Updates metadata (e.g. isPrimary, displayOrder, altText)
   */
  update(mediaId: string, updates: Partial<MediaItem>): Promise<MediaItem>;

  /**
   * Checks the health and connectivity of the media storage backend
   */
  checkHealth(): Promise<{ status: string; totalRecords: number; storageMode: string }>;
}

/**
 * Real Server-side Implementation
 * Backed by Express multipart upload and /uploads static directory + /data/media.json
 */
export class LocalServerMediaStorageService implements MediaStorageService {
  private baseUrl = '/api/media';

  /**
   * Pre-upload client validation:
   * Checks file presence, size (<50MB), allowed image types, and tests image decodability.
   */
  async validateFile(file: File): Promise<void> {
    if (!file) {
      throw new Error('No file selected.');
    }
    if (file.size === 0) {
      throw new Error('The selected file is empty (0 bytes).');
    }
    const maxBytes = 50 * 1024 * 1024; // 50MB
    if (file.size > maxBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`File size (${mb}MB) exceeds the maximum allowed limit of 50MB.`);
    }

    const name = file.name.toLowerCase();
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
    const mime = (file.type || '').toLowerCase();

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp'];
    const isValidExt = validExtensions.includes(ext);
    const isValidMime = mime.startsWith('image/') || mime === 'application/octet-stream';
    const isVideo = mime.startsWith('video/') || name.match(/\.(mp4|webm|mov)$/i);

    if (!isValidExt && !isValidMime && !isVideo) {
      throw new Error(
        `Invalid file format "${file.name}". Supported formats: JPG, JPEG, PNG, WEBP, GIF, SVG.`
      );
    }

    // Corrupted file test: verify browser can decode image raster
    if (
      typeof window !== 'undefined' &&
      typeof Image !== 'undefined' &&
      isValidMime &&
      !mime.includes('svg') &&
      !ext.endsWith('.svg') &&
      !isVideo
    ) {
      await new Promise<void>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const testImg = new Image();
        testImg.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        testImg.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`The image file "${file.name}" appears to be corrupted and cannot be decoded.`));
        };
        testImg.src = objectUrl;
      });
    }
  }

  async upload(file: File, options?: MediaUploadOptions): Promise<MediaItem> {
    await this.validateFile(file);

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      if (options?.mediaType) formData.append('mediaType', options.mediaType);
      if (options?.productId) formData.append('productId', options.productId);
      if (options?.bannerId) formData.append('bannerId', options.bannerId);
      if (options?.isPrimary !== undefined) formData.append('isPrimary', String(options.isPrimary));
      if (options?.displayOrder !== undefined) formData.append('displayOrder', String(options.displayOrder));
      if (options?.deviceType) formData.append('deviceType', options.deviceType);
      if (options?.altText) formData.append('altText', options.altText);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/upload`, true);

      if (options?.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            options.onProgress?.(percent);
          }
        };
      }

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.media) {
              const item = this.normalizeItem(res.media);
              // Verify file existence on server
              const verified = await this.exists(item.url);
              if (!verified) {
                // Short grace interval for filesystem sync
                await new Promise((r) => setTimeout(r, 150));
                const retryVerified = await this.exists(item.url);
                if (!retryVerified) {
                  return reject(new Error('Storage verification failed: file not accessible on server disk.'));
                }
              }
              resolve(item);
            } else {
              reject(new Error(res.error || 'Server reported upload failure'));
            }
          } catch (e: any) {
            reject(new Error(e?.message || 'Malformed response from upload server'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || `Server error: ${xhr.statusText}`));
          } catch {
            reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during file upload to server'));
      };

      xhr.send(formData);
    });
  }

  async replace(
    oldMediaId: string,
    newFile: File,
    options?: Partial<MediaUploadOptions>
  ): Promise<MediaItem> {
    await this.validateFile(newFile);

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', newFile);
      if (oldMediaId) formData.append('oldMediaId', oldMediaId);
      if (options?.mediaType) formData.append('mediaType', options.mediaType);
      if (options?.productId) formData.append('productId', options.productId);
      if (options?.bannerId) formData.append('bannerId', options.bannerId);
      if (options?.isPrimary !== undefined) formData.append('isPrimary', String(options.isPrimary));
      if (options?.displayOrder !== undefined) formData.append('displayOrder', String(options.displayOrder));
      if (options?.deviceType) formData.append('deviceType', options.deviceType);
      if (options?.altText) formData.append('altText', options.altText);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/replace`, true);

      if (options?.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            options.onProgress?.(percent);
          }
        };
      }

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.media) {
              const item = this.normalizeItem(res.media);
              // Verify replacement exists on server
              const verified = await this.exists(item.url);
              if (!verified) {
                await new Promise((r) => setTimeout(r, 150));
                const retryVerified = await this.exists(item.url);
                if (!retryVerified) {
                  return reject(new Error('Storage verification failed: replacement not accessible on server disk.'));
                }
              }
              resolve(item);
            } else {
              reject(new Error(res.error || 'Server reported replace failure'));
            }
          } catch (e: any) {
            reject(new Error(e?.message || 'Malformed response from replace endpoint'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error || `Replacement failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Replacement failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during file replacement'));
      };

      xhr.send(formData);
    });
  }

  async delete(mediaId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${encodeURIComponent(mediaId)}`, {
        method: 'DELETE',
      });
      if (res.status === 404) {
        // Record or file is already absent/deleted on server
        return true;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error && (err.error.includes('not found') || err.error.includes('already deleted'))) {
          return true;
        }
        throw new Error(err.error || `Failed to delete media (${res.status})`);
      }
      const data = await res.json();
      return !!data.success;
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return true;
      }
      throw err;
    }
  }

  async get(mediaId: string): Promise<MediaItem | null> {
    const res = await fetch(`${this.baseUrl}/${encodeURIComponent(mediaId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch media: ${res.statusText}`);
    const data = await res.json();
    return this.normalizeItem(data.media);
  }

  async list(filter?: MediaFilterOptions): Promise<MediaItem[]> {
    const params = new URLSearchParams();
    if (filter?.mediaType) params.set('mediaType', filter.mediaType);
    if (filter?.productId) params.set('productId', filter.productId);
    if (filter?.bannerId) params.set('bannerId', filter.bannerId);
    if (filter?.isActive !== undefined) params.set('isActive', String(filter.isActive));

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}${query}`);
    if (!res.ok) throw new Error(`Failed to list media: ${res.statusText}`);
    const data = await res.json();
    return (data.media || []).map((item: any) => this.normalizeItem(item));
  }

  async update(mediaId: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    const res = await fetch(`${this.baseUrl}/${encodeURIComponent(mediaId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update media record');
    }
    const data = await res.json();
    return this.normalizeItem(data.media);
  }

  async exists(urlOrPath: string): Promise<boolean> {
    if (!urlOrPath) return false;
    try {
      const res = await fetch(`${this.baseUrl}/verify?url=${encodeURIComponent(urlOrPath)}`);
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.exists;
    } catch {
      return false;
    }
  }

  getPublicUrl(itemOrPath: string | MediaItem): string {
    if (!itemOrPath) return '';
    if (typeof itemOrPath === 'string') {
      if (itemOrPath.startsWith('http://') || itemOrPath.startsWith('https://')) {
        return itemOrPath;
      }
      return itemOrPath.startsWith('/') ? itemOrPath : `/${itemOrPath}`;
    }
    return itemOrPath.url || itemOrPath.downloadURL || (itemOrPath.filePath ? `/${itemOrPath.filePath}` : '');
  }

  async checkHealth(): Promise<{ status: string; totalRecords: number; storageMode: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) return { status: 'offline', totalRecords: 0, storageMode: 'server-local' };
      const data = await res.json();
      return {
        status: data.status,
        totalRecords: data.totalRecords || 0,
        storageMode: data.storageMode || 'server-local',
      };
    } catch {
      return { status: 'offline', totalRecords: 0, storageMode: 'server-local' };
    }
  }

  // Helper to ensure both old and new schema fields exist for 100% compatibility
  private normalizeItem(raw: any): MediaItem {
    return {
      id: raw.id,
      originalName: raw.originalName || raw.fileName || 'asset',
      fileName: raw.fileName || raw.originalName || 'asset',
      filePath: raw.filePath || `uploads/${raw.mediaType || 'general'}/${raw.fileName}`,
      url: raw.url || raw.downloadURL || '',
      mimeType: raw.mimeType || raw.contentType || 'image/jpeg',
      size: raw.size || raw.fileSize || 0,
      mediaType: raw.mediaType || 'general',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      isActive: raw.isActive !== undefined ? raw.isActive : true,
      productId: raw.productId,
      bannerId: raw.bannerId,
      isPrimary: raw.isPrimary,
      displayOrder: raw.displayOrder,
      deviceType: raw.deviceType || 'desktop',
      altText: raw.altText,
      // Backward compatibility bindings:
      downloadURL: raw.url || raw.downloadURL || '',
      storagePath: raw.filePath || raw.storagePath || '',
      fileSize: raw.size || raw.fileSize || 0,
      contentType: raw.mimeType || raw.contentType || 'image/jpeg',
      mediaId: raw.id,
      targetId: raw.productId || raw.bannerId || raw.targetId,
    };
  }
}

/**
 * Future Firebase Migration Stub:
 * When Firebase Storage is reintroduced, implement FirebaseMediaStorageService
 * and change the export below to `new FirebaseMediaStorageService()`
 */
export const mediaStorageService: MediaStorageService = new LocalServerMediaStorageService();
