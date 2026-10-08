import JSZip from 'jszip';
import {
  CURRENT_IMAGE_STORAGE_MODE,
  ImageStorageMode,
  ImageEntityType,
  StoredImageRecord,
  ImageStorageStats,
  ImageBackupManifest,
  ImageManifestEntry,
} from '../types/imageStorage';

const DB_NAME = 'SECRETPRESSO_LocalStorage';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// Allowed MIME types & extensions
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 Megabytes

/**
 * Open or initialize the dedicated persistent IndexedDB database.
 * CRITICAL RULE: NEVER calls deleteDatabase. NEVER clears records automatically.
 * Database version upgrades safely preserve existing data.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Safe creation: Only create object store if it does not already exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_entityType', 'entityType', { unique: false });
        store.createIndex('by_entityId', 'entityId', { unique: false });
        store.createIndex('by_createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event: Event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('Failed to open IndexedDB SECRETPRESSO_LocalStorage:', error);
      reject(error || new Error('Failed to open IndexedDB'));
    };

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked: Please close other tabs of the application.');
    };
  });
}

/**
 * Measure image dimensions if possible
 */
function getImageDimensions(blob: Blob): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.Image) {
      resolve({});
      return;
    }
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}

/**
 * Format bytes into human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Central Image Storage Service
 * Fully implements persistent temporary local storage using IndexedDB.
 * Designed to cleanly migrate to cloud storage in the future without changing consumer code.
 */
export class ImageStorageService {
  private readonly storageMode: ImageStorageMode = CURRENT_IMAGE_STORAGE_MODE;

  public getStorageMode(): ImageStorageMode {
    return this.storageMode;
  }

  /**
   * Validate image file or blob
   */
  public validateImageFile(fileOrBlob: File | Blob): { valid: boolean; error?: string } {
    if (!fileOrBlob) {
      return { valid: false, error: 'No image file provided' };
    }

    const mime = fileOrBlob.type.toLowerCase();
    const isAllowedMime = ALLOWED_IMAGE_MIME_TYPES.some((allowed) => mime === allowed);
    
    // Also check extension if File object has a name
    const fileName = (fileOrBlob as File).name || '';
    const hasAllowedExt = /\.(jpg|jpeg|png|webp|avif)$/i.test(fileName);

    if (!isAllowedMime && !hasAllowedExt) {
      return {
        valid: false,
        error: 'Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP, AVIF.',
      };
    }

    if (fileOrBlob.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: `Image file exceeds maximum recommended size of 15 MB (${formatBytes(fileOrBlob.size)}).`,
      };
    }

    return { valid: true };
  }

  /**
   * Saves an image File or Blob to persistent IndexedDB.
   * CRITICAL FLOW:
   * 1. Validate
   * 2. Read dimensions
   * 3. Generate permanent ID (e.g. img_173456789_xyz)
   * 4. Write to IndexedDB
   * 5. Read back immediately to verify write integrity.
   * If write or verification fails, throws error: "Image could not be saved. Please try again."
   */
  public async saveImage(
    fileOrBlob: File | Blob,
    options: {
      fileName?: string;
      entityType?: ImageEntityType;
      entityId?: string;
      id?: string;
    } = {}
  ): Promise<StoredImageRecord> {
    const validation = this.validateImageFile(fileOrBlob);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file');
    }

    const db = await openDatabase();
    const dimensions = await getImageDimensions(fileOrBlob);

    const now = new Date().toISOString();
    const fileName =
      options.fileName ||
      (fileOrBlob as File).name ||
      `image_${Date.now()}.${fileOrBlob.type.split('/')[1] || 'jpg'}`;

    const id =
      options.id ||
      `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const record: StoredImageRecord = {
      id,
      blob: fileOrBlob,
      fileName,
      mimeType: fileOrBlob.type || 'image/jpeg',
      fileSize: fileOrBlob.size,
      width: dimensions.width,
      height: dimensions.height,
      entityType: options.entityType || 'other',
      entityId: options.entityId,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Write record to IndexedDB
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = (e) => {
        console.error('Error saving image to IndexedDB:', e);
        reject(new Error('Image could not be saved. Please try again.'));
      };
      transaction.onerror = (e) => {
        console.error('Transaction error saving image:', e);
        reject(new Error('Image could not be saved. Please try again.'));
      };
    });

    // 2. CRITICAL VERIFICATION: Read back the image immediately from IndexedDB
    const verified = await this.getImage(id);
    if (!verified || !verified.blob || verified.blob.size === 0) {
      throw new Error('Image could not be saved. Verification failed. Please try again.');
    }

    return verified;
  }

  /**
   * Retrieves image record by permanent ID
   */
  public async getImage(id: string): Promise<StoredImageRecord | null> {
    if (!id || typeof id !== 'string') return null;

    try {
      const db = await openDatabase();
      return new Promise<StoredImageRecord | null>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = (e) => {
          console.error(`Error reading image ${id} from IndexedDB:`, e);
          reject(e);
        };
      });
    } catch (err) {
      console.error(`Failed to get image ${id}:`, err);
      return null;
    }
  }

  /**
   * Retrieves the raw Blob of an image
   */
  public async getImageBlob(id: string): Promise<Blob | null> {
    const record = await this.getImage(id);
    return record ? record.blob : null;
  }

  /**
   * Creates an ephemeral Object URL for rendering an image from IndexedDB.
   * NOTE: The caller should revoke this URL with URL.revokeObjectURL() when finished.
   */
  public async getImageUrl(id: string): Promise<string | null> {
    const blob = await this.getImageBlob(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  /**
   * Checks whether an image exists in IndexedDB
   */
  public async imageExists(id: string): Promise<boolean> {
    if (!id) return false;
    const record = await this.getImage(id);
    return !!record;
  }

  /**
   * Fail-safe image replacement:
   * 1. Existing image is kept intact
   * 2. New image is written and verified in IndexedDB FIRST
   * 3. Only if new image succeeds is the new image record returned
   * 4. Old image is NEVER automatically deleted!
   */
  public async replaceImage(
    oldId: string,
    newFileOrBlob: File | Blob,
    options: {
      fileName?: string;
      entityType?: ImageEntityType;
      entityId?: string;
    } = {}
  ): Promise<{ newRecord: StoredImageRecord; oldRecordId: string }> {
    // Save new image first
    const newRecord = await this.saveImage(newFileOrBlob, options);
    // Verification succeeded
    return {
      newRecord,
      oldRecordId: oldId,
    };
  }

  /**
   * Manual image deletion.
   * ONLY invoked when explicitly confirmed by admin.
   */
  public async deleteImage(id: string): Promise<boolean> {
    if (!id) return false;

    try {
      const db = await openDatabase();
      return new Promise<boolean>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => {
          console.error(`Error deleting image ${id} from IndexedDB:`, e);
          reject(e);
        };
      });
    } catch (err) {
      console.error(`Failed to delete image ${id}:`, err);
      return false;
    }
  }

  /**
   * List all stored images with optional filtering
   */
  public async listImages(filter?: {
    entityType?: ImageEntityType;
    entityId?: string;
  }): Promise<StoredImageRecord[]> {
    try {
      const db = await openDatabase();
      return new Promise<StoredImageRecord[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          let results: StoredImageRecord[] = request.result || [];
          if (filter?.entityType) {
            results = results.filter((img) => img.entityType === filter.entityType);
          }
          if (filter?.entityId) {
            results = results.filter((img) => img.entityId === filter.entityId);
          }
          // Sort most recent first
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(results);
        };
        request.onerror = (e) => {
          console.error('Error listing images from IndexedDB:', e);
          reject(e);
        };
      });
    } catch (err) {
      console.error('Failed to list images:', err);
      return [];
    }
  }

  /**
   * Compute comprehensive storage statistics
   */
  public async getStorageStats(): Promise<ImageStorageStats> {
    const all = await this.listImages();
    let totalBytes = 0;
    let productsCount = 0;
    let categoriesCount = 0;
    let homepageCount = 0;
    let otherCount = 0;
    let lastUploadedAt: string | undefined = undefined;

    for (const img of all) {
      totalBytes += img.fileSize || img.blob?.size || 0;
      if (img.entityType === 'product' || img.entityType === 'gallery') {
        productsCount++;
      } else if (img.entityType === 'category') {
        categoriesCount++;
      } else if (
        img.entityType === 'hero' ||
        img.entityType === 'banner' ||
        img.entityType === 'homepage' ||
        img.entityType === 'section' ||
        img.entityType === 'surprise' ||
        img.entityType === 'story' ||
        img.entityType === 'tiramisu'
      ) {
        homepageCount++;
      } else {
        otherCount++;
      }

      if (!lastUploadedAt || new Date(img.createdAt) > new Date(lastUploadedAt)) {
        lastUploadedAt = img.createdAt;
      }
    }

    return {
      storageMode: this.storageMode,
      totalImages: all.length,
      totalBytes,
      formattedTotalSize: formatBytes(totalBytes),
      productsCount,
      categoriesCount,
      homepageCount,
      otherCount,
      lastUploadedAt,
    };
  }

  /**
   * Export all images into a structured downloadable ZIP archive
   * Contains organized folders (/products/, /categories/, /homepage/, /banners/, /surprise/, /gallery/, /other/)
   * and a manifest.json file.
   * CRITICAL: Exporting NEVER deletes the IndexedDB records.
   */
  public async exportImagesZip(): Promise<Blob> {
    const images = await this.listImages();
    const zip = new JSZip();

    // Create folders
    const folders: Record<string, JSZip> = {
      product: zip.folder('products')!,
      gallery: zip.folder('gallery')!,
      category: zip.folder('categories')!,
      hero: zip.folder('homepage')!,
      banner: zip.folder('banners')!,
      homepage: zip.folder('homepage')!,
      section: zip.folder('homepage')!,
      surprise: zip.folder('surprise')!,
      story: zip.folder('homepage')!,
      tiramisu: zip.folder('homepage')!,
      other: zip.folder('other')!,
    };

    const manifestEntries: ImageManifestEntry[] = [];
    let totalBytes = 0;

    for (const img of images) {
      totalBytes += img.fileSize;
      const targetFolder = folders[img.entityType] || folders.other;
      const safeName = `${img.id}_${img.fileName.replace(/[/\\?%*:|"<>]/g, '_')}`;
      const relativePath = `${targetFolder === folders.product ? 'products' : targetFolder === folders.category ? 'categories' : targetFolder === folders.banner ? 'banners' : targetFolder === folders.surprise ? 'surprise' : targetFolder === folders.gallery ? 'gallery' : 'homepage'}/${safeName}`;

      targetFolder.file(safeName, img.blob);

      manifestEntries.push({
        imageId: img.id,
        fileName: img.fileName,
        entityType: img.entityType,
        entityId: img.entityId,
        mimeType: img.mimeType,
        fileSize: img.fileSize,
        width: img.width,
        height: img.height,
        relativePath,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
        isMigrated: img.isMigrated,
        permanentUrl: img.permanentUrl,
      });
    }

    const manifest: ImageBackupManifest = {
      version: '1.0.0',
      appName: 'SECRETpresso',
      storageMode: this.storageMode,
      exportedAt: new Date().toISOString(),
      totalImages: images.length,
      totalBytes,
      images: manifestEntries,
    };

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  /**
   * Import images from an exported backup ZIP archive back into IndexedDB.
   * Reads manifest.json and restores every image blob.
   * Won't overwrite existing images unless overwriteExisting is set to true.
   */
  public async importImagesZip(
    zipBlobOrFile: Blob | File,
    overwriteExisting = false
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const zip = await JSZip.loadAsync(zipBlobOrFile);
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      throw new Error('Invalid backup archive: missing manifest.json');
    }

    const manifestText = await manifestFile.async('text');
    const manifest: ImageBackupManifest = JSON.parse(manifestText);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of manifest.images) {
      try {
        const exists = await this.imageExists(entry.imageId);
        if (exists && !overwriteExisting) {
          skipped++;
          continue;
        }

        // Find file in zip by relative path or fallback to finding by name
        let fileInZip = zip.file(entry.relativePath);
        if (!fileInZip) {
          const matchingFiles = zip.file(new RegExp(`.*${entry.imageId}.*`));
          if (matchingFiles.length > 0) {
            fileInZip = matchingFiles[0];
          }
        }

        if (!fileInZip) {
          errors.push(`Could not find file for ${entry.imageId} in ZIP.`);
          continue;
        }

        const fileBlob = await fileInZip.async('blob');
        const typedBlob = new Blob([fileBlob], { type: entry.mimeType || 'image/jpeg' });

        await this.saveImage(typedBlob, {
          id: entry.imageId,
          fileName: entry.fileName,
          entityType: entry.entityType,
          entityId: entry.entityId,
        });

        imported++;
      } catch (err: any) {
        errors.push(`Failed to import ${entry.imageId}: ${err.message || err}`);
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Architectural hook for future permanent cloud storage migration.
   * Prepares existing local images to be migrated safely.
   *
   * Migration safety guarantees:
   * - Keeps local image if upload fails
   * - Keeps local image if URL verification fails
   * - Keeps local image until explicitly deleted by admin
   */
  public async migrateImagesToPermanentStorage(
    uploaderFn?: (record: StoredImageRecord) => Promise<string>
  ): Promise<{ total: number; migrated: number; failed: number; errors: string[] }> {
    if (!uploaderFn) {
      return {
        total: 0,
        migrated: 0,
        failed: 0,
        errors: ['No permanent storage uploader configured yet (local mode active).'],
      };
    }

    const images = await this.listImages();
    let migrated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const record of images) {
      if (record.isMigrated && record.permanentUrl) {
        continue; // Already migrated
      }

      try {
        // 1. Upload to permanent storage
        const permanentUrl = await uploaderFn(record);

        // 2. Verify URL
        if (!permanentUrl || !permanentUrl.startsWith('http')) {
          throw new Error('Permanent storage returned an invalid URL');
        }

        // 3. Mark as migrated in IndexedDB record, keeping the local copy intact!
        const db = await openDatabase();
        const updatedRecord: StoredImageRecord = {
          ...record,
          isMigrated: true,
          permanentUrl,
          updatedAt: new Date().toISOString(),
        };

        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const req = store.put(updatedRecord);
          req.onsuccess = () => resolve();
          req.onerror = (e) => reject(e);
        });

        migrated++;
      } catch (err: any) {
        failed++;
        errors.push(`Migration failed for ${record.id}: ${err.message || err}`);
        // LOCAL IMAGE REMAINS INTACT
      }
    }

    return {
      total: images.length,
      migrated,
      failed,
      errors,
    };
  }
}

// Export singleton instance
export const imageStorageService = new ImageStorageService();
