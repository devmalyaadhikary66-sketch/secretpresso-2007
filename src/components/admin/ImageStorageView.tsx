import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  Trash2,
  Eye,
  Copy,
  Check,
  RefreshCw,
  Info,
  ShieldCheck,
  Search,
  Filter,
  FileArchive,
  AlertTriangle,
  FolderTree,
  Sparkles,
  Layers,
  ShoppingBag,
  Tag,
  Layout,
  ExternalLink,
} from 'lucide-react';
import {
  imageStorageService,
  StoredImageRecord,
  StorageStats,
  IMAGE_STORAGE_MODE,
} from '../../services/imageStorageService';
import { SafeImage } from '../common/SafeImage';

export const ImageStorageView: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [images, setImages] = useState<StoredImageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(true);

  // Modals
  const [previewRecord, setPreviewRecord] = useState<StoredImageRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<StoredImageRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // File upload refs
  const importInputRef = useRef<HTMLInputElement>(null);
  const standaloneUploadRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [currStats, currList] = await Promise.all([
        imageStorageService.getStorageStats(),
        imageStorageService.listImages(),
      ]);
      setStats(currStats);
      setImages(currList);
    } catch (err) {
      console.error('[ImageStorageView] Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = imageStorageService.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // 17. EXPORT ALL IMAGES TO ZIP
  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      const zipBlob = await imageStorageService.exportImagesZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secretpresso_images_backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 18. IMPORT / RESTORE BACKUP ZIP
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportResult(null);
      const res = await imageStorageService.importImagesZip(file, false);
      setImportResult(res);
      await loadData();
    } catch (err: any) {
      alert(`Import failed: ${err?.message || err}`);
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  // Manual Upload Modal handler
  const handleStandaloneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await imageStorageService.saveImage(file, {
          fileName: file.name,
          entityType: 'general',
        });
      } catch (err: any) {
        alert(`Failed to save ${file.name}: ${err?.message || err}`);
      }
    }
    await loadData();
    setShowUploadModal(false);
    if (standaloneUploadRef.current) standaloneUploadRef.current.value = '';
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteRecord) return;
    await imageStorageService.deleteImage(deleteRecord.id);
    setDeleteRecord(null);
    await loadData();
  };

  // Filter and search
  const filteredImages = images.filter((img) => {
    const matchesSearch =
      img.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.entityType && img.entityType.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'product') return img.entityType === 'product';
    if (selectedFilter === 'category') return img.entityType === 'category';
    if (selectedFilter === 'homepage') {
      return (
        img.entityType === 'hero' ||
        img.entityType === 'banner' ||
        img.entityType === 'section' ||
        img.entityType === 'surprise' ||
        img.entityType === 'story'
      );
    }
    return img.entityType === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Storage Mode Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#180e08] via-[#21140c] to-[#180e08] border border-[#3e271c] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#fae8be] flex items-center gap-2.5">
              <HardDrive className="w-6 h-6 text-[#cfa851]" />
              <span>Image Storage Manager</span>
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STORAGE MODE: LOCAL / TEMPORARY</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 mt-2 max-w-2xl leading-relaxed">
            Persistent browser-side image storage powered by dedicated IndexedDB (<span className="text-[#fae8be] font-mono">SECRETPRESSO_LocalStorage</span>). Images are preserved across refreshes, tab closures, and redeployments with zero auto-deletion.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#cfa851]/15 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={handleExportZip}
            disabled={isExporting || images.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#22150e] hover:bg-[#2e1d13] text-[#fae8be] border border-[#3e271c] font-semibold text-xs flex items-center gap-2 transition disabled:opacity-40 cursor-pointer"
            title="Download all stored images as organized ZIP"
          >
            <Download className={`w-4 h-4 text-[#cfa851] ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Packaging ZIP...' : 'Export All Images'}</span>
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            className="px-3.5 py-2.5 rounded-xl bg-[#1e130c] hover:bg-[#291a10] text-zinc-300 border border-[#362217] font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Restore image archive from backup ZIP"
          >
            <FileArchive className="w-4 h-4 text-[#cfa851]" />
            <span>{isImporting ? 'Restoring...' : 'Import Backup'}</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".zip"
            onChange={handleImportZip}
            className="hidden"
          />
        </div>
      </div>

      {/* 16. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-md">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Total Images</div>
          <div className="text-2xl font-serif font-black text-[#fae8be] mt-1">{stats?.totalImages ?? images.length}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">In IndexedDB store</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-md">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Total Storage Used</div>
          <div className="text-2xl font-serif font-black text-[#cfa851] mt-1">
            {stats?.totalMegabytes ?? 0} <span className="text-sm font-sans font-normal text-zinc-400">MB</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Raw blob size</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-md">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Products Using</div>
          <div className="text-2xl font-serif font-black text-amber-200 mt-1">{stats?.productsUsingImages ?? 0}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Catalog assignments</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-md">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Categories Using</div>
          <div className="text-2xl font-serif font-black text-amber-200 mt-1">{stats?.categoriesUsingImages ?? 0}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Category banners</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-md">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Homepage Images</div>
          <div className="text-2xl font-serif font-black text-amber-200 mt-1">{stats?.homepageImages ?? 0}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Hero & section banners</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-md">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Last Uploaded</div>
          <div className="text-xs font-mono font-bold text-zinc-300 mt-2 truncate">
            {stats?.lastUploaded ? new Date(stats.lastUploaded).toLocaleDateString() : 'None yet'}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {stats?.lastUploaded ? new Date(stats.lastUploaded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready'}
          </div>
        </div>
      </div>

      {/* Storage Information / Architecture Card */}
      {showInfoCard && (
        <div className="p-4 rounded-2xl bg-[#180f0a] border border-[#3d271a] relative">
          <button
            onClick={() => setShowInfoCard(false)}
            className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 p-1"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#26160e] text-[#cfa851] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs text-zinc-300 pr-6">
              <h4 className="font-bold text-[#fae8be]">Zero Auto-Deletion & Future Cloud Migration Guarantee</h4>
              <p className="text-zinc-400 leading-relaxed">
                Images are stored as raw Blobs inside IndexedDB and referenced by permanent ID (e.g. <span className="font-mono text-[#cfa851]">img_...</span>). When you later migrate to Firebase or Cloud Storage, the <span className="font-mono text-zinc-200">migrateImagesToPermanentStorage()</span> interface will upload each file and update references without losing your local records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Notification */}
      {importResult && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-4">
          <div>
            <span className="font-bold">Restore Complete:</span> Imported {importResult.importedCount} image(s), skipped {importResult.skippedCount} existing.
            {importResult.errors.length > 0 && (
              <span className="text-red-300 ml-2">({importResult.errors.length} errors encountered)</span>
            )}
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="px-3 py-1 rounded-lg bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800 text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#140c08] border border-[#2e1c12]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, file name, entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1a100b] border border-[#382319] rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#cfa851]"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Images' },
            { id: 'product', label: 'Products' },
            { id: 'category', label: 'Categories' },
            { id: 'homepage', label: 'Homepage / Banners' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-[#cfa851] text-zinc-950'
                  : 'bg-[#1e130c] text-zinc-400 hover:text-zinc-200 border border-[#332014]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={loadData}
            title="Refresh list"
            className="p-2 rounded-xl bg-[#1e130c] text-zinc-400 hover:text-zinc-200 border border-[#332014] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#cfa851]" />
          </button>
        </div>
      </div>

      {/* Image Gallery Grid */}
      {filteredImages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#140c08] border border-dashed border-[#382319]">
          <HardDrive className="w-12 h-12 text-[#cfa851]/40 mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#fae8be]">No Stored Images Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'No stored images match your search filter.'
              : 'Upload images from here or through the Product & Website Editors. All uploaded images are persistently saved in IndexedDB.'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload An Image</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => {
            const mb = (img.fileSize / (1024 * 1024)).toFixed(2);
            return (
              <div
                key={img.id}
                className="group p-3 rounded-2xl bg-[#140c08] border border-[#2e1c12] hover:border-[#cfa851]/50 transition flex flex-col justify-between shadow-lg"
              >
                <div>
                  {/* Image Frame */}
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#0a0503] border border-[#261710] flex items-center justify-center">
                    <SafeImage
                      imageId={img.id}
                      alt={img.fileName}
                      className="w-full h-full object-contain object-center"
                    />

                    {/* Format / Size badge */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[9px] font-mono font-bold text-[#fae8be] border border-white/10 uppercase">
                      {img.mimeType.split('/')[1] || 'IMAGE'} • {mb} MB
                    </span>

                    {/* Quick Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewRecord(img)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-black/95 text-zinc-300 hover:text-white backdrop-blur-xs border border-white/10 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Preview full image"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#cfa851]" />
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#22150e] text-[#cfa851] border border-[#3e271c] uppercase font-bold">
                        {img.entityType || 'GENERAL'}
                      </span>
                      {img.width && img.height && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {img.width}×{img.height}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-zinc-200 truncate mt-1" title={img.fileName}>
                      {img.fileName}
                    </h4>

                    {/* ID with Copy Button */}
                    <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-[#1a100b] border border-[#2b1910] text-[11px] font-mono text-zinc-400">
                      <span className="truncate text-[#fae8be]">{img.id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(img.id)}
                        className="p-1 hover:text-zinc-200 cursor-pointer shrink-0"
                        title="Copy permanent imageId"
                      >
                        {copiedId === img.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-3 pt-2 border-t border-[#22150e] flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteRecord(img)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/50 hover:text-red-300 transition cursor-pointer"
                    title="Delete image permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Upload Images Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#140c08] border border-[#3e271c] w-full max-w-lg rounded-3xl shadow-2xl p-6 text-zinc-100">
            <h3 className="text-base font-bold font-serif text-[#fae8be] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#cfa851]" />
              <span>Upload Images to Local Storage</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Select one or multiple images. Files are permanently persisted in IndexedDB and given permanent IDs.
            </p>

            <div
              onClick={() => standaloneUploadRef.current?.click()}
              className="mt-4 p-8 rounded-2xl border-2 border-dashed border-[#442a1d] hover:border-[#cfa851] bg-[#1a100a] flex flex-col items-center justify-center text-center cursor-pointer transition"
            >
              <Upload className="w-8 h-8 text-[#cfa851] mb-2" />
              <p className="text-xs font-semibold text-zinc-200">Click to select files</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">JPG, PNG, WEBP, AVIF up to 15MB each</p>
            </div>
            <input
              ref={standaloneUploadRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
              onChange={handleStandaloneUpload}
              className="hidden"
            />

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Preview Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#140c08] border border-[#3e271c] w-full max-w-3xl rounded-3xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setPreviewRecord(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              ×
            </button>
            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              {previewRecord.fileName}
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              ID: {previewRecord.id} • {(previewRecord.fileSize / (1024 * 1024)).toFixed(2)} MB • {previewRecord.mimeType}
            </p>

            <div className="mt-4 max-h-[65vh] rounded-2xl overflow-hidden bg-[#0a0503] border border-[#2a1910] flex items-center justify-center p-2">
              <SafeImage
                imageId={previewRecord.id}
                alt={previewRecord.fileName}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="mt-4 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => handleCopyId(previewRecord.id)}
                className="px-3 py-1.5 rounded-xl bg-[#22150e] hover:bg-[#2f1d13] border border-[#3e271c] text-[#fae8be] font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#cfa851]" />
                <span>Copy Image ID</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewRecord(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Delete Confirmation (Requirement 8) */}
      {deleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#140c08] border border-red-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100">
            <h3 className="text-base font-bold font-serif text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Are you sure you want to permanently delete this image?</span>
            </h3>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              File: <span className="font-bold text-[#fae8be]">{deleteRecord.fileName}</span>
            </p>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              ID: {deleteRecord.id}
            </p>

            <div className="mt-3 p-3 rounded-xl bg-[#1e130c] border border-[#331e13] text-xs text-[#fae8be]">
              The image blob will be erased from local IndexedDB storage.
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteRecord(null)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
