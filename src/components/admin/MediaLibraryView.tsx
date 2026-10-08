import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { MediaItem, MediaType } from '../../types';
import {
  Search,
  Upload,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  HardDrive,
  Filter,
  Eye,
  X,
  AlertTriangle,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

export const MediaLibraryView: React.FC = () => {
  const {
    mediaItems,
    uploadMedia,
    replaceMedia,
    deleteMedia,
    products,
    heroSlides,
    sections,
    showToast,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  // Delete Confirmation Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<MediaType>('general');
  const [uploadTargetId, setUploadTargetId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Replace State
  const [replacingMediaId, setReplacingMediaId] = useState<string | null>(null);
  const [replaceProgress, setReplaceProgress] = useState(0);

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', label: 'All Media' },
    { id: 'hero', label: 'Hero' },
    { id: 'banners', label: 'Banners' },
    { id: 'products', label: 'Products' },
    { id: 'collections', label: 'Collections' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'videos', label: 'Videos' },
  ];

  // Map where media is used
  const getUsageInfo = (item: MediaItem) => {
    const itemUrl = item.url || item.downloadURL || '';
    if (!itemUrl) return 'Unassigned';

    // Check products
    const matchedProduct = products.find(
      (p) =>
        p.id === item.productId ||
        p.imageUrl === itemUrl ||
        (p.additionalImages && p.additionalImages.includes(itemUrl))
    );
    if (matchedProduct) {
      const isPrimary = matchedProduct.imageUrl === itemUrl || item.isPrimary;
      return `Product: ${matchedProduct.name} (${isPrimary ? 'Main Image' : 'Gallery'})`;
    }

    // Check hero slides
    const matchedHero = heroSlides.find(
      (s) => s.id === item.bannerId || s.imageUrl === itemUrl || s.mobileImageUrl === itemUrl
    );
    if (matchedHero) {
      return `Hero Carousel: Slide #${matchedHero.displayOrder} ("${matchedHero.title}")`;
    }

    // Check sections
    const matchedSection = sections.find(
      (sec) => sec.id === item.bannerId || sec.imageUrl === itemUrl
    );
    if (matchedSection) {
      return `Section: ${matchedSection.name}`;
    }

    return item.targetId ? `Assigned to: ${item.targetId}` : 'Media Vault / General';
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast({ type: 'info', title: 'URL Copied', message: 'Asset link copied to clipboard.' });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Filtered media items
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      // Category filter
      const type = (item.mediaType || 'general').toLowerCase();
      let matchCat = true;
      if (selectedCategory !== 'ALL') {
        const catLower = selectedCategory.toLowerCase();
        if (catLower === 'banners') {
          matchCat = type === 'banners' || type === 'banner';
        } else if (catLower === 'products') {
          matchCat = type === 'products' || type === 'product';
        } else if (catLower === 'collections') {
          matchCat = type === 'collections' || type === 'collection';
        } else if (catLower === 'promotions') {
          matchCat = type === 'promotions' || type === 'promotional';
        } else if (catLower === 'videos') {
          matchCat = type === 'videos' || type === 'video' || item.mimeType?.includes('video');
        } else {
          matchCat = type === catLower;
        }
      }

      // Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.fileName.toLowerCase().includes(query) ||
        (item.originalName && item.originalName.toLowerCase().includes(query)) ||
        (item.altText && item.altText.toLowerCase().includes(query)) ||
        getUsageInfo(item).toLowerCase().includes(query);

      return matchCat && matchSearch;
    });
  }, [mediaItems, selectedCategory, searchQuery, products, heroSlides, sections]);

  // Total Storage Size
  const totalSizeBytes = useMemo(() => {
    return mediaItems.reduce((acc, curr) => acc + (curr.size || 0), 0);
  }, [mediaItems]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      await uploadMedia(
        file,
        uploadCategory,
        uploadTargetId || undefined,
        false,
        file.name,
        (progress) => setUploadProgress(progress)
      );

      setShowUploadModal(false);
      setUploadTargetId('');
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'File could not be saved to server.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  // Replace handler
  const handleReplaceSubmit = async (
    e: React.ChangeEvent<HTMLInputElement>,
    oldMedia: MediaItem
  ) => {
    const newFile = e.target.files?.[0];
    if (!newFile) return;

    setReplacingMediaId(oldMedia.id);
    setReplaceProgress(15);

    try {
      await replaceMedia(oldMedia.id, newFile, (prog) => setReplaceProgress(prog));
    } catch (err: any) {
      console.error('Replace failed:', err);
      showToast({
        type: 'error',
        title: 'Replacement Failed',
        message: err.message || 'Server kept old image safely.',
      });
    } finally {
      setReplacingMediaId(null);
      setReplaceProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  // Delete confirmed
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;

    setIsDeleting(true);
    try {
      await deleteMedia(deleteCandidate.id || deleteCandidate.url || deleteCandidate.filePath);
      setDeleteCandidate(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete server file.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-[#fae8be]">Media & Asset Library</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>SERVER PERSISTENT STORAGE</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physical persistent disk storage mounted at <code className="text-[#cfa851] font-mono">/uploads</code> with metadata in <code className="text-[#cfa851] font-mono">/data/media.json</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <span className="text-[10px] font-mono text-zinc-500 block">TOTAL STORAGE</span>
            <span className="text-xs font-mono font-bold text-[#cfa851]">
              {formatFileSize(totalSizeBytes)} • {mediaItems.length} Files
            </span>
          </div>

          <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110 flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload New File</span>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleUploadSubmit}
            />
          </label>
        </div>
      </div>

      {/* Control Bar: Categories & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#140c08] rounded-2xl border border-[#2b1910]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename, original name, or where used..."
            className="w-full pl-10 pr-4 py-2 bg-[#1b110b] border border-[#342015] rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#cfa851]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#cfa851] text-zinc-950 font-bold'
                  : 'bg-[#1b110b] text-zinc-400 hover:text-zinc-200 border border-[#342015]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Uploading Status Overlay Bar */}
      {isUploading && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#cfa851]" />
            <span>Uploading file to persistent server storage... ({uploadProgress}%)</span>
          </div>
          <div className="w-40 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#cfa851] h-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#140c08] border border-dashed border-[#342015] text-zinc-500 space-y-3">
          <ImageIcon className="w-10 h-10 mx-auto text-zinc-600" />
          <h4 className="text-sm font-semibold text-zinc-300">No media assets found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No files match "${searchQuery}". Try clearing the search filter.`
              : 'Upload images or videos directly to store them permanently on the server.'}
          </p>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22150e] hover:bg-[#2c1b12] border border-[#3d2518] text-xs text-[#fae8be] font-semibold cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-[#cfa851]" />
            <span>Choose File to Upload</span>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleUploadSubmit}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => {
            const itemUrl = item.url || item.downloadURL || null;
            const usage = getUsageInfo(item);
            const isVideo = item.mimeType?.includes('video') || item.mediaType === 'videos';
            const isItemReplacing = replacingMediaId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#140c08] border border-[#2e1c12] hover:border-[#cfa851]/40 transition overflow-hidden shadow-xl flex flex-col justify-between group"
              >
                {/* Media Preview & Actions Bar */}
                <div className="relative aspect-video w-full bg-[#1b100a] overflow-hidden">
                  {isVideo && itemUrl ? (
                    <video
                      src={itemUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : itemUrl ? (
                    <SafeImage
                      src={itemUrl}
                      imageId={itemUrl.startsWith('img_') ? itemUrl : undefined}
                      alt={item.altText || item.fileName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

                  {/* Category Pill Top Left */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/70 text-[#cfa851] border border-[#cfa851]/30 uppercase">
                    {item.mediaType}
                  </span>

                  {/* Size Pill Top Right */}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/70 text-zinc-300 border border-zinc-700">
                    {formatFileSize(item.size)}
                  </span>

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => setPreviewMedia(item)}
                      title="Inspect Full Size"
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCopyUrl(itemUrl || '')}
                      title="Copy Server URL"
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition"
                    >
                      {copiedUrl === itemUrl ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <label
                      title="Replace Image Safely"
                      className="p-2 rounded-xl bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => handleReplaceSubmit(e, item)}
                      />
                    </label>

                    <button
                      onClick={() => setDeleteCandidate(item)}
                      title="Delete Permanently from Disk"
                      className="p-2 rounded-xl bg-red-950 border border-red-500/40 text-red-300 hover:bg-red-900 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Replacing Loader */}
                  {isItemReplacing && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#cfa851] mb-1.5" />
                      <span className="text-xs font-mono text-zinc-200">
                        Replacing on server... {replaceProgress}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Card Content */}
                <div className="p-3.5 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 truncate" title={item.fileName}>
                      {item.originalName || item.fileName}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                      {item.filePath}
                    </p>
                  </div>

                  {/* Where Used Badge */}
                  <div className="p-2 rounded-xl bg-[#1b110b] border border-[#2b1910] text-[11px]">
                    <span className="text-zinc-500 block text-[9px] font-mono uppercase tracking-wider">
                      WHERE USED
                    </span>
                    <span className="text-[#fae8be] font-medium line-clamp-1">{usage}</span>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#24160e]">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-semibold text-[#cfa851] hover:underline cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept="image/*,video/mp4,video/webm"
                          className="hidden"
                          onChange={(e) => handleReplaceSubmit(e, item)}
                        />
                      </label>
                      <span className="text-zinc-700">•</span>
                      <button
                        onClick={() => setDeleteCandidate(item)}
                        className="text-[11px] font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CONFIRM DELETE PERMANENTLY MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-red-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Delete this image permanently?
            </h3>

            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-mono text-red-300 font-bold">
                "{deleteCandidate.originalName || deleteCandidate.fileName}"
              </span>{' '}
              from the server disk?
            </p>

            <div className="mt-3 p-3 rounded-xl bg-[#1a0f0a] border border-[#331c12] text-xs text-zinc-400 space-y-1">
              <div>
                <span className="text-zinc-500 font-mono text-[10px]">FILE PATH: </span>
                <span className="font-mono text-zinc-300">{deleteCandidate.filePath}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-mono text-[10px]">CURRENT USAGE: </span>
                <span className="text-amber-300">{getUsageInfo(deleteCandidate)}</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 mt-2">
              This will remove the file from physical server storage, erase the database record, and update the customer website.
            </p>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Full Size Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#140c08] border border-[#382319] w-full max-w-3xl rounded-2xl shadow-2xl p-5 text-zinc-100 relative">
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-zinc-200 truncate pr-8">
              {previewMedia.originalName || previewMedia.fileName}
            </h3>

            <div className="mt-4 rounded-xl overflow-hidden bg-black max-h-[60vh] flex items-center justify-center border border-[#2b1910]">
              {previewMedia.mimeType?.includes('video') && (previewMedia.url || previewMedia.downloadURL) ? (
                <video
                  src={previewMedia.url || previewMedia.downloadURL}
                  controls
                  className="max-h-[60vh] w-auto mx-auto"
                />
              ) : (previewMedia.url || previewMedia.downloadURL) ? (
                <SafeImage
                  src={previewMedia.url || previewMedia.downloadURL}
                  imageId={(previewMedia.url || previewMedia.downloadURL || '').startsWith('img_') ? (previewMedia.url || previewMedia.downloadURL) : undefined}
                  alt={previewMedia.fileName}
                  className="max-h-[60vh] w-auto object-contain mx-auto"
                />
              ) : null}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-mono text-zinc-400 block text-[11px]">
                  {previewMedia.filePath} ({formatFileSize(previewMedia.size)})
                </span>
                <span className="text-[#cfa851] text-[11px]">{getUsageInfo(previewMedia)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(previewMedia.url || previewMedia.downloadURL || '')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </button>
                <a
                  href={previewMedia.url || previewMedia.downloadURL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#cfa851] text-zinc-950 font-bold text-xs flex items-center gap-1.5 hover:bg-[#dbb660] transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
