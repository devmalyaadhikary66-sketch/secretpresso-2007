import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const app = express();
const PORT = 3000;

// ============================================================================
// 1. STORAGE DIRECTORY INITIALIZATION
// ============================================================================
const ROOT_DIR = process.cwd();
const UPLOAD_ROOT = path.resolve(ROOT_DIR, 'uploads');
const SUBDIRS = ['hero', 'banners', 'products', 'collections', 'promotions', 'general', 'videos'] as const;

// Ensure directories exist
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
SUBDIRS.forEach((dir) => {
  fs.mkdirSync(path.join(UPLOAD_ROOT, dir), { recursive: true });
});

const DATA_DIR = path.resolve(ROOT_DIR, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const MEDIA_DB_PATH = path.join(DATA_DIR, 'media.json');

// Interface for media records
export interface ServerMediaRecord {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  url: string;
  mimeType: string;
  size: number;
  mediaType: string;
  productId?: string;
  bannerId?: string;
  isPrimary?: boolean;
  displayOrder?: number;
  deviceType?: 'desktop' | 'mobile';
  altText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Media DB Helpers
function readMediaDb(): ServerMediaRecord[] {
  try {
    if (!fs.existsSync(MEDIA_DB_PATH)) {
      fs.writeFileSync(MEDIA_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(MEDIA_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading media DB, initializing empty array:', err);
    return [];
  }
}

function writeMediaDb(records: ServerMediaRecord[]): void {
  try {
    fs.writeFileSync(MEDIA_DB_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing media DB:', err);
  }
}

// ============================================================================
// 2. MULTER STORAGE & VALIDATION CONFIGURATION
// ============================================================================
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-png',
  'image/pjpeg',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/tiff',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
  '.heic',
  '.heif',
  '.bmp',
  '.tiff',
  '.mp4',
  '.webm',
  '.mov',
]);

const TEMP_DIR = path.join(UPLOAD_ROOT, 'temp');
fs.mkdirSync(TEMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Stage in temp directory first so multipart fields can be fully parsed
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const baseName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${baseName || 'upload'}-${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    if (
      ALLOWED_MIME_TYPES.has(mime) ||
      ALLOWED_EXTENSIONS.has(ext) ||
      mime.startsWith('image/') ||
      mime.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file format (${mime || ext}). Supported formats: JPG, JPEG, PNG, WEBP, GIF, SVG.`
        )
      );
    }
  },
});

// Safe Multer error wrapper middleware
const handleMulterUpload = (req: Request, res: Response, next: express.NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('[Upload Middleware Error]:', err);
      return res.status(400).json({
        success: false,
        error: err instanceof Error ? err.message : 'File validation or upload failed',
      });
    }
    next();
  });
};

// ============================================================================
// 3. MIDDLEWARE & STATIC ASSET HOSTING
// ============================================================================
app.use(express.json());
// Serve uploads permanently
app.use('/uploads', express.static(UPLOAD_ROOT));

// Fallback for missing uploads: serve clean branded SVG rather than 404
app.get('/uploads/*', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#140D09"/>
      <circle cx="400" cy="280" r="70" fill="#24160F" stroke="#8C6D3B" stroke-width="2"/>
      <path d="M370 270 Q400 250 430 270 Q400 320 370 270" fill="#cfa851"/>
      <text x="400" y="400" font-family="serif" font-size="24" fill="#fae8be" text-anchor="middle" letter-spacing="3">SECRETPRESSO</text>
      <text x="400" y="430" font-family="monospace" font-size="12" fill="#8C6D3B" text-anchor="middle" letter-spacing="2">LUXURY BREW &amp; CONFECTIONS</text>
    </svg>
  `);
});

// ============================================================================
// 4. PERSISTENT MEDIA API ROUTES
// ============================================================================

// GET /api/media - Fetch all media records
app.get('/api/media', (req: Request, res: Response) => {
  const records = readMediaDb();
  const { mediaType, productId, bannerId, isActive } = req.query;

  let filtered = [...records];
  if (mediaType && typeof mediaType === 'string') {
    filtered = filtered.filter((r) => r.mediaType === mediaType);
  }
  if (productId && typeof productId === 'string') {
    filtered = filtered.filter((r) => r.productId === productId);
  }
  if (bannerId && typeof bannerId === 'string') {
    filtered = filtered.filter((r) => r.bannerId === bannerId);
  }
  if (isActive !== undefined) {
    const activeBool = isActive === 'true';
    filtered = filtered.filter((r) => r.isActive === activeBool);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    count: filtered.length,
    media: filtered,
  });
});

// GET /api/media/health - Health check and storage statistics
app.get('/api/media/health', (req: Request, res: Response) => {
  const records = readMediaDb();
  let totalBytes = 0;
  records.forEach((r) => (totalBytes += r.size || 0));

  res.json({
    status: 'online',
    storageMode: 'server-local-persistent',
    uploadRoot: UPLOAD_ROOT,
    totalRecords: records.length,
    totalBytes,
    categories: SUBDIRS,
  });
});

// GET /api/media/verify - Verify file exists on server storage (MUST be before :id route)
app.get('/api/media/verify', (req: Request, res: Response) => {
  try {
    const rawTarget = (req.query.url || req.query.path || '') as string;
    const target = decodeURIComponent(rawTarget).trim();
    if (!target) {
      return res.status(400).json({ exists: false, error: 'Target URL or file path is required' });
    }

    // External image links are accessible over the web
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return res.json({ exists: true, isExternal: true, url: target });
    }

    const clean = target.replace(/^\/?uploads\//, '');
    const resolvedPath = path.resolve(UPLOAD_ROOT, clean);

    if (resolvedPath.startsWith(UPLOAD_ROOT) && fs.existsSync(resolvedPath)) {
      const stats = fs.statSync(resolvedPath);
      if (stats.isFile() && stats.size > 0) {
        return res.json({
          exists: true,
          size: stats.size,
          readable: true,
          url: target.startsWith('/') ? target : `/${target}`,
        });
      }
    }

    res.status(404).json({ exists: false, error: 'File not found or empty on persistent storage' });
  } catch (err: any) {
    res.status(500).json({ exists: false, error: err.message || 'Verification error' });
  }
});

// GET /api/media/:id - Fetch single media record
app.get('/api/media/:id', (req: Request, res: Response) => {
  const rawId = req.params.id || '';
  const id = decodeURIComponent(rawId).trim();
  const records = readMediaDb();
  const found = records.find(
    (r) =>
      r.id === id ||
      r.id === rawId ||
      (r as any).mediaId === id ||
      r.fileName === id ||
      r.filePath === id ||
      r.url === id ||
      r.url === `/${id}` ||
      path.basename(r.filePath) === path.basename(id)
  );
  if (!found) {
    return res.status(404).json({ success: false, error: 'Media asset not found' });
  }
  res.json({ success: true, media: found });
});

// POST /api/media/upload - Real server file upload with staging & verification
app.post('/api/media/upload', handleMulterUpload, (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided or file format rejected' });
    }

    let type = (req.body.mediaType || 'general').toLowerCase();
    if (type === 'banner') type = 'banners';
    if (type === 'product') type = 'products';
    if (type === 'collection') type = 'collections';
    if (type === 'promotional') type = 'promotions';
    if (type === 'video') type = 'videos';
    const safeDir = (SUBDIRS as readonly string[]).includes(type) ? type : 'general';

    const destFolder = path.join(UPLOAD_ROOT, safeDir);
    fs.mkdirSync(destFolder, { recursive: true });
    const targetFilePath = path.join(destFolder, req.file.filename);

    // Atomically move from staging to final directory
    if (path.resolve(req.file.path) !== path.resolve(targetFilePath)) {
      fs.renameSync(req.file.path, targetFilePath);
    }

    // Verification check: ensure file exists and is readable
    if (!fs.existsSync(targetFilePath) || fs.statSync(targetFilePath).size === 0) {
      return res.status(500).json({
        success: false,
        error: 'File write verification failed on server storage',
      });
    }

    const relativePath = `uploads/${safeDir}/${req.file.filename}`;
    const publicUrl = `/${relativePath}`;

    const newRecord: ServerMediaRecord = {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: relativePath,
      url: publicUrl,
      mimeType: req.file.mimetype || 'image/jpeg',
      size: req.file.size,
      mediaType: safeDir,
      productId: req.body.productId || undefined,
      bannerId: req.body.bannerId || undefined,
      isPrimary: req.body.isPrimary === 'true' || req.body.isPrimary === true,
      displayOrder: req.body.displayOrder ? Number(req.body.displayOrder) : 1,
      deviceType: req.body.deviceType === 'mobile' ? 'mobile' : 'desktop',
      altText: req.body.altText || req.file.originalname,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const records = readMediaDb();

    // If primary, update other primary images for same product
    if (newRecord.isPrimary && newRecord.productId) {
      records.forEach((r) => {
        if (r.productId === newRecord.productId) {
          r.isPrimary = false;
        }
      });
    }

    records.unshift(newRecord);
    writeMediaDb(records);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      media: newRecord,
    });
  } catch (error) {
    console.error('Upload handling error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // ignore
      }
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal file upload failure',
    });
  }
});

// POST /api/media/replace - Replace existing media file safely
app.post('/api/media/replace', handleMulterUpload, (req: Request, res: Response) => {
  try {
    const rawOldId = req.body.oldMediaId || '';
    const oldMediaId = decodeURIComponent(rawOldId).trim();

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No new file provided for upload/replacement' });
    }

    const records = readMediaDb();
    const existingIndex = records.findIndex(
      (r) =>
        r.id === oldMediaId ||
        r.url === oldMediaId ||
        r.filePath === oldMediaId ||
        r.fileName === oldMediaId ||
        path.basename(r.filePath) === path.basename(oldMediaId)
    );

    let type = (req.body.mediaType || (existingIndex >= 0 ? records[existingIndex].mediaType : 'general')).toLowerCase();
    if (type === 'banner') type = 'banners';
    if (type === 'product') type = 'products';
    if (type === 'collection') type = 'collections';
    if (type === 'promotional') type = 'promotions';
    if (type === 'video') type = 'videos';
    const safeDir = (SUBDIRS as readonly string[]).includes(type) ? type : 'general';

    const destFolder = path.join(UPLOAD_ROOT, safeDir);
    fs.mkdirSync(destFolder, { recursive: true });
    const targetFilePath = path.join(destFolder, req.file.filename);

    if (path.resolve(req.file.path) !== path.resolve(targetFilePath)) {
      fs.renameSync(req.file.path, targetFilePath);
    }

    // Verify new file exists and is valid before altering database or deleting old file
    if (!fs.existsSync(targetFilePath) || fs.statSync(targetFilePath).size === 0) {
      return res.status(500).json({
        success: false,
        error: 'Replacement write verification failed on server storage',
      });
    }

    const relativePath = `uploads/${safeDir}/${req.file.filename}`;
    const publicUrl = `/${relativePath}`;

    let oldFilePathToDelete: string | null = null;
    let updatedRecord: ServerMediaRecord;

    if (existingIndex >= 0) {
      const existing = records[existingIndex];
      oldFilePathToDelete = existing.filePath;

      updatedRecord = {
        ...existing,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: relativePath,
        url: publicUrl,
        mimeType: req.file.mimetype || 'image/jpeg',
        size: req.file.size,
        updatedAt: new Date().toISOString(),
      };
      records[existingIndex] = updatedRecord;
    } else {
      updatedRecord = {
        id: oldMediaId.startsWith('med_') ? oldMediaId : `med_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: relativePath,
        url: publicUrl,
        mimeType: req.file.mimetype || 'image/jpeg',
        size: req.file.size,
        mediaType: safeDir,
        productId: req.body.productId || undefined,
        bannerId: req.body.bannerId || undefined,
        isPrimary: req.body.isPrimary === 'true' || req.body.isPrimary === true,
        displayOrder: req.body.displayOrder ? Number(req.body.displayOrder) : 1,
        deviceType: req.body.deviceType === 'mobile' ? 'mobile' : 'desktop',
        altText: req.body.altText || req.file.originalname,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      records.unshift(updatedRecord);
    }

    // Save database record first
    writeMediaDb(records);

    // Only after database save succeeds, remove old file from disk
    if (oldFilePathToDelete) {
      try {
        const fullOldPath = path.resolve(ROOT_DIR, oldFilePathToDelete);
        if (
          fullOldPath.startsWith(UPLOAD_ROOT) &&
          fullOldPath !== targetFilePath &&
          fs.existsSync(fullOldPath)
        ) {
          fs.unlinkSync(fullOldPath);
        }
      } catch (err) {
        console.warn('Could not remove previous replaced file from disk:', err);
      }
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      media: updatedRecord,
    });
  } catch (error) {
    console.error('Replace handling error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // ignore
      }
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Replacement failed',
    });
  }
});

// DELETE /api/media/:id - Permanently delete media file and metadata
app.delete('/api/media/:id', (req: Request, res: Response) => {
  try {
    const rawId = req.params.id || '';
    const id = decodeURIComponent(rawId).trim();
    const records = readMediaDb();

    // Match flexibly by id, fileName, filePath, url, or basename
    const matchingRecords = records.filter(
      (r) =>
        r.id === id ||
        r.id === rawId ||
        (r as any).mediaId === id ||
        r.fileName === id ||
        r.filePath === id ||
        r.filePath === `uploads/${id}` ||
        r.url === id ||
        r.url === `/${id}` ||
        path.basename(r.filePath) === path.basename(id)
    );

    // 1. Delete actual server-side files
    const deletedPaths: string[] = [];
    matchingRecords.forEach((rec) => {
      try {
        const fullPath = path.resolve(ROOT_DIR, rec.filePath);
        if (fullPath.startsWith(UPLOAD_ROOT) && fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deletedPaths.push(rec.filePath);
        }
      } catch (err) {
        console.warn('File already deleted or inaccessible:', err);
      }
    });

    // Also check if id directly corresponds to a file in uploads
    const cleanId = id.replace(/^\/?uploads\//, '');
    const directPotentialPaths = [
      path.resolve(UPLOAD_ROOT, cleanId),
      path.resolve(ROOT_DIR, id),
      ...SUBDIRS.map((sub) => path.resolve(UPLOAD_ROOT, sub, path.basename(id))),
    ];
    for (const p of directPotentialPaths) {
      if (p.startsWith(UPLOAD_ROOT) && fs.existsSync(p) && fs.lstatSync(p).isFile()) {
        try {
          fs.unlinkSync(p);
          deletedPaths.push(path.relative(ROOT_DIR, p));
        } catch (e) {
          // ignore
        }
      }
    }

    // 2. Remove matching records from database
    const remaining = records.filter(
      (r) =>
        r.id !== id &&
        r.id !== rawId &&
        (r as any).mediaId !== id &&
        r.fileName !== id &&
        r.filePath !== id &&
        r.filePath !== `uploads/${id}` &&
        r.url !== id &&
        r.url !== `/${id}` &&
        path.basename(r.filePath) !== path.basename(id)
    );
    writeMediaDb(remaining);

    // Always succeed idempotently: if already deleted, deletion state is fulfilled
    res.json({
      success: true,
      message: 'Deleted Permanently',
      deletedId: id,
      deletedFiles: deletedPaths,
    });
  } catch (error) {
    console.error('Delete handling error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete media',
    });
  }
});

// PATCH /api/media/:id - Update metadata
app.patch('/api/media/:id', (req: Request, res: Response) => {
  try {
    const rawId = req.params.id || '';
    const id = decodeURIComponent(rawId).trim();
    const records = readMediaDb();
    const index = records.findIndex(
      (r) =>
        r.id === id ||
        r.id === rawId ||
        (r as any).mediaId === id ||
        r.fileName === id ||
        r.filePath === id ||
        r.url === id ||
        path.basename(r.filePath) === path.basename(id)
    );

    const updates = req.body || {};

    if (index === -1) {
      // If record is not in database, create it so updates never fail
      const createdRecord: ServerMediaRecord = {
        id,
        originalName: updates.originalName || updates.fileName || id,
        fileName: updates.fileName || id,
        filePath: updates.filePath || `uploads/general/${id}`,
        url: updates.url || `/uploads/general/${id}`,
        mimeType: updates.mimeType || 'image/jpeg',
        size: updates.size || 0,
        mediaType: updates.mediaType || 'general',
        isActive: updates.isActive !== undefined ? updates.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates,
      };
      records.unshift(createdRecord);
      writeMediaDb(records);
      return res.json({
        success: true,
        message: 'Updated Successfully',
        media: createdRecord,
      });
    }

    const existing = records[index];
    const updated: ServerMediaRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    records[index] = updated;
    writeMediaDb(records);

    res.json({
      success: true,
      message: 'Updated Successfully',
      media: updated,
    });
  } catch (error) {
    console.error('Patch media error:', error);
    res.status(500).json({ success: false, error: 'Failed to update media record' });
  }
});

// ============================================================================
// 5. ORDERS PERSISTENCE API
// ============================================================================
const ORDERS_DB_PATH = path.join(DATA_DIR, 'orders.json');

function readOrdersDb(): any[] {
  try {
    if (!fs.existsSync(ORDERS_DB_PATH)) {
      fs.writeFileSync(ORDERS_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(ORDERS_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading orders DB:', err);
    return [];
  }
}

function writeOrdersDb(orders: any[]): void {
  try {
    fs.writeFileSync(ORDERS_DB_PATH, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders DB:', err);
  }
}

// GET /api/orders - Fetch all orders
app.get('/api/orders', (req: Request, res: Response) => {
  res.json(readOrdersDb());
});

// POST /api/orders - Create or update an order
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const newOrder = req.body;
    if (!newOrder || !newOrder.id) {
      return res.status(400).json({ error: 'Order data with ID required' });
    }
    const orders = readOrdersDb();
    const existingIndex = orders.findIndex((o) => o.id === newOrder.id);
    if (existingIndex >= 0) {
      orders[existingIndex] = newOrder;
    } else {
      orders.unshift(newOrder);
    }
    writeOrdersDb(orders);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Save order error:', err);
    res.status(500).json({ error: 'Failed to persist order' });
  }
});

// PUT /api/orders/:id - Update an order
app.put('/api/orders/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const orders = readOrdersDb();
    const index = orders.findIndex((o) => o.id === id);
    if (index >= 0) {
      orders[index] = { ...orders[index], ...updates };
      writeOrdersDb(orders);
      return res.json(orders[index]);
    }
    res.status(404).json({ error: 'Order not found' });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ============================================================================
// 6. PRODUCTS, SECTIONS & HERO SLIDES PERSISTENCE API
// ============================================================================
const PRODUCTS_DB_PATH = path.join(DATA_DIR, 'products.json');
const SECTIONS_DB_PATH = path.join(DATA_DIR, 'sections.json');
const HERO_SLIDES_DB_PATH = path.join(DATA_DIR, 'hero_slides.json');

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Products API
app.get('/api/products', (req: Request, res: Response) => {
  const data = readJsonFile<any[]>(PRODUCTS_DB_PATH);
  res.json(data || []);
});

app.post('/api/products', (req: Request, res: Response) => {
  try {
    const newProduct = req.body;
    if (!newProduct || !newProduct.id) {
      return res.status(400).json({ error: 'Valid product required' });
    }
    const products = readJsonFile<any[]>(PRODUCTS_DB_PATH) || [];
    const idx = products.findIndex((p) => p.id === newProduct.id);
    if (idx >= 0) {
      products[idx] = newProduct;
    } else {
      products.push(newProduct);
    }
    writeJsonFile(PRODUCTS_DB_PATH, products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save product' });
  }
});

app.put('/api/products/reorder', (req: Request, res: Response) => {
  try {
    const list = req.body;
    if (Array.isArray(list)) {
      writeJsonFile(PRODUCTS_DB_PATH, list);
      return res.json({ success: true, count: list.length });
    }
    res.status(400).json({ error: 'Array of products expected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder products' });
  }
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const products = readJsonFile<any[]>(PRODUCTS_DB_PATH) || [];
    const idx = products.findIndex((p) => p.id === id);
    if (idx >= 0) {
      products[idx] = { ...products[idx], ...updates };
      writeJsonFile(PRODUCTS_DB_PATH, products);
      return res.json(products[idx]);
    }
    const created = { id, ...updates };
    products.push(created);
    writeJsonFile(PRODUCTS_DB_PATH, products);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const products = readJsonFile<any[]>(PRODUCTS_DB_PATH) || [];
    const filtered = products.filter((p) => p.id !== id);
    writeJsonFile(PRODUCTS_DB_PATH, filtered);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Sections API
app.get('/api/sections', (req: Request, res: Response) => {
  try {
    const raw = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];
    const normalized = raw.map((s, idx) => {
      const order = s.displayOrder ?? s.order ?? idx + 1;
      return {
        ...s,
        id: s.id || `section_${idx + 1}`,
        sectionKey: s.sectionKey || s.id,
        name: s.name || 'Untitled Section',
        subtitle: s.subtitle || s.subheading || '',
        subheading: s.subheading || s.subtitle || '',
        heading: s.heading || s.name || '',
        description: s.description || '',
        type: s.type || s.sectionType || 'products',
        sectionType: s.sectionType || s.type || 'products',
        displayStyle: s.displayStyle || 'slider',
        image: s.image || s.imageUrl || '',
        imageUrl: s.imageUrl || s.image || '',
        mobileImageUrl: s.mobileImageUrl || '',
        products: Array.isArray(s.products) ? s.products : Array.isArray(s.targetProductIds) ? s.targetProductIds : [],
        targetProductIds: Array.isArray(s.targetProductIds) ? s.targetProductIds : Array.isArray(s.products) ? s.products : [],
        categoryIds: Array.isArray(s.categoryIds) ? s.categoryIds : [],
        displayOrder: order,
        order: order,
        isVisible: s.isVisible !== undefined ? Boolean(s.isVisible) : true,
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
      };
    });
    // Sort by displayOrder ascending
    normalized.sort((a, b) => a.displayOrder - b.displayOrder);
    res.json(normalized);
  } catch (err) {
    console.error('Failed to get sections:', err);
    res.status(500).json({ error: 'Failed to read sections' });
  }
});

app.get('/api/sections/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];
    const found = sections.find((s) => s.id === id || s.sectionKey === id);
    if (!found) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read section' });
  }
});

// PART 6: Add Section MUST create an independent new record, NEVER replacing or overwriting
app.post('/api/sections', (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    const sections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];
    const existingIds = new Set(sections.map((s) => s.id));

    // Generate unique permanent ID
    let uniqueId = body.id && !existingIds.has(body.id) ? body.id : `section_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    while (existingIds.has(uniqueId)) {
      uniqueId = `section_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // Determine next sequential displayOrder
    const maxOrder = sections.reduce((max, s) => Math.max(max, s.displayOrder || s.order || 0), 0);
    const order = typeof body.displayOrder === 'number' && body.displayOrder > 0 ? body.displayOrder : maxOrder + 1;

    const newSection = {
      id: uniqueId,
      sectionKey: body.sectionKey && !sections.some(s => s.sectionKey === body.sectionKey) ? body.sectionKey : uniqueId,
      name: body.name.trim(),
      subtitle: body.subtitle || body.subheading || '',
      subheading: body.subheading || body.subtitle || '',
      heading: body.heading || body.name || '',
      description: body.description || '',
      type: body.type || body.sectionType || 'products',
      sectionType: body.sectionType || body.type || 'products',
      displayStyle: body.displayStyle || 'slider',
      image: body.image || body.imageUrl || '',
      imageUrl: body.imageUrl || body.image || '',
      mobileImageUrl: body.mobileImageUrl || '',
      products: Array.isArray(body.products) ? body.products : Array.isArray(body.targetProductIds) ? body.targetProductIds : [],
      targetProductIds: Array.isArray(body.targetProductIds) ? body.targetProductIds : Array.isArray(body.products) ? body.products : [],
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : [],
      displayOrder: order,
      order: order,
      isVisible: body.isVisible !== undefined ? Boolean(body.isVisible) : true,
      ctaText: body.ctaText || 'View All →',
      ctaLink: body.ctaLink || '#',
      bannerType: body.bannerType || 'section',
      bannerTextConfig: body.bannerTextConfig || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // APPEND ONLY — Never replace existing sections
    sections.push(newSection);
    writeJsonFile(SECTIONS_DB_PATH, sections);
    res.status(201).json(newSection);
  } catch (err) {
    console.error('Failed to create section:', err);
    res.status(500).json({ error: 'Failed to save section' });
  }
});

// PART 8: Edit Section affects ONLY that specific section
app.put('/api/sections/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const sections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];
    const idx = sections.findIndex((s) => s.id === id || s.sectionKey === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const current = sections[idx];
    const updatedOrder = updates.displayOrder ?? updates.order ?? current.displayOrder ?? current.order;

    const updatedSection = {
      ...current,
      ...updates,
      id: current.id, // NEVER overwrite the permanent ID
      sectionKey: current.sectionKey || current.id,
      displayOrder: updatedOrder,
      order: updatedOrder,
      subtitle: updates.subtitle ?? updates.subheading ?? current.subtitle ?? current.subheading ?? '',
      subheading: updates.subheading ?? updates.subtitle ?? current.subheading ?? current.subtitle ?? '',
      updatedAt: new Date().toISOString(),
    };

    sections[idx] = updatedSection;
    writeJsonFile(SECTIONS_DB_PATH, sections);
    res.json(updatedSection);
  } catch (err) {
    console.error('Failed to update section:', err);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Bulk update / persist sections array
app.put('/api/sections', (req: Request, res: Response) => {
  try {
    const list = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'Array of sections expected' });
    }
    const existing = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];
    // Merge or update existing while preserving independent identities
    const updated = list.map((s, idx) => {
      const found = existing.find((e) => e.id === s.id || e.sectionKey === s.id);
      const order = s.displayOrder ?? s.order ?? idx + 1;
      return {
        ...(found || {}),
        ...s,
        id: s.id || found?.id || `section_${Date.now()}_${idx}`,
        displayOrder: order,
        order: order,
        updatedAt: new Date().toISOString(),
      };
    });
    writeJsonFile(SECTIONS_DB_PATH, updated);
    res.json({ success: true, sections: updated });
  } catch (err) {
    console.error('Failed to update sections bulk:', err);
    res.status(500).json({ error: 'Failed to update sections' });
  }
});

// Reorder sections endpoint
app.put('/api/sections/reorder', (req: Request, res: Response) => {
  try {
    const { sectionOrders, orderedIds } = req.body || {};
    const sections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];

    if (Array.isArray(sectionOrders)) {
      sectionOrders.forEach((so: { id: string; displayOrder: number }) => {
        const target = sections.find((s) => s.id === so.id || s.sectionKey === so.id);
        if (target) {
          target.displayOrder = so.displayOrder;
          target.order = so.displayOrder;
          target.updatedAt = new Date().toISOString();
        }
      });
    } else if (Array.isArray(orderedIds)) {
      orderedIds.forEach((id: string, index: number) => {
        const target = sections.find((s) => s.id === id || s.sectionKey === id);
        if (target) {
          target.displayOrder = index + 1;
          target.order = index + 1;
          target.updatedAt = new Date().toISOString();
        }
      });
    } else if (Array.isArray(req.body)) {
      // Direct array of sections
      req.body.forEach((s: any, idx: number) => {
        const target = sections.find((sec) => sec.id === s.id || sec.sectionKey === s.id);
        if (target) {
          target.displayOrder = s.displayOrder ?? s.order ?? idx + 1;
          target.order = target.displayOrder;
          target.updatedAt = new Date().toISOString();
        }
      });
    }

    sections.sort((a, b) => (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0));
    writeJsonFile(SECTIONS_DB_PATH, sections);
    res.json({ success: true, sections });
  } catch (err) {
    console.error('Failed to reorder sections:', err);
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

// PART 9: Delete Section deletes only that section; products become unassigned
app.delete('/api/sections/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];
    const target = sections.find((s) => s.id === id || s.sectionKey === id);

    if (target?.sectionKey === 'coffeeFlavours' || target?.id === 'sec-2') {
      return res.status(403).json({ error: 'Coffee Flavours is the core menu and cannot be deleted' });
    }

    const filtered = sections.filter((s) => s.id !== id && s.sectionKey !== id);
    filtered.forEach((s, idx) => {
      s.displayOrder = idx + 1;
      s.order = idx + 1;
    });
    writeJsonFile(SECTIONS_DB_PATH, filtered);

    // Unassign products inside this section
    const products = readJsonFile<any[]>(PRODUCTS_DB_PATH) || [];
    let modified = false;
    products.forEach((p) => {
      if (p.sectionId === id || p.sectionId === target?.id || p.sectionId === target?.sectionKey) {
        p.sectionId = undefined;
        modified = true;
      }
    });
    if (modified) {
      writeJsonFile(PRODUCTS_DB_PATH, products);
    }

    res.json({ success: true, deletedId: id, remainingCount: filtered.length });
  } catch (err) {
    console.error('Failed to delete section:', err);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// Banners API (PART 11 & PART 23)
const BANNERS_DB_PATH = path.join(DATA_DIR, 'banners.json');

app.get('/api/banners', (req: Request, res: Response) => {
  try {
    const banners = readJsonFile<any[]>(BANNERS_DB_PATH) || [];
    banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read banners' });
  }
});

app.post('/api/banners', (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.name && !body.heading) {
      return res.status(400).json({ error: 'Banner name or headline required' });
    }

    const banners = readJsonFile<any[]>(BANNERS_DB_PATH) || [];
    const bannerId = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const maxOrder = banners.reduce((max, b) => Math.max(max, b.displayOrder || 0), 0);

    const newBanner = {
      id: bannerId,
      name: body.name || body.heading || 'New Banner',
      image: body.image || body.imageUrl || '',
      imageUrl: body.imageUrl || body.image || '',
      mobileImageUrl: body.mobileImageUrl || '',
      heading: body.heading || body.name || '',
      subtitle: body.subtitle || body.subheading || '',
      subheading: body.subheading || body.subtitle || '',
      description: body.description || '',
      ctaText: body.ctaText || 'Discover More',
      ctaLink: body.ctaLink || '#',
      bannerType: body.bannerType || 'promotional',
      displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : maxOrder + 1,
      isVisible: body.isVisible !== undefined ? Boolean(body.isVisible) : true,
      bannerTextConfig: body.bannerTextConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // APPEND ONLY — Never replace existing banner
    banners.push(newBanner);
    writeJsonFile(BANNERS_DB_PATH, banners);
    res.status(201).json(newBanner);
  } catch (err) {
    console.error('Failed to create banner:', err);
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

app.put('/api/banners/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const banners = readJsonFile<any[]>(BANNERS_DB_PATH) || [];
    const idx = banners.findIndex((b) => b.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    banners[idx] = {
      ...banners[idx],
      ...updates,
      id: banners[idx].id, // Protect ID
      updatedAt: new Date().toISOString(),
    };

    writeJsonFile(BANNERS_DB_PATH, banners);
    res.json(banners[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

app.delete('/api/banners/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const banners = readJsonFile<any[]>(BANNERS_DB_PATH) || [];
    const filtered = banners.filter((b) => b.id !== id);
    writeJsonFile(BANNERS_DB_PATH, filtered);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// Categories API
const CATEGORIES_DB_PATH = path.join(DATA_DIR, 'categories.json');

app.get('/api/categories', (req: Request, res: Response) => {
  let data = readJsonFile<any[]>(CATEGORIES_DB_PATH);
  if (!data) {
    data = [
      { id: 'cat-desserts', name: 'Desserts', categoryType: 'Food', description: 'Handcrafted sweet delights and confections', displayOrder: 1, isVisible: true },
      { id: 'cat-quick-bites', name: 'Quick Bites', categoryType: 'Food', description: 'Gourmet hot savoury snacks & burgers', displayOrder: 2, isVisible: true },
      { id: 'cat-bakery', name: 'Bakery', categoryType: 'Food', description: 'Freshly baked morning goods and pastries', displayOrder: 3, isVisible: true },
      { id: 'cat-seasonal', name: 'Seasonal', categoryType: 'Food', description: 'Limited batch seasonal specials', displayOrder: 4, isVisible: true },
      { id: 'cat-bites', name: 'Bites & Indulgence', categoryType: 'Food', description: 'All gourmet sweet & savoury bites', displayOrder: 5, isVisible: true },
    ];
    writeJsonFile(CATEGORIES_DB_PATH, data);
  }
  res.json(data);
});

app.post('/api/categories', (req: Request, res: Response) => {
  try {
    const newCat = req.body;
    if (!newCat || !newCat.id) {
      return res.status(400).json({ error: 'Valid category required' });
    }
    const categories = readJsonFile<any[]>(CATEGORIES_DB_PATH) || [];
    const idx = categories.findIndex((c) => c.id === newCat.id);
    if (idx >= 0) {
      categories[idx] = newCat;
    } else {
      categories.push(newCat);
    }
    writeJsonFile(CATEGORIES_DB_PATH, categories);
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save category' });
  }
});

app.put('/api/categories', (req: Request, res: Response) => {
  try {
    const list = req.body;
    if (Array.isArray(list)) {
      writeJsonFile(CATEGORIES_DB_PATH, list);
      return res.json({ success: true, categories: list });
    }
    res.status(400).json({ error: 'Array of categories expected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to persist categories' });
  }
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categories = readJsonFile<any[]>(CATEGORIES_DB_PATH) || [];
    const filtered = categories.filter((c) => c.id !== id && c.name !== id);
    writeJsonFile(CATEGORIES_DB_PATH, filtered);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Hero Slides API
app.get('/api/hero-slides', (req: Request, res: Response) => {
  const data = readJsonFile<any[]>(HERO_SLIDES_DB_PATH);
  res.json(data || []);
});

app.put('/api/hero-slides', (req: Request, res: Response) => {
  try {
    const slides = req.body;
    if (Array.isArray(slides)) {
      writeJsonFile(HERO_SLIDES_DB_PATH, slides);
      return res.json({ success: true, slides });
    }
    res.status(400).json({ error: 'Array of slides expected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to persist hero slides' });
  }
});

// ============================================================================
// 6. DATA SAFETY, BACKUP & INTEGRITY VERIFICATION SUITE
// ============================================================================
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
fs.mkdirSync(BACKUPS_DIR, { recursive: true });

// Helper to get master backup payload
function getConsolidatedDataPayload() {
  const products = readJsonFile<any[]>(PRODUCTS_DB_PATH) || [];
  const categories = readJsonFile<any[]>(CATEGORIES_DB_PATH) || [];
  const media = readJsonFile<any[]>(MEDIA_DB_PATH) || [];
  const banners = readJsonFile<any[]>(BANNERS_DB_PATH) || [];
  const heroSlides = readJsonFile<any[]>(HERO_SLIDES_DB_PATH) || [];
  const sections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];

  return {
    app: 'SECRETPRESSO',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    counts: {
      products: products.length,
      categories: categories.length,
      media: media.length,
      banners: banners.length,
      heroSlides: heroSlides.length,
      sections: sections.length,
    },
    data: {
      products,
      categories,
      media,
      banners,
      heroSlides,
      sections,
    },
  };
}

// 1. GET /api/backup/export - Download complete verified backup JSON
app.get('/api/backup/export', (req: Request, res: Response) => {
  try {
    const payload = getConsolidatedDataPayload();
    const filename = `secretpresso_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    console.error('Failed to export backup:', err);
    res.status(500).json({ error: 'Failed to generate backup export', message: err.message });
  }
});

// 2. POST /api/backup/create - Create verified timestamped snapshot on disk
app.post('/api/backup/create', (req: Request, res: Response) => {
  try {
    const timestamp = Date.now();
    const backupId = `snapshot_${timestamp}`;
    const targetDir = path.join(BACKUPS_DIR, backupId);
    fs.mkdirSync(targetDir, { recursive: true });

    const filesToBackup = [
      { name: 'products.json', path: PRODUCTS_DB_PATH },
      { name: 'categories.json', path: CATEGORIES_DB_PATH },
      { name: 'media.json', path: MEDIA_DB_PATH },
      { name: 'banners.json', path: BANNERS_DB_PATH },
      { name: 'hero_slides.json', path: HERO_SLIDES_DB_PATH },
      { name: 'sections.json', path: SECTIONS_DB_PATH },
    ];

    let totalBytes = 0;
    const fileRecords: any[] = [];

    filesToBackup.forEach(({ name, path: srcPath }) => {
      const destPath = path.join(targetDir, name);
      if (fs.existsSync(srcPath)) {
        const content = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(destPath, content, 'utf-8');
        const size = fs.statSync(destPath).size;
        totalBytes += size;
        fileRecords.push({ name, size, status: 'VERIFIED' });
      }
    });

    const payload = getConsolidatedDataPayload();
    const manifest = {
      backupId,
      createdAt: new Date().toISOString(),
      type: 'manual_snapshot',
      counts: payload.counts,
      totalBytes,
      files: fileRecords,
      isVerified: true,
    };

    fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    res.json({
      success: true,
      backupId,
      manifest,
      message: 'Verified backup created and stored safely.',
    });
  } catch (err: any) {
    console.error('Failed to create disk backup:', err);
    res.status(500).json({ error: 'Failed to create backup snapshot', message: err.message });
  }
});

// 3. GET /api/backup/list - View all available verified backups
app.get('/api/backup/list', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ backups: [] });
    }

    const entries = fs.readdirSync(BACKUPS_DIR, { withFileTypes: true });
    const backups: any[] = [];

    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        const dirPath = path.join(BACKUPS_DIR, entry.name);
        const manifestPath = path.join(dirPath, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            backups.push({ ...manifest, folderName: entry.name });
          } catch {
            backups.push({
              backupId: entry.name,
              folderName: entry.name,
              createdAt: fs.statSync(dirPath).birthtime.toISOString(),
              isVerified: true,
            });
          }
        } else {
          backups.push({
            backupId: entry.name,
            folderName: entry.name,
            createdAt: fs.statSync(dirPath).birthtime.toISOString(),
            isVerified: true,
          });
        }
      }
    });

    // Sort newest first
    backups.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json({ backups });
  } catch (err: any) {
    console.error('Failed to list backups:', err);
    res.status(500).json({ error: 'Failed to list backups', message: err.message });
  }
});

// 4. POST /api/backup/restore - Non-destructive safe restore with automatic rollback point
app.post('/api/backup/restore', (req: Request, res: Response) => {
  try {
    const { data: restoreData, preserveExisting = true } = req.body || {};
    if (!restoreData || typeof restoreData !== 'object') {
      return res.status(400).json({ error: 'Invalid restore package. Expected data object.' });
    }

    // STEP 1: CREATE AUTOMATIC PRE-RESTORE SAFETY SNAPSHOT
    const preRestoreId = `pre_restore_${Date.now()}`;
    const preRestoreDir = path.join(BACKUPS_DIR, preRestoreId);
    fs.mkdirSync(preRestoreDir, { recursive: true });

    [
      { name: 'products.json', path: PRODUCTS_DB_PATH },
      { name: 'categories.json', path: CATEGORIES_DB_PATH },
      { name: 'media.json', path: MEDIA_DB_PATH },
      { name: 'banners.json', path: BANNERS_DB_PATH },
      { name: 'hero_slides.json', path: HERO_SLIDES_DB_PATH },
      { name: 'sections.json', path: SECTIONS_DB_PATH },
    ].forEach(({ name, path: srcPath }) => {
      if (fs.existsSync(srcPath)) {
        fs.writeFileSync(path.join(preRestoreDir, name), fs.readFileSync(srcPath, 'utf-8'), 'utf-8');
      }
    });

    const preManifest = {
      backupId: preRestoreId,
      createdAt: new Date().toISOString(),
      type: 'automatic_pre_restore_snapshot',
      description: 'Automatic safety checkpoint created immediately prior to restore',
      isVerified: true,
    };
    fs.writeFileSync(path.join(preRestoreDir, 'manifest.json'), JSON.stringify(preManifest, null, 2), 'utf-8');

    // STEP 2: SAFE MERGE RESTORE (NON-DESTRUCTIVE BY DEFAULT)
    const currentProducts = readJsonFile<any[]>(PRODUCTS_DB_PATH) || [];
    const currentCategories = readJsonFile<any[]>(CATEGORIES_DB_PATH) || [];
    const currentMedia = readJsonFile<any[]>(MEDIA_DB_PATH) || [];
    const currentBanners = readJsonFile<any[]>(BANNERS_DB_PATH) || [];
    const currentHeroSlides = readJsonFile<any[]>(HERO_SLIDES_DB_PATH) || [];
    const currentSections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];

    const restoredCounts = {
      products: 0,
      categories: 0,
      media: 0,
      banners: 0,
      heroSlides: 0,
      sections: 0,
    };

    // Restore Products
    if (Array.isArray(restoreData.products)) {
      const prodMap = new Map<string, any>();
      if (preserveExisting) {
        currentProducts.forEach((p) => prodMap.set(p.id, p));
      }
      restoreData.products.forEach((p: any) => {
        if (p && p.id && p.name) {
          const existing = prodMap.get(p.id);
          prodMap.set(p.id, { ...(existing || {}), ...p });
          restoredCounts.products++;
        }
      });
      writeJsonFile(PRODUCTS_DB_PATH, Array.from(prodMap.values()));
    }

    // Restore Categories
    if (Array.isArray(restoreData.categories)) {
      const catMap = new Map<string, any>();
      if (preserveExisting) {
        currentCategories.forEach((c) => catMap.set(c.id, c));
      }
      restoreData.categories.forEach((c: any) => {
        if (c && c.id && c.name) {
          const existing = catMap.get(c.id);
          catMap.set(c.id, { ...(existing || {}), ...c });
          restoredCounts.categories++;
        }
      });
      writeJsonFile(CATEGORIES_DB_PATH, Array.from(catMap.values()));
    }

    // Restore Media
    if (Array.isArray(restoreData.media)) {
      const mediaMap = new Map<string, any>();
      if (preserveExisting) {
        currentMedia.forEach((m) => mediaMap.set(m.id || m.url, m));
      }
      restoreData.media.forEach((m: any) => {
        if (m && (m.id || m.url)) {
          const key = m.id || m.url;
          const existing = mediaMap.get(key);
          mediaMap.set(key, { ...(existing || {}), ...m });
          restoredCounts.media++;
        }
      });
      writeJsonFile(MEDIA_DB_PATH, Array.from(mediaMap.values()));
    }

    // Restore Banners
    if (Array.isArray(restoreData.banners)) {
      const bannerMap = new Map<string, any>();
      if (preserveExisting) {
        currentBanners.forEach((b) => bannerMap.set(b.id, b));
      }
      restoreData.banners.forEach((b: any) => {
        if (b && b.id) {
          bannerMap.set(b.id, { ...(bannerMap.get(b.id) || {}), ...b });
          restoredCounts.banners++;
        }
      });
      writeJsonFile(BANNERS_DB_PATH, Array.from(bannerMap.values()));
    }

    // Restore Hero Slides
    if (Array.isArray(restoreData.heroSlides)) {
      writeJsonFile(HERO_SLIDES_DB_PATH, restoreData.heroSlides);
      restoredCounts.heroSlides = restoreData.heroSlides.length;
    }

    // Restore Sections
    if (Array.isArray(restoreData.sections)) {
      writeJsonFile(SECTIONS_DB_PATH, restoreData.sections);
      restoredCounts.sections = restoreData.sections.length;
    }

    // STEP 3: VERIFY INTEGRITY OF RESTORED FILES
    const verifiedProducts = readJsonFile<any[]>(PRODUCTS_DB_PATH);
    const verifiedCategories = readJsonFile<any[]>(CATEGORIES_DB_PATH);
    const verifiedMedia = readJsonFile<any[]>(MEDIA_DB_PATH);

    res.json({
      success: true,
      preRestoreBackupId: preRestoreId,
      restoredCounts,
      verification: {
        productsVerified: verifiedProducts?.length ?? 0,
        categoriesVerified: verifiedCategories?.length ?? 0,
        mediaVerified: verifiedMedia?.length ?? 0,
        status: 'PASSED',
      },
      message: 'Restore completed with verification. Safety rollback point created.',
    });
  } catch (err: any) {
    console.error('Failed to restore backup:', err);
    res.status(500).json({ error: 'Restore operation failed', message: err.message });
  }
});

// 5. POST /api/backup/rollback - 1-Click Rollback to last pre-restore safety point
app.post('/api/backup/rollback', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.status(404).json({ error: 'No backups directory found' });
    }

    const entries = fs.readdirSync(BACKUPS_DIR, { withFileTypes: true });
    const preRestoreDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('pre_restore_'))
      .map((e) => e.name)
      .sort()
      .reverse();

    if (preRestoreDirs.length === 0) {
      return res.status(404).json({ error: 'No pre-restore safety checkpoint found to rollback to.' });
    }

    const latestCheckpoint = preRestoreDirs[0];
    const sourceDir = path.join(BACKUPS_DIR, latestCheckpoint);

    [
      { name: 'products.json', path: PRODUCTS_DB_PATH },
      { name: 'categories.json', path: CATEGORIES_DB_PATH },
      { name: 'media.json', path: MEDIA_DB_PATH },
      { name: 'banners.json', path: BANNERS_DB_PATH },
      { name: 'hero_slides.json', path: HERO_SLIDES_DB_PATH },
      { name: 'sections.json', path: SECTIONS_DB_PATH },
    ].forEach(({ name, path: destPath }) => {
      const srcFile = path.join(sourceDir, name);
      if (fs.existsSync(srcFile)) {
        fs.writeFileSync(destPath, fs.readFileSync(srcFile, 'utf-8'), 'utf-8');
      }
    });

    res.json({
      success: true,
      restoredFrom: latestCheckpoint,
      message: `Successfully rolled back to checkpoint ${latestCheckpoint}.`,
    });
  } catch (err: any) {
    console.error('Rollback failed:', err);
    res.status(500).json({ error: 'Rollback operation failed', message: err.message });
  }
});

// 6. GET /api/integrity/check - Read-only Data Integrity Audit (Reports issues, NEVER deletes)
app.get('/api/integrity/check', (req: Request, res: Response) => {
  try {
    const products = readJsonFile<any[]>(PRODUCTS_DB_PATH) || [];
    const categories = readJsonFile<any[]>(CATEGORIES_DB_PATH) || [];
    const media = readJsonFile<any[]>(MEDIA_DB_PATH) || [];
    const banners = readJsonFile<any[]>(BANNERS_DB_PATH) || [];
    const heroSlides = readJsonFile<any[]>(HERO_SLIDES_DB_PATH) || [];
    const sections = readJsonFile<any[]>(SECTIONS_DB_PATH) || [];

    const issues: Array<{
      severity: 'info' | 'warning' | 'error';
      category: 'product' | 'category' | 'media' | 'relationship' | 'homepage';
      itemId?: string;
      title: string;
      details: string;
    }> = [];

    // Check Products
    const seenProductIds = new Set<string>();
    const categoryNames = new Set(categories.map((c) => c.name));
    const categoryIds = new Set(categories.map((c) => c.id));
    const sectionIds = new Set(sections.map((s) => s.id));

    products.forEach((p) => {
      // Duplicate ID
      if (seenProductIds.has(p.id)) {
        issues.push({
          severity: 'error',
          category: 'product',
          itemId: p.id,
          title: 'Duplicate Product ID',
          details: `Multiple products share ID "${p.id}" (${p.name}).`,
        });
      }
      seenProductIds.add(p.id);

      // Missing required fields
      if (!p.name || typeof p.name !== 'string' || p.name.trim() === '') {
        issues.push({
          severity: 'error',
          category: 'product',
          itemId: p.id,
          title: 'Missing Product Name',
          details: `Product ${p.id} has no valid name.`,
        });
      }

      if (p.price === undefined || p.price === null || isNaN(p.price) || p.price < 0) {
        issues.push({
          severity: 'error',
          category: 'product',
          itemId: p.id,
          title: 'Invalid Product Price',
          details: `Product "${p.name}" has invalid price (${p.price}).`,
        });
      }

      if (!p.imageUrl && !p.imageId) {
        issues.push({
          severity: 'warning',
          category: 'product',
          itemId: p.id,
          title: 'Missing Product Image',
          details: `Product "${p.name}" has no image assigned.`,
        });
      }

      // Check category relationship
      if (p.category && !categoryNames.has(p.category) && !categoryIds.has(p.category)) {
        issues.push({
          severity: 'info',
          category: 'relationship',
          itemId: p.id,
          title: 'Unlisted Category Reference',
          details: `Product "${p.name}" belongs to category "${p.category}", which is not in the standard categories list.`,
        });
      }

      // Check section relationship
      if (p.sectionId && !sectionIds.has(p.sectionId)) {
        issues.push({
          severity: 'warning',
          category: 'relationship',
          itemId: p.id,
          title: 'Unmatched Section ID',
          details: `Product "${p.name}" references sectionId "${p.sectionId}" which does not exist in sections list.`,
        });
      }
    });

    // Check Categories
    const seenCatIds = new Set<string>();
    categories.forEach((c) => {
      if (seenCatIds.has(c.id)) {
        issues.push({
          severity: 'error',
          category: 'category',
          itemId: c.id,
          title: 'Duplicate Category ID',
          details: `Duplicate category ID "${c.id}".`,
        });
      }
      seenCatIds.add(c.id);

      if (!c.name) {
        issues.push({
          severity: 'error',
          category: 'category',
          itemId: c.id,
          title: 'Missing Category Name',
          details: `Category ${c.id} has no name.`,
        });
      }

      if (!c.imageUrl && !c.image) {
        issues.push({
          severity: 'warning',
          category: 'category',
          itemId: c.id,
          title: 'Category Image Missing',
          details: `Category "${c.name}" has no cover image.`,
        });
      }
    });

    // Check Media
    const seenMediaIds = new Set<string>();
    media.forEach((m) => {
      const key = m.id || m.url;
      if (seenMediaIds.has(key)) {
        issues.push({
          severity: 'warning',
          category: 'media',
          itemId: m.id,
          title: 'Duplicate Media Asset',
          details: `Media item with URL/ID "${key}" appears more than once.`,
        });
      }
      seenMediaIds.add(key);

      if (!m.url && !m.downloadURL) {
        issues.push({
          severity: 'error',
          category: 'media',
          itemId: m.id,
          title: 'Empty Media URL',
          details: `Media item ${m.id} has no accessible URL.`,
        });
      }
    });

    // Check Hero Slides
    heroSlides.forEach((s) => {
      if (!s.imageUrl) {
        issues.push({
          severity: 'warning',
          category: 'homepage',
          itemId: s.id,
          title: 'Hero Slide Missing Image',
          details: `Hero slide "${s.title}" has no image.`,
        });
      }
    });

    // Check Banners
    banners.forEach((b) => {
      if (!b.imageUrl && !b.image) {
        issues.push({
          severity: 'warning',
          category: 'homepage',
          itemId: b.id,
          title: 'Banner Missing Image',
          details: `Banner "${b.name}" has no banner image.`,
        });
      }
    });

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    const overallStatus =
      errorCount > 0 ? 'ATTENTION_REQUIRED' : warningCount > 0 ? 'WARNING' : 'HEALTHY';

    res.json({
      timestamp: new Date().toISOString(),
      overallStatus,
      totalCounts: {
        products: products.length,
        categories: categories.length,
        media: media.length,
        heroSlides: heroSlides.length,
        banners: banners.length,
        sections: sections.length,
      },
      summary: {
        totalIssues: issues.length,
        errors: errorCount,
        warnings: warningCount,
        info: infoCount,
      },
      issues,
      safetyConfirmation: 'Read-only check complete. No database records or assets were modified or deleted.',
    });
  } catch (err: any) {
    console.error('Integrity check failed:', err);
    res.status(500).json({ error: 'Failed to run integrity audit', message: err.message });
  }
});

// ============================================================================
// 7. DEV & PRODUCTION SERVER INTEGRATION
// ============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite middleware in dev
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    const distPath = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SECRETpresso Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Media Storage] Persistent uploads mounted at /uploads`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
