import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HardDrive,
  Database,
  Download,
  Upload,
  Info,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Calendar,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import {
  imageStorageService,
  formatBytes,
} from '../../services/imageStorageService';
import {
  StoredImageRecord,
  ImageStorageStats,
  ImageEntityType,
} from '../../types/imageStorage';
import { SafeImage } from '../common/SafeImage';

export const ImageStorageDashboard: React.FC = () => {
  const [stats, setStats] = useState<ImageStorageStats | null>(null);
  const [images, setImages] = useState<StoredImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<StoredImageRecord | null>(null);
  const [imageToDelete, setImageToDelete] = useState<StoredImageRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storageStats, allImages] = await Promise.all([
        imageStorageService.getStorageStats(),
        imageStorageService.listImages(),
      ]);
      setStats(storageStats);
      setImages(allImages);
    } catch (err) {
      console.error('Failed to load image storage data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const zipBlob = await imageStorageService.exportImagesZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `secretpresso-images-backup-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export images backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await imageStorageService.importImagesZip(file, false);
      setImportResult(result);
      await loadData();
    } catch (err: any) {
      console.error('Import failed:', err);
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: [err.message || 'Failed to import backup archive'],
      });
    } finally {
      setIsImporting(false);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;
    try {
      await imageStorageService.deleteImage(imageToDelete.id);
      setImageToDelete(null);
      if (selectedImage?.id === imageToDelete.id) {
        setSelectedImage(null);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleDownloadSingleImage = (img: StoredImageRecord) => {
    const url = URL.createObjectURL(img.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = img.fileName || `${img.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered images
  const filteredImages = images.filter((img) => {
    const matchesFilter = filterType === 'all' || img.entityType === filterType;
    const matchesSearch =
      img.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.entityId && img.entityId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Storage Mode Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#382319]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-serif text-[#fae8be]">Image Storage</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
              LOCAL / TEMPORARY (IndexedDB)
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              Never Auto-Deleted
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Dedicated client-side IndexedDB store (<code className="text-[#cfa851]">SECRETPRESSO_LocalStorage</code>).
            Images remain persistent across browser restarts and website updates.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-[#261710] hover:bg-[#341f15] text-zinc-300 text-xs font-semibold border border-[#3e271c] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#cfa851] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="px-3 py-2 rounded-xl bg-[#261710] hover:bg-[#341f15] text-zinc-300 text-xs font-semibold border border-[#3e271c] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Storage Information</span>
          </button>

          <button
            type="button"
            onClick={handleExportZip}
            disabled={isExporting || images.length === 0}
            className="px-3.5 py-2 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#cfa851]/15 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Images (ZIP)</span>
          </button>

          <button
            type="button"
            onClick={() => importFileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3 py-2 rounded-xl bg-[#261710] hover:bg-[#341f15] text-zinc-200 text-xs font-semibold border border-[#3e271c] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#cfa851]" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-[#cfa851]" />
            )}
            <span>Import Image Backup</span>
          </button>

          <input
            ref={importFileInputRef}
            type="file"
            accept=".zip"
            onChange={handleImportFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Import Result Notification */}
      {importResult && (
        <div className="p-3 rounded-xl bg-[#1b120c] border border-[#3e271c] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#fae8be] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Backup Import Results:
            </span>
            <button
              onClick={() => setImportResult(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-zinc-300">
            Imported: <span className="text-emerald-400 font-bold">{importResult.imported}</span> images |
            Skipped (already exists): <span className="text-amber-400 font-bold">{importResult.skipped}</span>
          </p>
          {importResult.errors.length > 0 && (
            <p className="text-red-400 text-[11px]">
              Errors: {importResult.errors.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Storage Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#180f0b] border border-[#382319] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Storage Mode</span>
            <HardDrive className="w-4 h-4 text-[#cfa851]" />
          </div>
          <div className="mt-2">
            <p className="text-sm font-bold text-amber-400 font-mono">LOCAL</p>
            <p className="text-[10px] text-zinc-400">IndexedDB Persisted</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#180f0b] border border-[#382319] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Images</span>
            <ImageIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold font-mono text-zinc-100">
              {stats?.totalImages ?? 0}
            </p>
            <p className="text-[10px] text-zinc-400">Active records</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#180f0b] border border-[#382319] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Storage Used</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold font-mono text-zinc-100">
              {stats?.formattedTotalSize || '0 Bytes'}
            </p>
            <p className="text-[10px] text-zinc-400">Inside IndexedDB</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#180f0b] border border-[#382319] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Products</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold font-mono text-zinc-100">
              {stats?.productsCount ?? 0}
            </p>
            <p className="text-[10px] text-zinc-400">Menu & Gallery</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#180f0b] border border-[#382319] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Categories</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold font-mono text-zinc-100">
              {stats?.categoriesCount ?? 0}
            </p>
            <p className="text-[10px] text-zinc-400">Category icons/cards</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#180f0b] border border-[#382319] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Homepage/Banners</span>
            <Sparkles className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold font-mono text-zinc-100">
              {stats?.homepageCount ?? 0}
            </p>
            <p className="text-[10px] text-zinc-400">Hero & Promos</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#180f0b] p-3 rounded-2xl border border-[#382319]">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#120b08] border border-[#382319] rounded-xl text-xs text-zinc-100 focus:border-[#cfa851] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Images' },
            { id: 'product', label: 'Products' },
            { id: 'category', label: 'Categories' },
            { id: 'hero', label: 'Hero Slides' },
            { id: 'banner', label: 'Banners' },
            { id: 'section', label: 'Sections' },
            { id: 'other', label: 'Other' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterType === item.id
                  ? 'bg-[#cfa851] text-zinc-950 font-bold'
                  : 'bg-[#261710] text-zinc-300 hover:bg-[#341f15]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Images Grid */}
      {filteredImages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#180f0b]/50 border border-dashed border-[#382319] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#261710] border border-[#3e271c] flex items-center justify-center text-[#cfa851] mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-200">No images found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search query or entity filter.'
                : 'Upload images from the Products, Categories, or Website Sections editors.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className="group relative rounded-xl bg-[#180f0b] border border-[#382319] hover:border-[#cfa851]/60 transition overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square w-full bg-[#120b08] overflow-hidden flex items-center justify-center">
                <SafeImage
                  imageId={img.id}
                  alt={img.fileName}
                  className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                />

                {/* Entity Badge */}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-black/75 text-zinc-200 backdrop-blur-xs border border-white/10">
                  {img.entityType}
                </span>

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSingleImage(img);
                    }}
                    title="Download file"
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageToDelete(img);
                    }}
                    title="Delete permanently"
                    className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white backdrop-blur-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details footer */}
              <div className="p-2.5 text-left space-y-1">
                <p className="text-xs font-semibold text-zinc-200 truncate" title={img.fileName}>
                  {img.fileName}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{formatBytes(img.fileSize)}</span>
                  {img.width && img.height && (
                    <span>
                      {img.width}×{img.height}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#261710]">
                  <span className="text-[9.5px] font-mono text-[#cfa851] truncate max-w-[90px]">
                    {img.id}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyId(img.id);
                    }}
                    title="Copy permanent ID"
                    className="text-zinc-400 hover:text-[#cfa851] p-0.5 cursor-pointer"
                  >
                    {copiedId === img.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Image Detail Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#160d09] border border-[#3e271c] w-full max-w-xl rounded-2xl p-6 shadow-2xl text-zinc-100 relative"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-bold font-serif text-[#fae8be]">
                Image Record Details
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#cfa851]/10 text-[#cfa851] border border-[#cfa851]/30">
                {selectedImage.id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preview */}
              <div className="relative aspect-square rounded-xl bg-[#120b08] border border-[#382319] overflow-hidden flex items-center justify-center">
                <SafeImage
                  imageId={selectedImage.id}
                  alt={selectedImage.fileName}
                  className="w-full h-full object-contain p-2"
                />
              </div>

              {/* Metadata */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">File Name</span>
                  <span className="text-zinc-200 break-all">{selectedImage.fileName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">MIME Type</span>
                    <span className="text-zinc-200 font-mono text-[11px]">{selectedImage.mimeType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Size</span>
                    <span className="text-zinc-200 font-mono text-[11px]">{formatBytes(selectedImage.fileSize)}</span>
                  </div>
                </div>

                {selectedImage.width && selectedImage.height && (
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Dimensions</span>
                    <span className="text-zinc-200 font-mono text-[11px]">
                      {selectedImage.width} px × {selectedImage.height} px
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Entity Type</span>
                    <span className="text-[#fae8be] font-bold uppercase">{selectedImage.entityType}</span>
                  </div>
                  {selectedImage.entityId && (
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Entity ID</span>
                      <span className="text-zinc-200 font-mono text-[11px]">{selectedImage.entityId}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Created At</span>
                  <span className="text-zinc-300 font-mono text-[11px]">
                    {new Date(selectedImage.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#2d1c14] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingleImage(selectedImage)}
                    className="flex-1 py-2 rounded-xl bg-[#261710] hover:bg-[#341f15] text-zinc-200 text-xs font-semibold border border-[#3e271c] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#cfa851]" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageToDelete(selectedImage);
                    }}
                    className="py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-semibold border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Delete Confirmation Modal (Requirement 8) */}
      {imageToDelete && (
        <div
          onClick={() => setImageToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#160d09] border border-[#3e271c] w-full max-w-sm rounded-2xl p-5 shadow-2xl text-zinc-100"
          >
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/30">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Permanently Delete Image?</h4>
                <p className="text-[10px] text-zinc-400 font-mono">{imageToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete this image?
              <br />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                This image file will be removed from your IndexedDB database. Products or sections
                referencing it will show a fallback.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setImageToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#261710] hover:bg-[#341f15] text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Information Modal */}
      {showInfoModal && (
        <div
          onClick={() => setShowInfoModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#160d09] border border-[#3e271c] w-full max-w-lg rounded-2xl p-6 shadow-2xl text-zinc-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#382319]">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#cfa851]" />
                <h3 className="text-base font-bold font-serif text-[#fae8be]">
                  IndexedDB Storage Architecture
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#1b120c] border border-[#382319]">
                <h4 className="font-bold text-[#fae8be] mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Zero Automatic Deletion Policy
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Images stored in <code className="text-[#cfa851]">SECRETPRESSO_LocalStorage</code> are never
                  cleared automatically. They survive browser refreshes, restarts, admin logins/logouts, and code updates.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1b120c] border border-[#382319]">
                <h4 className="font-bold text-[#fae8be] mb-1 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  Permanent Image IDs, Ephemeral URLs
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Products and sections only store the permanent identifier (e.g.{' '}
                  <code className="text-[#cfa851]">img_173456789</code>). Temporary object URLs are created only
                  for rendering and revoked when unmounted.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1b120c] border border-[#382319]">
                <h4 className="font-bold text-[#fae8be] mb-1 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-purple-400" />
                  Backup & Restore (ZIP)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Use "Export Images" at any time to download an organized ZIP archive with manifest.
                  You can restore images to any browser or device using "Import Image Backup".
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1b120c] border border-[#382319]">
                <h4 className="font-bold text-[#fae8be] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Future Permanent Storage Migration
                </h4>
                <p className="text-[11px] text-zinc-400">
                  The service includes migration hooks ready to connect to cloud storage when you decide.
                  Local copies are preserved until you explicitly delete them.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
