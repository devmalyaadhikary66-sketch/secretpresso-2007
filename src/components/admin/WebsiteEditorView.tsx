import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { WebsiteSectionConfig, HeroSlide, MediaItem, Category } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BannerPositioningStudio } from './BannerPositioningStudio';
import { ImageUploader } from './ImageUploader';
import { SafeImage } from '../common/SafeImage';
import {
  FileText,
  Save,
  CheckCircle2,
  Eye,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Edit2,
  Sliders,
  History,
  X,
  Upload,
  Trash2,
  Monitor,
  Smartphone,
  Film,
  RefreshCw,
  Copy,
  Check,
  HardDrive,
  CloudCheck,
  AlertCircle,
  ExternalLink,
  Plus,
  FolderPlus,
  Move,
  Layers,
  Sparkles,
} from 'lucide-react';

export const WebsiteEditorView: React.FC = () => {
  const {
    sections,
    heroSlides,
    draftSections,
    draftHeroSlides,
    hasDraftChanges,
    updateDraftSections,
    updateDraftHeroSlides,
    publishWebsiteChanges,
    discardWebsiteDraft,
    websiteRevisions,
    restoreWebsiteRevision,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    mediaItems,
    uploadMedia,
    replaceMedia,
    deleteMedia,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'sections' | 'categories' | 'banners' | 'hero' | 'media' | 'revisions'>('sections');
  const [editingSection, setEditingSection] = useState<WebsiteSectionConfig | null>(null);
  const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlide | null>(null);
  const [publishNote, setPublishNote] = useState('Updated homepage luxury highlights and banners');
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Section Management States
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<WebsiteSectionConfig | null>(null);
  const [newSectionForm, setNewSectionForm] = useState({
    name: '',
    heading: '',
    subheading: '',
    description: '',
    sectionType: 'products' as 'products' | 'banner',
    displayStyle: 'slider' as 'slider' | 'grid',
    imageUrl: '',
    imageId: '',
    isVisible: true,
    order: draftSections.length + 1,
    ctaText: 'View All →',
    ctaLink: '#',
  });

  // Category Management States
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    imageId: '',
    categoryType: 'Food',
    displayOrder: (categories?.length || 0) + 1,
    isVisible: true,
  });

  // Banner Management & Positioning Studio States
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [newBannerForm, setNewBannerForm] = useState({
    name: '',
    heading: '',
    subheading: '',
    description: '',
    imageUrl: '',
    ctaText: 'Discover More',
    ctaLink: '#',
    bannerType: 'promotional' as 'hero' | 'promotional' | 'section',
    isVisible: true,
    order: draftSections.length + 1,
  });
  const [bannerToPosition, setBannerToPosition] = useState<WebsiteSectionConfig | null>(null);

  // Image deletion confirmation modal state
  const [imageToDelete, setImageToDelete] = useState<{
    url: string;
    fileName?: string;
    slotType?: 'hero' | 'section';
    slotId?: string;
    field?: 'imageUrl' | 'mobileImageUrl';
    mediaId?: string;
  } | null>(null);

  // Media upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<{ [slotKey: string]: number }>({});
  const [isUploading, setIsUploading] = useState<{ [slotKey: string]: boolean }>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // File input refs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast({ type: 'info', title: 'URL Copied', message: 'Asset link copied to clipboard.' });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Move section up or down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draftSections.length) return;

    const newSections = [...draftSections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    newSections.forEach((s, idx) => (s.order = idx + 1));
    updateDraftSections(newSections);
    reorderSections(newSections);
  };

  const toggleSectionVisibility = (id: string) => {
    const updated = draftSections.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s));
    updateDraftSections(updated);
    updateSection(id, { isVisible: !draftSections.find((s) => s.id === id)?.isVisible });
  };

  const handleSectionFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    const updated = draftSections.map((s) => (s.id === editingSection.id ? editingSection : s));
    updateDraftSections(updated);
    updateSection(editingSection.id, editingSection);
    setEditingSection(null);
  };

  const handleCreateSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionForm.name.trim()) return;

    const maxOrder = draftSections.reduce((max, s) => Math.max(max, s.displayOrder ?? s.order ?? 0), 0);
    const assignedOrder = newSectionForm.order || maxOrder + 1;

    await addSection({
      name: newSectionForm.name.trim(),
      heading: newSectionForm.heading || newSectionForm.name.trim(),
      subtitle: newSectionForm.subheading,
      subheading: newSectionForm.subheading,
      description: newSectionForm.description,
      type: newSectionForm.sectionType,
      sectionType: newSectionForm.sectionType,
      displayStyle: newSectionForm.displayStyle,
      image: newSectionForm.imageUrl,
      imageUrl: newSectionForm.imageUrl,
      isVisible: newSectionForm.isVisible,
      displayOrder: assignedOrder,
      order: assignedOrder,
      ctaText: newSectionForm.ctaText,
      ctaLink: newSectionForm.ctaLink,
    });

    setIsAddSectionOpen(false);
    setNewSectionForm({
      name: '',
      heading: '',
      subheading: '',
      description: '',
      sectionType: 'products',
      displayStyle: 'slider',
      imageUrl: '',
      imageId: '',
      isVisible: true,
      order: maxOrder + 2,
      ctaText: 'View All →',
      ctaLink: '#',
    });
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryForm.name.trim()) return;

    await addCategory({
      name: newCategoryForm.name,
      description: newCategoryForm.description,
      imageUrl: newCategoryForm.imageUrl,
      image: newCategoryForm.imageUrl,
      imageId: newCategoryForm.imageId || (newCategoryForm.imageUrl?.startsWith('img_') ? newCategoryForm.imageUrl : undefined),
      categoryType: newCategoryForm.categoryType,
      displayOrder: newCategoryForm.displayOrder || (categories?.length || 0) + 1,
      isVisible: newCategoryForm.isVisible,
    });

    setIsAddCategoryOpen(false);
    setNewCategoryForm({
      name: '',
      description: '',
      imageUrl: '',
      imageId: '',
      categoryType: 'Food',
      displayOrder: (categories?.length || 0) + 2,
      isVisible: true,
    });
  };

  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    await updateCategory(editingCategory.id, editingCategory);
    setEditingCategory(null);
  };

  const handleCreateBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerForm.name.trim()) return;

    const created = await addSection({
      sectionKey: `banner-${Date.now()}`,
      name: newBannerForm.name,
      heading: newBannerForm.heading || newBannerForm.name,
      subheading: newBannerForm.subheading,
      description: newBannerForm.description,
      sectionType: 'banner',
      bannerType: newBannerForm.bannerType,
      imageUrl: newBannerForm.imageUrl,
      isVisible: newBannerForm.isVisible,
      order: newBannerForm.order || draftSections.length + 1,
      ctaText: newBannerForm.ctaText,
      ctaLink: newBannerForm.ctaLink,
    });

    setIsAddBannerOpen(false);
    setBannerToPosition(created);
  };

  const handleHeroSlideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHeroSlide) return;

    const updated = draftHeroSlides.map((s) => (s.id === editingHeroSlide.id ? editingHeroSlide : s));
    updateDraftHeroSlides(updated);
    setEditingHeroSlide(null);
  };

  const handlePublishConfirm = () => {
    publishWebsiteChanges(publishNote);
    setShowPublishModal(false);
  };

  // Dedicated banner slot upload/replace handler
  const handleSlotFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slotType: 'hero' | 'section',
    slotId: string,
    targetField: 'imageUrl' | 'mobileImageUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentUrl =
      slotType === 'hero'
        ? draftHeroSlides.find((s) => s.id === slotId)?.[targetField]
        : draftSections.find((s) => s.id === slotId)?.[targetField];

    const slotKey = `${slotType}_${slotId}_${targetField}`;
    setIsUploading((prev) => ({ ...prev, [slotKey]: true }));
    setUploadProgress((prev) => ({ ...prev, [slotKey]: 10 }));

    try {
      let savedUrl = '';
      let storagePath = '';

      const matchedMedia = mediaItems.find(
        (m) => m.url === currentUrl || m.downloadURL === currentUrl || m.filePath === currentUrl
      );

      // If slot already had a persistent media record, replace it so the old file is safely swapped
      if (currentUrl && matchedMedia) {
        const updated = await replaceMedia(matchedMedia.id, file, (prog) => {
          setUploadProgress((prev) => ({ ...prev, [slotKey]: prog }));
        });
        savedUrl = updated.url || updated.downloadURL || '';
        storagePath = updated.filePath;
      } else {
        const mediaItem = await uploadMedia(
          file,
          slotType === 'hero' ? 'hero' : 'banner',
          slotId,
          targetField === 'imageUrl',
          `${slotType} banner ${slotId}`,
          (prog) => {
            setUploadProgress((prev) => ({ ...prev, [slotKey]: prog }));
          }
        );
        savedUrl = mediaItem.url || mediaItem.downloadURL || '';
        storagePath = mediaItem.filePath;
      }

      if (slotType === 'hero') {
        const updated = draftHeroSlides.map((slide) =>
          slide.id === slotId
            ? {
                ...slide,
                [targetField]: savedUrl,
                storagePath,
              }
            : slide
        );
        updateDraftHeroSlides(updated);
        publishWebsiteChanges(`Uploaded hero artwork for slide ${slotId}`, updated, undefined);
      } else {
        const updated = draftSections.map((section) =>
          section.id === slotId
            ? {
                ...section,
                [targetField]: savedUrl,
                storagePath,
              }
            : section
        );
        updateDraftSections(updated);
        publishWebsiteChanges(`Uploaded banner artwork for section ${slotId}`, undefined, updated);
      }
    } catch (err: any) {
      console.error('Media upload failed:', err);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Could not upload to server storage. Please retry.',
      });
    } finally {
      setIsUploading((prev) => ({ ...prev, [slotKey]: false }));
      setUploadProgress((prev) => ({ ...prev, [slotKey]: 100 }));
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveSlotImage = (
    slotType: 'hero' | 'section',
    slotId: string,
    targetField: 'imageUrl' | 'mobileImageUrl'
  ) => {
    if (slotType === 'hero') {
      const updated = draftHeroSlides.map((slide) =>
        slide.id === slotId ? { ...slide, [targetField]: '' } : slide
      );
      updateDraftHeroSlides(updated);
    } else {
      const updated = draftSections.map((section) =>
        section.id === slotId ? { ...section, [targetField]: '' } : section
      );
      updateDraftSections(updated);
    }
    showToast({ type: 'info', title: 'Image Cleared', message: 'Image reference removed from slot.' });
  };

  const handleSaveSlot = (slotType: 'hero' | 'section', slotId: string) => {
    publishWebsiteChanges(`Saved ${slotType === 'hero' ? 'Hero Slide' : 'Banner'} ${slotId}`);
    showToast({
      type: 'success',
      title: 'Saved Successfully',
      message: `${slotType === 'hero' ? 'Hero Slide' : 'Banner'} saved & live on customer website.`,
    });
  };

  const handleConfirmDeletePermanently = async () => {
    if (!imageToDelete) return;
    try {
      const targetUrl = imageToDelete.url;
      const matched = mediaItems.find(
        (m) =>
          m.url === targetUrl ||
          m.downloadURL === targetUrl ||
          m.filePath === targetUrl ||
          (imageToDelete.mediaId && (m.id === imageToDelete.mediaId || m.mediaId === imageToDelete.mediaId))
      );

      if (matched) {
        await deleteMedia(matched.id);
      } else if (imageToDelete.mediaId) {
        await deleteMedia(imageToDelete.mediaId);
      } else if (targetUrl && (targetUrl.startsWith('/uploads/') || targetUrl.startsWith('uploads/'))) {
        await deleteMedia(targetUrl);
      }
    } catch (err: any) {
      console.warn('Delete media warning:', err);
    }

    if (imageToDelete.slotType && imageToDelete.slotId && imageToDelete.field) {
      handleRemoveSlotImage(imageToDelete.slotType, imageToDelete.slotId, imageToDelete.field);
    }

    setImageToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* CMS Header & Live Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-[#fae8be]">Storefront CMS & Layout Architect</h2>
            {hasDraftChanges && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Unpublished Draft Changes
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure homepage hero banners, coffee shelf, Tiramisu spotlight, and persistent Firebase media.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasDraftChanges && (
            <button
              onClick={discardWebsiteDraft}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Draft</span>
            </button>
          )}

          <button
            onClick={() => setShowPublishModal(true)}
            disabled={!hasDraftChanges}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish Changes Live</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#281810] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'sections'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Homepage Sections ({draftSections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Product Categories ({categories?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'banners'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Move className="w-4 h-4" />
          <span>Banners &amp; Positioning Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'hero'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Hero Slides ({draftHeroSlides.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Media Vault ({mediaItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('revisions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'revisions'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Revisions ({websiteRevisions.length})</span>
        </button>
      </div>

      {/* 1. HERO & BANNER MEDIA TAB (Comprehensive Persistent Storage System) */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Storage Status Banner */}
          <div className="p-4 rounded-2xl bg-[#180f0b] border border-[#382319] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-zinc-100">Persistent Server Media Storage</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SERVER PERSISTENT
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Uploaded files persist permanently in server-side storage & media database. Survives page refreshes, browser restarts, and updates without Firebase.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 border-t md:border-t-0 md:border-l border-[#2e1c12] pt-2 md:pt-0 md:pl-4">
              <div>
                <span className="text-zinc-500 block text-[10px]">Server Media Items</span>
                <span className="font-bold text-[#cfa851] text-sm">{mediaItems.length} Files</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Storage Mode</span>
                <span className="font-bold text-emerald-400 text-sm">Persistent /uploads</span>
              </div>
            </div>
          </div>

          {/* Banner Slots Overview */}
          <div className="space-y-6">
            <h3 className="text-base font-bold font-serif text-[#fae8be] flex items-center gap-2">
              <span>Homepage Banner Slots</span>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                ({draftHeroSlides.length} Hero Slides + {draftSections.filter((s) => s.imageUrl).length} Section Banners)
              </span>
            </h3>

            {/* Hero Slides Slots */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#cfa851]">
                Hero Banner Slots (Top of Storefront)
              </h4>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {draftHeroSlides.map((slide, idx) => {
                  const desktopKey = `hero_${slide.id}_imageUrl`;
                  const mobileKey = `hero_${slide.id}_mobileImageUrl`;
                  const isUploadingDesktop = isUploading[desktopKey];
                  const isUploadingMobile = isUploading[mobileKey];
                  const desktopProg = uploadProgress[desktopKey] || 0;
                  const mobileProg = uploadProgress[mobileKey] || 0;

                  return (
                    <div
                      key={slide.id}
                      className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] hover:border-[#cfa851]/30 transition shadow-xl space-y-4"
                    >
                      {/* Slot Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#281810] text-[#cfa851] border border-[#3e271c]">
                              Hero Slide #{idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-100">{slide.title}</h4>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{slide.subtitle}</p>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Persistent Storage</span>
                        </span>
                      </div>

                      {/* Desktop Image Slot */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5 text-[#cfa851]" />
                            <span>Desktop Landscape Artwork (Primary)</span>
                          </span>
                          {slide.imageUrl && (
                            <button
                              onClick={() => handleCopyUrl(slide.imageUrl)}
                              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
                            >
                              {copiedUrl === slide.imageUrl ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy URL</span>
                            </button>
                          )}
                        </div>

                        <div className="relative h-44 w-full rounded-xl bg-[#1c110a] border border-[#331f14] overflow-hidden group">
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt={slide.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                              <ImageIcon className="w-8 h-8 mb-1" />
                              <span className="text-xs">No Desktop Image Configured</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                            <label className="px-3 py-1.5 rounded-xl bg-[#cfa851] text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#dbb660] transition shadow-lg">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{slide.imageUrl ? 'Replace Image' : 'Upload Image'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleSlotFileUpload(e, 'hero', slide.id, 'imageUrl')}
                              />
                            </label>

                            {slide.imageUrl && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlotImage('hero', slide.id, 'imageUrl')}
                                  className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-xs flex items-center gap-1 hover:bg-zinc-700 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setImageToDelete({
                                      url: slide.imageUrl,
                                      slotType: 'hero',
                                      slotId: slide.id,
                                      field: 'imageUrl',
                                      fileName: `${slide.title} Desktop Hero`,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 font-semibold text-xs flex items-center gap-1 hover:bg-red-900 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Permanently</span>
                                </button>
                              </>
                            )}
                          </div>

                          {isUploadingDesktop && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                              <RefreshCw className="w-6 h-6 text-[#cfa851] animate-spin mb-2" />
                              <span className="text-xs font-mono text-zinc-200">
                                Uploading to Server Storage... {desktopProg}%
                              </span>
                              <div className="w-48 bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div
                                  className="bg-[#cfa851] h-full transition-all duration-300"
                                  style={{ width: `${desktopProg}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Button Controls Suite: Upload/Replace, Remove, Delete Permanently, Save */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#24160e]">
                          <div className="flex items-center gap-1.5">
                            <label className="px-2.5 py-1.5 rounded-lg bg-[#cfa851] text-zinc-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-[#dbb660] transition shadow">
                              <Upload className="w-3 h-3" />
                              <span>{slide.imageUrl ? 'Replace Image' : 'Upload Image'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleSlotFileUpload(e, 'hero', slide.id, 'imageUrl')}
                              />
                            </label>

                            {slide.imageUrl && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlotImage('hero', slide.id, 'imageUrl')}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-medium transition cursor-pointer"
                                >
                                  Remove Image
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setImageToDelete({
                                      url: slide.imageUrl,
                                      slotType: 'hero',
                                      slotId: slide.id,
                                      field: 'imageUrl',
                                      fileName: `${slide.title} Desktop Hero`,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 hover:text-white text-[11px] font-medium transition cursor-pointer"
                                >
                                  Delete Permanently
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveSlot('hero', slide.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>

                      {/* Mobile Image Slot */}
                      <div className="space-y-2 pt-2 border-t border-[#24160e]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-[#cfa851]" />
                            <span>Mobile Portrait Artwork (Optional Override)</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-20 h-24 rounded-lg bg-[#1c110a] border border-[#331f14] overflow-hidden shrink-0 relative group">
                            {slide.mobileImageUrl ? (
                              <img
                                src={slide.mobileImageUrl}
                                alt="Mobile artwork"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-[10px] text-center p-1">
                                <Smartphone className="w-4 h-4 mb-0.5" />
                                <span>Desktop used</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <p className="text-[11px] text-zinc-400">
                              Upload an optimized vertical orientation crop for smartphone viewports.
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22150e] hover:bg-[#2c1b12] border border-[#3d2518] text-xs text-[#fae8be] font-semibold cursor-pointer transition">
                                <Upload className="w-3.5 h-3.5 text-[#cfa851]" />
                                <span>{slide.mobileImageUrl ? 'Replace Mobile Crop' : 'Upload Mobile Crop'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleSlotFileUpload(e, 'hero', slide.id, 'mobileImageUrl')}
                                />
                              </label>

                              {slide.mobileImageUrl && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlotImage('hero', slide.id, 'mobileImageUrl')}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-medium transition cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImageToDelete({
                                        url: slide.mobileImageUrl!,
                                        slotType: 'hero',
                                        slotId: slide.id,
                                        field: 'mobileImageUrl',
                                        fileName: `${slide.title} Mobile Artwork`,
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 hover:text-white text-[11px] font-medium transition cursor-pointer"
                                  >
                                    Delete Permanently
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSaveSlot('hero', slide.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer ml-auto"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            </div>
                            {isUploadingMobile && (
                              <div className="text-[11px] font-mono text-[#cfa851] flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Uploading to Server Storage {mobileProg}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Video Background Support */}
                      <div className="space-y-1.5 pt-2 border-t border-[#24160e]">
                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-[#cfa851]" />
                          <span>Video Ambient Loop URL (Optional MP4 / WebM)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://.../cinematic-coffee-pour.mp4"
                          value={slide.videoUrl || ''}
                          onChange={(e) => {
                            const updated = draftHeroSlides.map((s) =>
                              s.id === slide.id ? { ...s, videoUrl: e.target.value } : s
                            );
                            updateDraftHeroSlides(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-[#1a100a] border border-[#331f14] rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#cfa851]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Feature Section Banners */}
            <div className="space-y-4 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#cfa851]">
                Specialty Section Banners (Homepage Body)
              </h4>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {draftSections
                  .filter((sec) => sec.sectionKey !== 'coffeeFlavours')
                  .map((section) => {
                    const desktopKey = `section_${section.id}_imageUrl`;
                    const isUploadingDesktop = isUploading[desktopKey];
                    const desktopProg = uploadProgress[desktopKey] || 0;

                    return (
                      <div
                        key={section.id}
                        className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] hover:border-[#cfa851]/30 transition shadow-xl space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#281810] text-[#cfa851] border border-[#3e271c]">
                                {section.sectionKey}
                              </span>
                              <h4 className="text-sm font-bold text-zinc-100">{section.name}</h4>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5 font-serif italic text-[#fae8be]">
                              "{section.heading}"
                            </p>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              section.isVisible
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {section.isVisible ? 'ACTIVE SECTION' : 'HIDDEN'}
                          </span>
                        </div>

                        {/* Banner Image Preview */}
                        <div className="space-y-2">
                          <div className="relative h-40 w-full rounded-xl bg-[#1c110a] border border-[#331f14] overflow-hidden group">
                            {section.imageUrl ? (
                              <img
                                src={section.imageUrl}
                                alt={section.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                <ImageIcon className="w-8 h-8 mb-1" />
                                <span className="text-xs">No Feature Banner Assigned</span>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                              <label className="px-3 py-1.5 rounded-xl bg-[#cfa851] text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#dbb660] transition shadow-lg">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{section.imageUrl ? 'Replace Banner' : 'Upload Banner'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleSlotFileUpload(e, 'section', section.id, 'imageUrl')}
                                />
                              </label>

                              {section.imageUrl && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlotImage('section', section.id, 'imageUrl')}
                                    className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-xs flex items-center gap-1 hover:bg-zinc-700 transition cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImageToDelete({
                                        url: section.imageUrl || '',
                                        slotType: 'section',
                                        slotId: section.id,
                                        field: 'imageUrl',
                                        fileName: `${section.name} Feature Banner`,
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 font-semibold text-xs flex items-center gap-1 hover:bg-red-900 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Permanently</span>
                                  </button>
                                </>
                              )}
                            </div>

                            {isUploadingDesktop && (
                              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                                <RefreshCw className="w-6 h-6 text-[#cfa851] animate-spin mb-2" />
                                <span className="text-xs font-mono text-zinc-200">
                                  Uploading to Server Storage {desktopProg}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Button Controls Suite: Upload/Replace, Remove, Delete Permanently, Save */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#24160e]">
                            <div className="flex items-center gap-1.5">
                              <label className="px-2.5 py-1.5 rounded-lg bg-[#cfa851] text-zinc-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-[#dbb660] transition shadow">
                                <Upload className="w-3 h-3" />
                                <span>{section.imageUrl ? 'Replace Banner' : 'Upload Banner'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleSlotFileUpload(e, 'section', section.id, 'imageUrl')}
                                />
                              </label>

                              {section.imageUrl && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlotImage('section', section.id, 'imageUrl')}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-medium transition cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImageToDelete({
                                        url: section.imageUrl || '',
                                        slotType: 'section',
                                        slotId: section.id,
                                        field: 'imageUrl',
                                        fileName: `${section.name} Feature Banner`,
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 hover:text-white text-[11px] font-medium transition cursor-pointer"
                                  >
                                    Delete Permanently
                                  </button>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveSlot('section', section.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Persistent Server Media Asset Vault */}
          <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-serif text-[#fae8be]">
                  Persistent Server Media Asset Vault
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Browse and manage all uploaded promotional and hero artwork items stored permanently on server disk.
                </p>
              </div>

              <label className="px-4 py-2 rounded-xl bg-[#cfa851] text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-[#dbb660] transition shadow-lg">
                <Upload className="w-4 h-4" />
                <span>Upload General Asset</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await uploadMedia(file, 'banner');
                    }
                  }}
                />
              </label>
            </div>

            {mediaItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#342015] rounded-xl text-zinc-500 text-xs">
                No custom files uploaded to server storage yet. Upload an image above to begin populating the persistent vault.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl bg-[#1b100a] border border-[#331f14] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative h-28 w-full bg-[#120a06]">
                      {(item.url || item.downloadURL) ? (
                        <img
                          src={item.url || item.downloadURL}
                          alt={item.altText || item.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        <button
                          onClick={() => handleCopyUrl(item.url || item.downloadURL || '')}
                          title="Copy Link"
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setImageToDelete({
                              url: item.url || item.downloadURL || '',
                              fileName: item.fileName,
                              mediaId: item.id,
                            })
                          }
                          title="Delete from Server Storage"
                          className="p-1.5 rounded-lg bg-red-950 text-red-300 hover:bg-red-900 border border-red-500/30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 text-[10px]">
                      <span className="block truncate font-medium text-zinc-300">{item.fileName}</span>
                      <span className="text-zinc-500 font-mono text-[9px] uppercase">{item.mediaType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. HERO SLIDES CAROUSEL TAB */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Manage the rotating cinematic hero presentations on the customer storefront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {draftHeroSlides.map((slide) => (
              <div
                key={slide.id}
                className="rounded-2xl bg-[#140c08] border border-[#2e1c12] overflow-hidden flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative h-44 w-full bg-[#1b100a]">
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140c08] via-transparent to-black/40"></div>
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 text-[#cfa851] border border-[#cfa851]/30">
                      Slide #{slide.displayOrder}
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <span className="text-[10px] font-mono text-[#cfa851] uppercase tracking-wider">
                      {slide.subtitle}
                    </span>
                    <h4 className="text-sm font-bold font-serif text-zinc-100">{slide.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {slide.description}
                    </p>
                    <p className="text-[11px] text-zinc-500 pt-2 border-t border-[#261710]">
                      CTA: <span className="text-zinc-300 font-semibold">{slide.buttonText}</span> ({slide.buttonLink})
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#180f0b] border-t border-[#261710] flex justify-end">
                  <button
                    onClick={() => setEditingHeroSlide(slide)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#251710] hover:bg-[#341f15] text-[#fae8be] text-xs font-semibold border border-[#3e271c] transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#cfa851]" />
                    <span>Edit Slide Content</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. HOMEPAGE SECTIONS TAB */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#180f0b] border border-[#2e1c12]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-serif text-[#fae8be]">
                  Homepage Sections &amp; Sequence Architecture
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#281810] text-[#cfa851] border border-[#3e271c]">
                  {draftSections.length} Sections Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Drag or reorder sections to alter customer landing flow. Configure Grid vs Horizontal Slider for food and merchandise.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const maxOrder = draftSections.reduce((max, s) => Math.max(max, s.displayOrder ?? s.order ?? 0), 0);
                setNewSectionForm({
                  name: '',
                  heading: '',
                  subheading: '',
                  description: '',
                  sectionType: 'products',
                  displayStyle: 'slider',
                  imageUrl: '',
                  imageId: '',
                  isVisible: true,
                  order: maxOrder + 1,
                  ctaText: 'View All →',
                  ctaLink: '#',
                });
                setIsAddSectionOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#cfa851]/15 transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Section</span>
            </button>
          </div>

          <div className="space-y-3">
            {draftSections.map((section, idx) => {
              const isCoffee = section.sectionKey === 'coffeeFlavours' || section.id === 'sec-2';
              const isBites = section.sectionKey === 'bitesAndIndulgence' || section.id === 'sec-bites-indulgence';
              const isBanner = section.sectionType === 'banner' || section.sectionKey === 'whatsInside';

              return (
                <div
                  key={section.id}
                  className={`p-4 rounded-2xl bg-[#140c08] border transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg ${
                    section.isVisible ? 'border-[#2e1c12] hover:border-[#cfa851]/40' : 'border-zinc-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#22150e] border border-[#382319] flex items-center justify-center font-mono text-xs font-bold text-[#cfa851] shrink-0">
                      #{section.order}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-100">{section.name}</h4>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            section.isVisible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {section.isVisible ? 'VISIBLE' : 'HIDDEN'}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#22150e] text-[#fae8be] border border-[#382319]">
                          {isBanner ? 'BANNER' : 'PRODUCTS'}
                        </span>
                        {!isBanner && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#1e130c] text-[#cfa851] border border-[#3e271c]">
                            {section.displayStyle === 'grid' ? 'GRID' : 'HORIZONTAL SLIDER'}
                          </span>
                        )}
                        {isCoffee && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/30">
                            CORE COFFEE (PROTECTED)
                          </span>
                        )}
                        {isBites && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-[#fae8be] border border-[#cfa851]/30">
                            SLIDER (8 PRODUCTS)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 font-serif italic text-[#fae8be]">
                        "{section.heading}"
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Section Up"
                      className="p-2 rounded-xl bg-[#20140d] text-zinc-400 hover:text-zinc-200 border border-[#331f14] disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === draftSections.length - 1}
                      title="Move Section Down"
                      className="p-2 rounded-xl bg-[#20140d] text-zinc-400 hover:text-zinc-200 border border-[#331f14] disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleSectionVisibility(section.id)}
                      title={section.isVisible ? 'Hide Section' : 'Show Section'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        section.isVisible
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {section.isVisible ? 'Hide' : 'Show'}
                    </button>
                    {(isBanner || section.imageUrl) && (
                      <button
                        onClick={() => setBannerToPosition(section)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e130c] hover:bg-[#2c1b12] text-[#cfa851] text-xs font-semibold border border-[#442a1d] transition cursor-pointer"
                      >
                        <Move className="w-3.5 h-3.5 text-[#cfa851]" />
                        <span>Positioning</span>
                      </button>
                    )}
                    <button
                      onClick={() => setEditingSection({ ...section })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#261710] hover:bg-[#341f15] text-[#fae8be] text-xs font-semibold border border-[#3e271c] transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#cfa851]" />
                      <span>Edit</span>
                    </button>
                    {!isCoffee && (
                      <button
                        onClick={() => setSectionToDelete(section)}
                        title="Delete Section (Safe: products unassigned, not deleted)"
                        className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 hover:text-white transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PRODUCT CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#180f0b] border border-[#2e1c12]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-serif text-[#fae8be]">
                  Product Categories &amp; Menu Classification
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#281810] text-[#cfa851] border border-[#3e271c]">
                  {categories?.length || 0} Categories Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Define categories (Desserts, Quick Bites, Bakery, Seasonal) for products. Does not alter coffee menu tabs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewCategoryForm({
                  name: '',
                  description: '',
                  imageUrl: '',
                  imageId: '',
                  categoryType: 'Food',
                  displayOrder: (categories?.length || 0) + 1,
                  isVisible: true,
                });
                setIsAddCategoryOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#cfa851]/15 transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12] hover:border-[#cfa851]/30 transition shadow-lg flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#cfa851] px-2 py-0.5 rounded bg-[#22150e] border border-[#382319]">
                      {cat.categoryType || 'Food'}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        cat.isVisible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {cat.isVisible ? 'ACTIVE' : 'HIDDEN'}
                    </span>
                  </div>
                  {(cat.imageUrl || cat.imageId || cat.image) && (
                    <div className="w-full aspect-[2/1] rounded-xl overflow-hidden bg-black/40 mb-2 border border-[#2e1c12]">
                      <SafeImage
                        src={cat.imageUrl || cat.image}
                        imageId={cat.imageId}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h4 className="text-base font-bold font-serif text-zinc-100">{cat.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#24160e] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">Order #{cat.displayOrder}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(cat)}
                      className="px-3 py-1.5 rounded-lg bg-[#251710] hover:bg-[#341f15] text-[#fae8be] text-xs font-semibold border border-[#3e271c] transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 hover:text-white transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. BANNERS & POSITIONING STUDIO TAB */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#180f0b] border border-[#2e1c12]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-serif text-[#fae8be]">
                  Website Banners &amp; Positioning Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#281810] text-[#cfa851] border border-[#3e271c]">
                  Interactive Drag &amp; Drop
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Freely click, drag, and position headings, subtitles, descriptions, and CTA buttons on live banner preview.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewBannerForm({
                  name: '',
                  heading: '',
                  subheading: '',
                  description: '',
                  imageUrl: '',
                  ctaText: 'Discover More',
                  ctaLink: '#',
                  bannerType: 'promotional',
                  isVisible: true,
                  order: draftSections.length + 1,
                });
                setIsAddBannerOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#cfa851]/15 transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {draftSections
              .filter((s) => s.sectionType === 'banner' || s.sectionKey === 'whatsInside' || s.imageUrl)
              .map((banner) => (
                <div
                  key={banner.id}
                  className="rounded-2xl bg-[#140c08] border border-[#2e1c12] overflow-hidden flex flex-col justify-between shadow-xl"
                >
                  <div className="relative h-48 w-full bg-[#1b100a]">
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-xs">No banner image uploaded</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140c08] via-transparent to-black/50" />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/70 text-[#cfa851] border border-[#cfa851]/30">
                      {banner.bannerType ? banner.bannerType.toUpperCase() + ' BANNER' : 'SECTION BANNER'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-mono text-[#cfa851] uppercase tracking-wider block">
                      {banner.subheading || 'Eyebrow Text'}
                    </span>
                    <h4 className="text-base font-bold font-serif text-zinc-100">{banner.heading || banner.name}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {banner.description || 'Promotional announcement and brand showcase banner.'}
                    </p>
                    <p className="text-[11px] text-zinc-500 pt-2 border-t border-[#261710]">
                      CTA: <span className="text-zinc-300 font-semibold">{banner.ctaText || 'None'}</span> ({banner.ctaLink || '#'})
                    </p>
                  </div>

                  <div className="p-3 bg-[#180f0b] border-t border-[#261710] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSection(banner)}
                      className="px-3 py-1.5 rounded-xl bg-[#22150e] hover:bg-[#2c1b12] text-zinc-300 text-xs font-semibold border border-[#331f14] transition cursor-pointer"
                    >
                      Edit Fields
                    </button>

                    <button
                      type="button"
                      onClick={() => setBannerToPosition(banner)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg hover:brightness-110 cursor-pointer"
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span>Open Positioning Studio</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 4. REVISION HISTORY TAB */}
      {activeTab === 'revisions' && (
        <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl">
          <h3 className="text-sm font-bold font-serif text-[#fae8be] mb-1">
            Rollback & Snapshot Ledger
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Every published update saves an immutable revision snapshot. Click restore to roll back in one click.
          </p>

          <div className="space-y-3">
            {websiteRevisions.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-[#180f0b] border border-[#261710] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">{rev.description}</span>
                    <span className="text-[10px] font-mono text-[#cfa851] bg-[#22140d] px-2 py-0.5 rounded">
                      {rev.adminName}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {new Date(rev.timestamp).toLocaleString()} • {rev.snapshot.sections.length} sections, {rev.snapshot.heroSlides.length} slides
                  </p>
                </div>

                <button
                  onClick={() => restoreWebsiteRevision(rev.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#261710] hover:bg-[#341f15] text-[#fae8be] text-xs font-semibold border border-[#3e271c] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>Restore Snapshot</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setEditingSection(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Edit Section: {editingSection.name}
            </h3>

            <form onSubmit={handleSectionFormSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSection.name}
                    onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Section Display Style
                  </label>
                  <select
                    value={editingSection.displayStyle || 'slider'}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        displayStyle: e.target.value as 'slider' | 'grid',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="slider">Horizontal Slider (Default for Food)</option>
                    <option value="grid">Grid Layout</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Primary Heading *
                </label>
                <input
                  type="text"
                  required
                  value={editingSection.heading}
                  onChange={(e) => setEditingSection({ ...editingSection, heading: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Subheading / Eyebrow Text
                </label>
                <input
                  type="text"
                  value={editingSection.subheading}
                  onChange={(e) => setEditingSection({ ...editingSection, subheading: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Description Text
                </label>
                <textarea
                  rows={3}
                  value={editingSection.description}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#180f0b] border border-[#261710] space-y-2">
                <ImageUploader
                  currentImageId={editingSection.imageId || (editingSection.imageUrl?.startsWith('img_') ? editingSection.imageUrl : null)}
                  currentImageUrl={editingSection.imageUrl}
                  label="Section Image (IndexedDB Persistent)"
                  helperText="JPG, PNG, WEBP, AVIF up to 15 MB. Persistently saved in SECRETPRESSO_LocalStorage."
                  entityType="section"
                  entityId={editingSection.id}
                  aspectRatioClass="aspect-video max-h-36"
                  onImageUploaded={(imageId) => {
                    setEditingSection((prev) => (prev ? {
                      ...prev,
                      imageId,
                      image: imageId,
                      imageUrl: imageId,
                    } : null));
                  }}
                  onImageDeleted={() => {
                    setEditingSection((prev) => (prev ? {
                      ...prev,
                      imageId: undefined,
                      image: null,
                      imageUrl: '',
                    } : null));
                  }}
                />
                <div className="flex items-center gap-2 pt-1 border-t border-[#261710]">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Or Web URL:</span>
                  <input
                    type="url"
                    placeholder="https://... or img_..."
                    value={editingSection.imageUrl || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-[#120b08] border border-[#382319] rounded-lg text-zinc-100 text-xs focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={editingSection.order || 1}
                  onChange={(e) => setEditingSection({ ...editingSection, order: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={editingSection.ctaText || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, ctaText: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    CTA Target Link
                  </label>
                  <input
                    type="text"
                    value={editingSection.ctaLink || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, ctaLink: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Section Modal */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsAddSectionOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#cfa851]" />
              <span>Add New Website Section</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Create a new product showcase or promotional section. Will appear on customer storefront upon saving.
            </p>

            <form onSubmit={handleCreateSectionSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bites &amp; Indulgence, Signature Delights"
                  value={newSectionForm.name}
                  onChange={(e) =>
                    setNewSectionForm({
                      ...newSectionForm,
                      name: e.target.value,
                      heading: newSectionForm.heading || e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Section Subtitle / Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sweet cravings, savoury favourites."
                  value={newSectionForm.subheading}
                  onChange={(e) => setNewSectionForm({ ...newSectionForm, subheading: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Section Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe this section, product range, or artisanal notes..."
                  value={newSectionForm.description}
                  onChange={(e) => setNewSectionForm({ ...newSectionForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Section Type
                  </label>
                  <select
                    value={newSectionForm.sectionType}
                    onChange={(e) =>
                      setNewSectionForm({
                        ...newSectionForm,
                        sectionType: e.target.value as 'products' | 'banner',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="products">Products Showcase</option>
                    <option value="banner">Promotional Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Display Style
                  </label>
                  <select
                    value={newSectionForm.displayStyle}
                    onChange={(e) =>
                      setNewSectionForm({
                        ...newSectionForm,
                        displayStyle: e.target.value as 'slider' | 'grid',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="slider">Horizontal Slider (Default)</option>
                    <option value="grid">Grid Layout</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#180f0b] border border-[#261710] space-y-2">
                <ImageUploader
                  currentImageId={newSectionForm.imageId || (newSectionForm.imageUrl?.startsWith('img_') ? newSectionForm.imageUrl : null)}
                  currentImageUrl={newSectionForm.imageUrl}
                  label="Section Image (IndexedDB Persistent)"
                  helperText="JPG, PNG, WEBP, AVIF up to 15 MB. Persistently saved in SECRETPRESSO_LocalStorage."
                  entityType="section"
                  aspectRatioClass="aspect-video max-h-36"
                  onImageUploaded={(imageId) => {
                    setNewSectionForm((prev) => ({
                      ...prev,
                      imageId,
                      imageUrl: imageId,
                    }));
                  }}
                  onImageDeleted={() => {
                    setNewSectionForm((prev) => ({
                      ...prev,
                      imageId: '',
                      imageUrl: '',
                    }));
                  }}
                />
                <div className="flex items-center gap-2 pt-1 border-t border-[#261710]">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Or Web URL:</span>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or img_..."
                    value={newSectionForm.imageUrl}
                    onChange={(e) => setNewSectionForm({ ...newSectionForm, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-[#120b08] border border-[#382319] rounded-lg text-zinc-100 text-xs focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newSectionForm.order}
                    onChange={(e) => setNewSectionForm({ ...newSectionForm, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Visibility
                  </label>
                  <select
                    value={newSectionForm.isVisible ? 'true' : 'false'}
                    onChange={(e) =>
                      setNewSectionForm({ ...newSectionForm, isVisible: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="true">Visible on Storefront</option>
                    <option value="false">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#261710]">
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] shadow-lg cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Section Safety Confirmation Modal (Requirement 14) */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#140c08] border border-red-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100">
            <h3 className="text-base font-bold font-serif text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span>Delete this section?</span>
            </h3>

            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Are you sure you want to delete section{' '}
              <span className="font-bold text-[#fae8be]">"{sectionToDelete.name}"</span>?
            </p>

            <div className="my-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>This action may permanently remove data.</span>
            </div>

            <div className="my-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-relaxed font-medium">
              Products inside this section will not be deleted. They will become unassigned.
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = sectionToDelete.id;
                  setSectionToDelete(null);
                  await deleteSection(targetId);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg"
              >
                Delete Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal (Requirement 7) */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsAddCategoryOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be] flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-[#cfa851]" />
              <span>Add New Product Category</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Create product categories for food and merchandise. Does not modify coffee menu tabs.
            </p>

            <form onSubmit={handleCreateCategorySubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Desserts, Quick Bites, Bakery, Seasonal"
                  value={newCategoryForm.name}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Category Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short overview of items in this category"
                  value={newCategoryForm.description}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Category Type
                  </label>
                  <select
                    value={newCategoryForm.categoryType}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, categoryType: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="Food">Food &amp; Snacks</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Quick Bites">Quick Bites</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Seasonal">Seasonal</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newCategoryForm.displayOrder}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#180f0b] border border-[#261710] space-y-2">
                <ImageUploader
                  currentImageId={newCategoryForm.imageId || (newCategoryForm.imageUrl?.startsWith('img_') ? newCategoryForm.imageUrl : null)}
                  currentImageUrl={newCategoryForm.imageUrl}
                  label="Category Image (IndexedDB Persistent)"
                  helperText="JPG, PNG, WEBP, AVIF up to 15 MB. Persistently saved in SECRETPRESSO_LocalStorage."
                  entityType="category"
                  aspectRatioClass="aspect-video max-h-32"
                  onImageUploaded={(imageId) => {
                    setNewCategoryForm((prev) => ({
                      ...prev,
                      imageId,
                      imageUrl: imageId,
                    }));
                  }}
                  onImageDeleted={() => {
                    setNewCategoryForm((prev) => ({
                      ...prev,
                      imageId: '',
                      imageUrl: '',
                    }));
                  }}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#261710]">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] shadow-lg cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Edit Category: {editingCategory.name}
            </h3>

            <form onSubmit={handleEditCategorySubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Category Description
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Category Type
                  </label>
                  <input
                    type="text"
                    value={editingCategory.categoryType || 'Food'}
                    onChange={(e) => setEditingCategory({ ...editingCategory, categoryType: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingCategory.displayOrder}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#180f0b] border border-[#261710] space-y-2">
                <ImageUploader
                  currentImageId={editingCategory.imageId || (editingCategory.imageUrl?.startsWith('img_') ? editingCategory.imageUrl : null)}
                  currentImageUrl={editingCategory.imageUrl}
                  label="Category Image (IndexedDB Persistent)"
                  helperText="JPG, PNG, WEBP, AVIF up to 15 MB. Persistently saved in SECRETPRESSO_LocalStorage."
                  entityType="category"
                  entityId={editingCategory.id}
                  aspectRatioClass="aspect-video max-h-32"
                  onImageUploaded={(imageId) => {
                    setEditingCategory((prev) => (prev ? {
                      ...prev,
                      imageId,
                      image: imageId,
                      imageUrl: imageId,
                    } : null));
                  }}
                  onImageDeleted={() => {
                    setEditingCategory((prev) => (prev ? {
                      ...prev,
                      imageId: undefined,
                      image: undefined,
                      imageUrl: '',
                    } : null));
                  }}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#261710]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] shadow-lg cursor-pointer"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Safety Confirmation Modal (Requirement 14) */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#140c08] border border-red-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100">
            <h3 className="text-base font-bold font-serif text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span>Delete this category?</span>
            </h3>

            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Are you sure you want to delete category{' '}
              <span className="font-bold text-[#fae8be]">"{categoryToDelete.name}"</span>?
            </p>

            <div className="my-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>This action may permanently remove data.</span>
            </div>

            <div className="my-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-relaxed font-medium">
              Deleting this category will NOT delete the products.
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = categoryToDelete.id;
                  setCategoryToDelete(null);
                  await deleteCategory(targetId);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-lg"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Banner Modal (Requirement 8) */}
      {isAddBannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsAddBannerOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be] flex items-center gap-2">
              <Move className="w-5 h-5 text-[#cfa851]" />
              <span>Create New Website Banner</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Add a new promotional or section banner with customizable text positioning.
            </p>

            <form onSubmit={handleCreateBannerSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Banner Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Warmth Special, Summer Refresh"
                  value={newBannerForm.name}
                  onChange={(e) =>
                    setNewBannerForm({
                      ...newBannerForm,
                      name: e.target.value,
                      heading: newBannerForm.heading || e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Banner Image *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={newBannerForm.imageUrl}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                  <label className="px-3 py-2 rounded-xl bg-[#22150e] hover:bg-[#2c1b12] border border-[#3d2518] text-xs text-[#fae8be] font-semibold cursor-pointer transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#cfa851]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const uploaded = await uploadMedia(file, 'banner');
                          if (uploaded) {
                            setNewBannerForm((prev) => ({
                              ...prev,
                              imageUrl: uploaded.url || uploaded.downloadURL || '',
                            }));
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={newBannerForm.heading}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, heading: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Subtitle / Eyebrow
                  </label>
                  <input
                    type="text"
                    value={newBannerForm.subheading}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, subheading: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newBannerForm.description}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={newBannerForm.ctaText}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, ctaText: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Banner Type
                  </label>
                  <select
                    value={newBannerForm.bannerType}
                    onChange={(e) =>
                      setNewBannerForm({
                        ...newBannerForm,
                        bannerType: e.target.value as 'hero' | 'promotional' | 'section',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="promotional">Promotional Banner</option>
                    <option value="hero">Hero Banner</option>
                    <option value="section">Section Banner</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#261710]">
                <button
                  type="button"
                  onClick={() => setIsAddBannerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] shadow-lg cursor-pointer"
                >
                  Create &amp; Open Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Positioning Studio Modal (Requirement 9) */}
      {bannerToPosition && (
        <BannerPositioningStudio
          section={bannerToPosition}
          onSave={async (updated) => {
            const nextSections = draftSections.map((s) => (s.id === updated.id ? updated : s));
            updateDraftSections(nextSections);
            await updateSection(updated.id, updated);
          }}
          onClose={() => setBannerToPosition(null)}
        />
      )}

      {/* Edit Hero Slide Modal */}
      {editingHeroSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setEditingHeroSlide(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Edit Hero Slide #{editingHeroSlide.displayOrder}
            </h3>

            <form onSubmit={handleHeroSlideSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Slide Headline *
                </label>
                <input
                  type="text"
                  required
                  value={editingHeroSlide.title}
                  onChange={(e) => setEditingHeroSlide({ ...editingHeroSlide, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Pre-Heading / Tagline
                </label>
                <input
                  type="text"
                  value={editingHeroSlide.subtitle}
                  onChange={(e) => setEditingHeroSlide({ ...editingHeroSlide, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Description Text
                </label>
                <textarea
                  rows={2}
                  value={editingHeroSlide.description}
                  onChange={(e) => setEditingHeroSlide({ ...editingHeroSlide, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Hero Image URL or Cloud Storage Link *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={editingHeroSlide.imageUrl}
                    onChange={(e) => setEditingHeroSlide({ ...editingHeroSlide, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                  <label className="px-3 py-2 rounded-xl bg-[#2b1a11] hover:bg-[#382318] text-[#cfa851] font-semibold border border-[#442b1d] cursor-pointer flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const item = await uploadMedia(file, 'hero', editingHeroSlide.id, true);
                          setEditingHeroSlide((prev) =>
                            prev ? { ...prev, imageUrl: item.url || item.downloadURL || '' } : null
                          );
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={editingHeroSlide.buttonText}
                    onChange={(e) => setEditingHeroSlide({ ...editingHeroSlide, buttonText: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Button Anchor Link
                  </label>
                  <input
                    type="text"
                    value={editingHeroSlide.buttonLink}
                    onChange={(e) => setEditingHeroSlide({ ...editingHeroSlide, buttonLink: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingHeroSlide(null)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] cursor-pointer"
                >
                  Apply to Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Confirm Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Publish Changes to Live Storefront
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Your edits will immediately be visible to all customers visiting SECRETpresso.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                Change Log Description
              </label>
              <input
                type="text"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="e.g. Updated festival banner and coffee roast notes"
                className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-xs text-zinc-100 focus:border-[#cfa851] focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] cursor-pointer"
              >
                Confirm & Deploy Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Permanently Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!imageToDelete}
        title="Delete this image permanently?"
        message={`Are you sure you want to delete ${imageToDelete?.fileName || 'this image'} permanently? The file will be erased from server storage and removed from the customer website.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeletePermanently}
        onCancel={() => setImageToDelete(null)}
      />
    </div>
  );
};
