import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Archive,
  Trash2,
  Edit3,
  Coffee,
  Check,
  AlertTriangle,
  X,
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Star,
  ImageIcon,
  Percent,
  RefreshCw,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ImageUploader } from './ImageUploader';
import { SafeImage } from '../common/SafeImage';

interface ProductsViewProps {
  initialProductId?: string;
  isAddModalOpenInitially?: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  initialProductId,
  isAddModalOpenInitially = false,
}) => {
  const {
    products,
    categories: storeCategories,
    sections,
    addProduct,
    updateProduct,
    duplicateProduct,
    toggleProductVisibility,
    archiveProduct,
    deleteProduct,
    moveProductOrder,
    uploadMedia,
    replaceMedia,
    deleteMedia,
    mediaItems,
    showToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(isAddModalOpenInitially);
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);

  // File input refs for uploading primary and additional images
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const replacePrimaryInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const replaceGalleryInputRefs = useRef<{ [idx: number]: HTMLInputElement | null }>({});

  // Media upload & replace state
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [primaryProgress, setPrimaryProgress] = useState(0);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);

  // Permanent Delete Confirmation for images
  const [imageToDelete, setImageToDelete] = useState<{
    url: string;
    isPrimary?: boolean;
    galleryIndex?: number;
    fileName?: string;
    mediaId?: string;
  } | null>(null);

  // Form State
  const emptyForm: Omit<Product, 'id'> = {
    name: '',
    sku: `SP-${Math.floor(100 + Math.random() * 900)}`,
    category: 'Bites & Indulgence',
    subcategory: '',
    sectionId: 'sec-bites-indulgence',
    displayOrder: 1,
    description: '',
    shortDescription: '',
    price: 250,
    salePrice: 220,
    discountPercent: 12,
    costPrice: 50,
    taxPercent: 5,
    stock: 50,
    lowStockThreshold: 10,
    weight: '250g',
    ingredients: ['Specialty Coffee Beans', 'Water'],
    allergens: ['None'],
    preparationTimeMinutes: 4,
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    badge: 'New',
    tags: ['Specialty'],
    seoTitle: '',
    seoDescription: '',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isAvailable: true,
  };

  const [formData, setFormData] = useState<Omit<Product, 'id'>>(emptyForm);
  const [ingredientsText, setIngredientsText] = useState('');
  const [allergensText, setAllergensText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setIngredientsText('Specialty Ingredients');
    setAllergensText('None');
    setTagsText('Delicacy');
    setIsFormOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      ...p,
      sectionId: p.sectionId || '',
      displayOrder: p.displayOrder || 1,
      additionalImages: p.additionalImages || [],
    });
    setIngredientsText(p.ingredients?.join(', ') || '');
    setAllergensText(p.allergens?.join(', ') || '');
    setTagsText(p.tags?.join(', ') || '');
    setIsFormOpen(true);
  };

  // Image Upload Handlers (Real Server-Side File Upload)
  const handlePrimaryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPrimary(true);
    setPrimaryProgress(15);
    try {
      const item = await uploadMedia(
        file,
        'products',
        editingProduct?.id,
        true,
        file.name,
        (prog) => setPrimaryProgress(prog)
      );
      setFormData((prev) => ({
        ...prev,
        imageUrl: item.url || item.downloadURL || '',
      }));
    } catch (err: any) {
      console.error('Primary upload failed:', err);
      showToast({ type: 'error', title: 'Upload Failed', message: err.message || 'Server upload failed' });
    } finally {
      setIsUploadingPrimary(false);
      setPrimaryProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  const handleReplacePrimaryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const matchedMedia = mediaItems.find(
      (m) => m.url === formData.imageUrl || m.downloadURL === formData.imageUrl || m.filePath === formData.imageUrl
    );
    setIsUploadingPrimary(true);
    setPrimaryProgress(15);
    try {
      if (matchedMedia) {
        const updated = await replaceMedia(matchedMedia.id, file, (prog) => setPrimaryProgress(prog));
        setFormData((prev) => ({ ...prev, imageUrl: updated.url || updated.downloadURL || '' }));
      } else {
        const item = await uploadMedia(
          file,
          'products',
          editingProduct?.id,
          true,
          file.name,
          (prog) => setPrimaryProgress(prog)
        );
        setFormData((prev) => ({ ...prev, imageUrl: item.url || item.downloadURL || '' }));
      }
    } catch (err: any) {
      console.error('Replace primary failed:', err);
      showToast({ type: 'error', title: 'Replace Failed', message: err.message || 'Original image preserved.' });
    } finally {
      setIsUploadingPrimary(false);
      setPrimaryProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingGallery(true);
    setGalleryProgress(15);
    try {
      const item = await uploadMedia(
        file,
        'products',
        editingProduct?.id,
        false,
        file.name,
        (prog) => setGalleryProgress(prog)
      );
      setFormData((prev) => ({
        ...prev,
        additionalImages: [...(prev.additionalImages || []), item.url || item.downloadURL || ''],
      }));
    } catch (err: any) {
      console.error('Gallery upload failed:', err);
      showToast({ type: 'error', title: 'Upload Failed', message: err.message || 'Server upload failed' });
    } finally {
      setIsUploadingGallery(false);
      setGalleryProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  const handleReplaceGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentUrl = formData.additionalImages?.[index];
    const matchedMedia = mediaItems.find(
      (m) => m.url === currentUrl || m.downloadURL === currentUrl || m.filePath === currentUrl
    );

    try {
      let newUrl = '';
      if (matchedMedia) {
        const updated = await replaceMedia(matchedMedia.id, file);
        newUrl = updated.url || updated.downloadURL || '';
      } else {
        const item = await uploadMedia(file, 'products', editingProduct?.id, false, file.name);
        newUrl = item.url || item.downloadURL || '';
      }
      setFormData((prev) => {
        const updatedGallery = [...(prev.additionalImages || [])];
        updatedGallery[index] = newUrl;
        return { ...prev, additionalImages: updatedGallery };
      });
    } catch (err: any) {
      console.error('Replace gallery failed:', err);
      showToast({ type: 'error', title: 'Replace Failed', message: err.message || 'Original image preserved.' });
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleConfirmDeleteImage = async () => {
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
      } else if (targetUrl && (targetUrl.startsWith('/uploads/') || targetUrl.startsWith('uploads/'))) {
        await deleteMedia(targetUrl);
      }
    } catch (err: any) {
      console.warn('Delete media warning:', err);
    }

    if (imageToDelete.isPrimary) {
      const fallback =
        formData.additionalImages && formData.additionalImages.length > 0
          ? formData.additionalImages[0]
          : '';
      const remGallery = (formData.additionalImages || []).filter((u) => u !== fallback);
      setFormData((prev) => ({
        ...prev,
        imageUrl: fallback,
        additionalImages: remGallery,
      }));
    } else if (imageToDelete.galleryIndex !== undefined) {
      setFormData((prev) => ({
        ...prev,
        additionalImages: (prev.additionalImages || []).filter(
          (_, i) => i !== imageToDelete.galleryIndex
        ),
      }));
    }

    setImageToDelete(null);
  };

  const addGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      additionalImages: [...(prev.additionalImages || []), newGalleryUrl.trim()],
    }));
    setNewGalleryUrl('');
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalImages: (prev.additionalImages || []).filter((_, i) => i !== index),
    }));
  };

  const setGalleryAsPrimary = (index: number) => {
    const currentPrimary = formData.imageUrl;
    const gallery = [...(formData.additionalImages || [])];
    const newPrimary = gallery[index];
    gallery[index] = currentPrimary;
    setFormData((prev) => ({
      ...prev,
      imageUrl: newPrimary,
      additionalImages: gallery,
    }));
  };

  const moveGalleryImage = (index: number, direction: 'left' | 'right') => {
    const gallery = [...(formData.additionalImages || [])];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;
    const temp = gallery[index];
    gallery[index] = gallery[targetIndex];
    gallery[targetIndex] = temp;
    setFormData((prev) => ({ ...prev, additionalImages: gallery }));
  };

  // Pricing & Discount synchronized calculation
  const handlePriceChange = (newPrice: number) => {
    const price = Math.max(0, newPrice);
    let sale = formData.salePrice;
    let disc = formData.discountPercent;

    if (disc && disc > 0) {
      sale = Math.round(price * (1 - disc / 100));
    } else if (sale && sale < price) {
      disc = Math.round(((price - sale) / price) * 100);
    }
    setFormData((prev) => ({ ...prev, price, salePrice: sale, discountPercent: disc }));
  };

  const handleSalePriceChange = (newSale: number | undefined) => {
    if (newSale === undefined || isNaN(newSale)) {
      setFormData((prev) => ({ ...prev, salePrice: undefined, discountPercent: 0 }));
      return;
    }
    const sale = Math.max(0, newSale);
    let disc = 0;
    if (formData.price > 0 && sale < formData.price) {
      disc = Math.round(((formData.price - sale) / formData.price) * 100);
    }
    setFormData((prev) => ({ ...prev, salePrice: sale, discountPercent: disc }));
  };

  const handleDiscountChange = (newDisc: number) => {
    const disc = Math.max(0, Math.min(99, newDisc));
    let sale = formData.salePrice;
    if (formData.price > 0 && disc > 0) {
      sale = Math.round(formData.price * (1 - disc / 100));
    } else if (disc === 0) {
      sale = undefined;
    }
    setFormData((prev) => ({ ...prev, discountPercent: disc, salePrice: sale }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const preparedProduct = {
      ...formData,
      sectionId: formData.sectionId || undefined,
      displayOrder: formData.displayOrder !== undefined ? Number(formData.displayOrder) : 1,
      isAvailable: formData.isAvailable ?? true,
      price: Number(formData.price),
      salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      discountPercent: formData.discountPercent ? Number(formData.discountPercent) : undefined,
      costPrice: Number(formData.costPrice),
      stock: Number(formData.stock),
      lowStockThreshold: Number(formData.lowStockThreshold),
      preparationTimeMinutes: Number(formData.preparationTimeMinutes),
      ingredients: ingredientsText.split(',').map((s) => s.trim()).filter(Boolean),
      allergens: allergensText.split(',').map((s) => s.trim()).filter(Boolean),
      tags: tagsText.split(',').map((s) => s.trim()).filter(Boolean),
      additionalImages: (formData.additionalImages || []).filter(Boolean),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, preparedProduct);
    } else {
      addProduct(preparedProduct);
    }

    setIsFormOpen(false);
  };

  const filterCategories = useMemo(() => {
    const defaultList = [
      'Bites & Indulgence',
      'Desserts',
      'Quick Bites',
      'Bakery',
      'Seasonal',
      'Espresso & Hot',
      'Iced & Cold Brew',
      'Signature Tiramisu',
      'Beans & Roast',
      'Collectibles & Merch',
    ];
    const fromCategories = (storeCategories || []).map((c) => c.name);
    const fromProducts = products.map((p) => p.category);
    const unique = Array.from(new Set([...defaultList, ...fromCategories, ...fromProducts])).filter(Boolean);
    return ['ALL', ...unique];
  }, [storeCategories, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Product Catalog & Menu Engineering</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage storefront products, pricing, discounts, image galleries, stock levels, and display order.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#cfa851]/15 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#140c08] rounded-2xl border border-[#2b1910]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU, or taste notes..."
            className="w-full pl-10 pr-4 py-2 bg-[#1b110b] border border-[#342015] rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#cfa851]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {filterCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#cfa851] text-zinc-950 font-bold'
                  : 'bg-[#1b110b] text-zinc-400 hover:text-zinc-200 border border-[#342015]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product, idx) => {
          const isLowStock = product.stock <= product.lowStockThreshold;
          const currentPrice = product.salePrice || product.price;
          const hasDiscount = product.salePrice && product.salePrice < product.price;
          const discountPercent = product.discountPercent || (hasDiscount ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : null);

          return (
            <div
              key={product.id}
              className={`rounded-2xl bg-[#140c08] border transition overflow-hidden flex flex-col justify-between shadow-xl ${
                !product.isAvailable
                  ? 'border-zinc-800 opacity-70'
                  : isLowStock
                  ? 'border-amber-500/40'
                  : 'border-[#2e1c12] hover:border-[#cfa851]/40'
              }`}
            >
              <div>
                {/* Image & Badges Overlay */}
                <div className="relative h-44 w-full bg-[#1e130c] overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#140c08] via-transparent to-black/30 pointer-events-none"></div>

                  {/* Badges Left */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 items-center">
                    {product.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#cfa851] text-zinc-950 shadow-md">
                        {product.badge}
                      </span>
                    )}
                    {discountPercent && discountPercent > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#A43B27] text-white shadow-md">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Actions Top Right: Reorder Up/Down, Star Featured, Visibility */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    {/* Reorder Buttons */}
                    <div className="flex items-center bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 p-0.5">
                      <button
                        onClick={() => moveProductOrder(product.id, 'up')}
                        disabled={idx === 0}
                        title="Move Up in Storefront"
                        className="p-1 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveProductOrder(product.id, 'down')}
                        disabled={idx === filteredProducts.length - 1}
                        title="Move Down in Storefront"
                        className="p-1 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Featured Star Toggle */}
                    <button
                      onClick={() => updateProduct(product.id, { isFeatured: !product.isFeatured })}
                      title={product.isFeatured ? 'Featured (Click to Unfeature)' : 'Not Featured (Click to Feature)'}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition cursor-pointer ${
                        product.isFeatured
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-black/60 text-zinc-400 border border-white/10'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${product.isFeatured ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      onClick={() => toggleProductVisibility(product.id)}
                      title={product.isAvailable ? 'Visible in store (Click to Hide)' : 'Hidden from store (Click to Show)'}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition cursor-pointer ${
                        product.isAvailable
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-900/80 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {product.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* SKU & Stock Bottom Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                      {product.sku}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold backdrop-blur-sm ${
                        isLowStock ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' : 'bg-black/60 text-emerald-300'
                      }`}
                    >
                      Stock: {product.stock} units
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#cfa851]">
                        {product.category}
                      </span>
                      {product.sectionId && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#22140d] text-[#fae8be] border border-[#3e261a]">
                          {sections.find((s) => s.id === product.sectionId || s.sectionKey === product.sectionId)?.name || 'Section'} #{product.displayOrder || 1}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      {hasDiscount ? (
                        <>
                          <span className="text-xs text-zinc-500 line-through">₹{product.price}</span>
                          <span className="text-sm font-bold text-[#fae8be]">₹{product.salePrice}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-[#fae8be]">₹{product.price}</span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100">{product.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {product.shortDescription || product.description}
                  </p>

                  {/* Image count indicator if multiple images */}
                  {product.additionalImages && product.additionalImages.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#cfa851]">
                      <ImageIcon className="w-3 h-3" />
                      <span>{1 + product.additionalImages.length} images in gallery</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#261710] flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Cost: ₹{product.costPrice} • Prep: {product.preparationTimeMinutes}m</span>
                    <span>{product.isAvailable ? '🟢 Visible' : '⚪ Hidden'}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-[#180f0b] border-t border-[#261710] flex items-center justify-between gap-1.5">
                <button
                  onClick={() => openEditModal(product)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#251710] hover:bg-[#341f15] text-[#fae8be] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>Edit Product</span>
                </button>

                <button
                  onClick={() => duplicateProduct(product.id)}
                  title="Duplicate as new draft"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#251710] transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => archiveProduct(product.id)}
                  title="Archive Product"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-[#251710] transition cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTargetProduct(product)}
                  title="Delete Product"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-[#251710] transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Edit / Add Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-3xl rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#261710]">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#cfa851]" />
                <h3 className="text-base font-bold font-serif text-[#fae8be]">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Menu Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 text-xs">
              {/* Product Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Classic Americano"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    SKU Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SP-AME-001"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              {/* Section Assignment & Category (Requirement 11) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#180f0b] border border-[#2e1c12]">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-300 mb-1 flex items-center justify-between">
                    <span>Storefront Section Assignment *</span>
                    <span className="text-[10px] font-mono text-[#cfa851]">Requirement 11</span>
                  </label>
                  <select
                    value={formData.sectionId || ''}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#120a06] border border-[#3e271c] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="sec-bites-indulgence">Bites & Indulgence (Horizontal Slider)</option>
                    <option value="sec-2">Coffee Flavours (Core Coffee Catalog)</option>
                    {sections
                      .filter((s) => s.id !== 'sec-bites-indulgence' && s.id !== 'sec-2' && s.sectionType !== 'banner' && s.sectionKey !== 'whatsInside')
                      .map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name} ({sec.displayStyle === 'grid' ? 'Grid' : 'Slider'})
                        </option>
                      ))}
                    <option value="">None (Unassigned / Catalog Only)</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Assign product to Bites &amp; Indulgence, Coffee, or any custom section.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-300 mb-1 flex items-center justify-between">
                    <span>Product Category *</span>
                    <span className="text-[10px] font-mono text-zinc-500">e.g. Desserts, Quick Bites</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#120a06] border border-[#3e271c] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                    >
                      <optgroup label="Food & Delicacies">
                        <option value="Bites & Indulgence">Bites & Indulgence</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Quick Bites">Quick Bites</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Seasonal">Seasonal</option>
                      </optgroup>
                      <optgroup label="Core Coffee Menu">
                        <option value="Espresso & Hot">Espresso & Hot</option>
                        <option value="Iced & Cold Brew">Iced & Cold Brew</option>
                        <option value="Signature Tiramisu">Signature Tiramisu</option>
                        <option value="Beans & Roast">Beans & Roast</option>
                        <option value="Collectibles & Merch">Collectibles & Merch</option>
                      </optgroup>
                      {storeCategories && storeCategories.length > 0 && (
                        <optgroup label="Admin Created Categories">
                          {storeCategories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Classification within the menu/section (e.g. Desserts, Quick Bites).
                  </p>
                </div>
              </div>

              {/* Display Order, Availability, Badge, Weight */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.displayOrder ?? 1}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Availability
                  </label>
                  <select
                    value={formData.isAvailable ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="true">🟢 Active & In Stock</option>
                    <option value="false">⚪ Hidden / Sold Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Badge Callout
                  </label>
                  <select
                    value={formData.badge || 'None'}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value === 'None' ? undefined : (e.target.value as Product['badge']) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="New">New</option>
                    <option value="Chef Choice">Chef Choice</option>
                    <option value="Special Reserve">Special Reserve</option>
                    <option value="Limited">Limited</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Serving / Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="200g / 300ml"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing, Sale Price, Discount Percentage & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#180f0b] border border-[#261710]">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">
                    Regular Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => handlePriceChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-[#22150e] border border-[#3d2518] rounded-lg font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1 flex items-center justify-between">
                    <span>Sale Price (₹)</span>
                    <span className="text-[9px] text-[#cfa851]">Offer</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.salePrice ?? ''}
                    onChange={(e) => handleSalePriceChange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional"
                    className="w-full px-3 py-1.5 bg-[#22150e] border border-[#3d2518] rounded-lg font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1 flex items-center justify-between">
                    <span>Discount (%)</span>
                    <Percent className="w-2.5 h-2.5 text-[#cfa851]" />
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={formData.discountPercent ?? ''}
                    onChange={(e) => handleDiscountChange(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-[#22150e] border border-[#3d2518] rounded-lg font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">
                    Stock Units
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-[#22150e] border border-[#3d2518] rounded-lg font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              {/* PRIMARY PRODUCT IMAGE (Persistent IndexedDB via ImageUploader) */}
              <div className="p-4 rounded-xl bg-[#180f0b] border border-[#261710] space-y-3">
                <ImageUploader
                  currentImageId={formData.imageId || (formData.imageUrl?.startsWith('img_') ? formData.imageUrl : null)}
                  currentImageUrl={formData.imageUrl}
                  label="Main Product Image (IndexedDB Persistent)"
                  helperText="JPG, PNG, WEBP, AVIF up to 15 MB. Persistently saved in SECRETPRESSO_LocalStorage."
                  entityType="product"
                  entityId={editingProduct?.id || formData.sku || 'new_product'}
                  aspectRatioClass="aspect-video max-h-56"
                  onImageUploaded={(imageId) => {
                    setFormData((prev) => ({
                      ...prev,
                      imageId,
                      mainImageId: imageId,
                      imageUrl: imageId,
                    }));
                  }}
                  onImageDeleted={() => {
                    setFormData((prev) => ({
                      ...prev,
                      imageId: undefined,
                      mainImageId: undefined,
                      imageUrl: '',
                    }));
                  }}
                />

                <div className="pt-2 border-t border-[#261710] flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Or Web URL:</span>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or img_..."
                    className="flex-1 px-3 py-1.5 bg-[#22150e] border border-[#352116] rounded-lg text-zinc-100 text-xs focus:border-[#cfa851] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* MULTIPLE IMAGES (Gallery Support: Add, Reorder, Set Primary, Replace, Remove, Delete) */}
              <div className="p-4 rounded-xl bg-[#180f0b] border border-[#261710] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-zinc-300">
                      Additional Gallery Images
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Multiple images with independent reordering, replacement, and permanent deletion
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#cfa851]">
                    {formData.additionalImages?.length || 0} extra image(s)
                  </span>
                </div>

                {/* Gallery thumbnails */}
                {formData.additionalImages && formData.additionalImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {formData.additionalImages.map((imgUrl, gIdx) => (
                      <div
                        key={gIdx}
                        className="relative group rounded-xl overflow-hidden border border-[#382319] bg-black/40 aspect-square flex flex-col justify-between"
                      >
                        {imgUrl ? (
                          <SafeImage src={imgUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-2">
                          <button
                            type="button"
                            onClick={() => setGalleryAsPrimary(gIdx)}
                            title="Promote to Main Product Image"
                            className="text-[9px] font-mono font-bold bg-[#cfa851] text-zinc-950 px-2 py-0.5 rounded cursor-pointer hover:bg-[#dbb660]"
                          >
                            Set as Main
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveGalleryImage(gIdx, 'left')}
                              disabled={gIdx === 0}
                              title="Move Left"
                              className="p-1 rounded bg-zinc-800 text-white disabled:opacity-30 cursor-pointer hover:bg-zinc-700"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryImage(gIdx, 'right')}
                              disabled={gIdx === formData.additionalImages!.length - 1}
                              title="Move Right"
                              className="p-1 rounded bg-zinc-800 text-white disabled:opacity-30 cursor-pointer hover:bg-zinc-700"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(gIdx)}
                              title="Remove from Product"
                              className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setImageToDelete({
                                  url: imgUrl,
                                  galleryIndex: gIdx,
                                  fileName: `Gallery Image #${gIdx + 1}`,
                                })
                              }
                              title="Delete Permanently"
                              className="p-1 rounded bg-red-950 text-red-300 hover:bg-red-900 border border-red-500/30 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new image to gallery via Persistent IndexedDB ImageUploader */}
                <div className="pt-2">
                  <ImageUploader
                    label="Upload Additional Gallery Image (IndexedDB)"
                    helperText="Stored persistently in SECRETPRESSO_LocalStorage"
                    entityType="gallery"
                    entityId={editingProduct?.id || formData.sku}
                    aspectRatioClass="aspect-video max-h-28"
                    onImageUploaded={(imageId) => {
                      setFormData((prev) => ({
                        ...prev,
                        additionalImages: [...(prev.additionalImages || []), imageId],
                        galleryImageIds: [...(prev.galleryImageIds || []), imageId],
                      }));
                    }}
                  />
                </div>

                {/* Or enter external URL */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#261710]">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Or External URL:</span>
                  <input
                    type="text"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1 px-3 py-1.5 bg-[#22150e] border border-[#352116] rounded-xl text-zinc-100 text-xs focus:border-[#cfa851] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addGalleryUrl}
                    disabled={!newGalleryUrl.trim()}
                    className="px-3 py-1.5 rounded-xl bg-[#2a1a11] hover:bg-[#3d2618] text-[#fae8be] border border-[#3d2518] text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Short & Detailed Descriptions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Short Tasting Notes / Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="e.g. Bold / Smooth / Timeless"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Detailed Gourmet Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Extraction notes, origin of beans, roast profile, tasting palette..."
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              {/* Ingredients & Allergens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Ingredients (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={ingredientsText}
                    onChange={(e) => setIngredientsText(e.target.value)}
                    placeholder="Double Ristretto, Alkaline Water..."
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Allergens (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={allergensText}
                    onChange={(e) => setAllergensText(e.target.value)}
                    placeholder="None, Dairy, Nuts..."
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              {/* Visibility and Flags */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="accent-[#cfa851] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Active & Visible in Customer Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="accent-[#cfa851] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Featured Product (Highlighted)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="accent-[#cfa851] w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Mark as Best Seller</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#261710] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660] transition shadow-lg shadow-[#cfa851]/15 cursor-pointer"
                >
                  {editingProduct ? 'Save Product Changes' : 'Publish Product to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Image Permanently Confirmation */}
      <ConfirmDialog
        isOpen={!!imageToDelete}
        title="Delete this image permanently?"
        message={`Are you sure you want to delete ${imageToDelete?.fileName || 'this image'} permanently? The file will be deleted from server storage and removed from the website.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => setImageToDelete(null)}
      />

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetProduct}
        title={`Remove Product: ${deleteTargetProduct?.name}`}
        message="Are you sure you want to remove this product? You can safely Archive it to keep all data, prices, descriptions, and media intact while hiding it from customers, or delete it permanently."
        confirmLabel="Yes, Delete Permanently"
        archiveLabel="Archive (Recommended - Safe)"
        isDestructive={true}
        onArchive={() => {
          if (deleteTargetProduct) {
            updateProduct(deleteTargetProduct.id, { isAvailable: false, isArchived: true });
            setDeleteTargetProduct(null);
            showToast({
              type: 'info',
              title: 'Product Archived (Data Preserved)',
              message: `${deleteTargetProduct.name} is archived. All pricing, descriptions, and media are safely preserved.`,
            });
          }
        }}
        onConfirm={() => {
          if (deleteTargetProduct) {
            deleteProduct(deleteTargetProduct.id);
            setDeleteTargetProduct(null);
          }
        }}
        onCancel={() => setDeleteTargetProduct(null)}
      />
    </div>
  );
};
