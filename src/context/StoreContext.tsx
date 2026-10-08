import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Category,
  Product,
  Order,
  OrderStatus,
  InventoryItem,
  StockMovement,
  Supplier,
  Customer,
  Coupon,
  Review,
  HeroSlide,
  WebsiteSectionConfig,
  WebsiteRevision,
  StoreSettings,
  StoreHoursDay,
  DeliveryZone,
  DeliveryPartner,
  AdminUser,
  AdminRole,
  ActivityLog,
  AdminNotification,
  AbandonedCart,
  OrderItem,
  MediaItem,
  MediaType,
} from '../types';
import { mediaStorageService } from '../services/mediaStorageService';
import { imageStorageService } from '../services/imageStorageService';
import { idbGetAllMedia } from '../lib/firebase';
import {
  INITIAL_STAFF,
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
  INITIAL_SUPPLIERS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS,
  INITIAL_HERO_SLIDES,
  INITIAL_SECTIONS,
  INITIAL_CATEGORIES,
  INITIAL_STORE_SETTINGS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ABANDONED_CARTS,
} from '../data/initialData';

// Web Audio API chime generator for incoming orders & alerts
function playAdminNotificationSound(type: 'order' | 'kitchen' | 'alert' = 'order') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'order') {
      // Luxury dual-tone chime (E5 -> B5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'kitchen') {
      // Punchy kitchen bell (G5)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(783.99, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // Audio context may require user gesture on some browsers
  }
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface StoreContextType {
  // Authentication & Staff
  currentAdmin: AdminUser | null;
  staff: AdminUser[];
  loginAdmin: (email: string, role?: AdminRole) => boolean;
  logoutAdmin: () => void;
  switchAdminRole: (role: AdminRole) => void;
  addStaffMember: (member: Omit<AdminUser, 'id'>) => void;
  updateStaffMember: (id: string, updates: Partial<AdminUser>) => void;
  toggleStaffActive: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  duplicateProduct: (id: string) => void;
  toggleProductVisibility: (id: string) => void;
  archiveProduct: (id: string) => void;
  deleteProduct: (id: string) => void;
  reorderProducts: (products: Product[]) => void;
  moveProductOrder: (productId: string, direction: 'up' | 'down') => void;

  // Orders
  orders: Order[];
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  placeOrder: (orderInput: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    pincode: string;
    items: OrderItem[];
    notes?: string;
    couponCode?: string;
    paymentMethod: Order['paymentMethod'];
  }) => Order;
  cancelOrder: (orderId: string, reason: string) => void;
  refundOrder: (orderId: string, reason: string) => void;
  assignDeliveryPartner: (orderId: string, partnerName: string, partnerPhone: string) => void;

  // Inventory
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  adjustStock: (itemId: string, quantityChange: number, reason: StockMovement['reason'], note?: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  createRestockRecord: (supplierId: string, items: { itemId: string; quantity: number }[], notes: string) => void;

  // Customers CRM
  customers: Customer[];
  updateCustomerNotes: (customerId: string, notes: string) => void;
  updateCustomerSegment: (customerId: string, segment: Customer['segment']) => void;

  // Promotions & Coupons
  coupons: Coupon[];
  createCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  toggleCouponStatus: (id: string) => void;
  deleteCoupon: (id: string) => void;
  validateCoupon: (code: string, subtotal: number) => { valid: boolean; discount: number; message: string };

  // Reviews
  reviews: Review[];
  moderateReview: (id: string, status: Review['status']) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'status'>) => void;

  // Website CMS & Hero
  heroSlides: HeroSlide[];
  sections: WebsiteSectionConfig[];
  websiteRevisions: WebsiteRevision[];
  draftHeroSlides: HeroSlide[];
  draftSections: WebsiteSectionConfig[];
  hasDraftChanges: boolean;
  updateDraftHeroSlides: (slides: HeroSlide[]) => void;
  updateDraftSections: (sections: WebsiteSectionConfig[]) => void;
  publishWebsiteChanges: (
    description?: string,
    customHeroSlides?: HeroSlide[],
    customSections?: WebsiteSectionConfig[]
  ) => void;
  discardWebsiteDraft: () => void;
  restoreWebsiteRevision: (revisionId: string) => void;
  addSection: (sec: Omit<WebsiteSectionConfig, 'id'>) => Promise<WebsiteSectionConfig>;
  updateSection: (id: string, updates: Partial<WebsiteSectionConfig>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (newSections: WebsiteSectionConfig[]) => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Store Control & Settings
  storeSettings: StoreSettings;
  setStoreOpenManualOverride: (override: boolean | null) => void;
  updateStoreSettings: (updates: Partial<StoreSettings>) => void;
  isStoreOpen: boolean;

  // Delivery
  deliveryZones: DeliveryZone[];
  deliveryPartners: DeliveryPartner[];
  updateDeliveryZone: (id: string, updates: Partial<DeliveryZone>) => void;
  addDeliveryZone: (zone: Omit<DeliveryZone, 'id'>) => void;
  updateDeliveryPartnerStatus: (id: string, status: DeliveryPartner['status']) => void;
  addDeliveryPartner: (partner: Omit<DeliveryPartner, 'id' | 'activeOrdersCount'>) => void;

  // Notifications & Audit Log
  notifications: AdminNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  activityLogs: ActivityLog[];
  logActivity: (module: ActivityLog['module'], action: string, details: string, oldValue?: string, newValue?: string) => void;

  // Abandoned Carts
  abandonedCarts: AbandonedCart[];
  sendCartRecoveryReminder: (cartId: string) => void;

  // Customer Storefront Cart
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  // Feedback Toasts
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Live Sound Setting
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Media Management
  mediaItems: MediaItem[];
  uploadMedia: (
    file: File,
    mediaType: MediaType,
    targetId?: string,
    isPrimary?: boolean,
    altText?: string,
    onProgress?: (progress: number) => void
  ) => Promise<MediaItem>;
  replaceMedia: (
    oldMediaId: string,
    newFile: File,
    onProgress?: (progress: number) => void
  ) => Promise<MediaItem>;
  deleteMedia: (mediaId: string) => Promise<void>;
  updateMediaMetadata: (mediaId: string, updates: Partial<MediaItem>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STAFF: 'sp_admin_staff',
  CURRENT_ADMIN: 'sp_current_admin',
  PRODUCTS: 'sp_products',
  ORDERS: 'sp_orders',
  INVENTORY: 'sp_inventory',
  STOCK_MOVEMENTS: 'sp_stock_movements',
  SUPPLIERS: 'sp_suppliers',
  CUSTOMERS: 'sp_customers',
  COUPONS: 'sp_coupons',
  REVIEWS: 'sp_reviews',
  HERO_SLIDES: 'sp_hero_slides',
  SECTIONS: 'sp_sections',
  REVISIONS: 'sp_website_revisions',
  STORE_SETTINGS: 'sp_store_settings',
  DELIVERY_ZONES: 'sp_delivery_zones',
  DELIVERY_PARTNERS: 'sp_delivery_partners',
  ACTIVITY_LOGS: 'sp_activity_logs',
  NOTIFICATIONS: 'sp_notifications',
  ABANDONED_CARTS: 'sp_abandoned_carts',
  CART: 'sp_customer_cart',
  MEDIA: 'sp_media_library',
  CATEGORIES: 'sp_categories',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [staff, setStaff] = useState<AdminUser[]>(() => loadStored(STORAGE_KEYS.STAFF, INITIAL_STAFF));
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => loadStored(STORAGE_KEYS.CURRENT_ADMIN, INITIAL_STAFF[0]));
  const [products, setProducts] = useState<Product[]>(() => loadStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => loadStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
  const [orders, setOrders] = useState<Order[]>(() => loadStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadStored(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadStored(STORAGE_KEYS.STOCK_MOVEMENTS, []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS));
  const [coupons, setCoupons] = useState<Coupon[]>(() => loadStored(STORAGE_KEYS.COUPONS, INITIAL_COUPONS));
  const [reviews, setReviews] = useState<Review[]>(() => loadStored(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS));
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => loadStored(STORAGE_KEYS.HERO_SLIDES, INITIAL_HERO_SLIDES));
  const [sections, setSections] = useState<WebsiteSectionConfig[]>(() => loadStored(STORAGE_KEYS.SECTIONS, INITIAL_SECTIONS));
  const [websiteRevisions, setWebsiteRevisions] = useState<WebsiteRevision[]>(() => loadStored(STORAGE_KEYS.REVISIONS, [
    {
      id: 'rev-init',
      timestamp: new Date().toISOString(),
      adminName: 'System Initializer',
      description: 'Production baseline setup',
      snapshot: { heroSlides: INITIAL_HERO_SLIDES, sections: INITIAL_SECTIONS },
    },
  ]));
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => loadStored(STORAGE_KEYS.STORE_SETTINGS, INITIAL_STORE_SETTINGS));
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => loadStored(STORAGE_KEYS.DELIVERY_ZONES, INITIAL_DELIVERY_ZONES));
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>(() => loadStored(STORAGE_KEYS.DELIVERY_PARTNERS, INITIAL_DELIVERY_PARTNERS));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadStored(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS));
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => loadStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS));
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(() => loadStored(STORAGE_KEYS.ABANDONED_CARTS, INITIAL_ABANDONED_CARTS));
  const [cart, setCart] = useState<OrderItem[]>(() => loadStored(STORAGE_KEYS.CART, []));
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => loadStored(STORAGE_KEYS.MEDIA, []));

  // Website CMS Draft State
  const [draftHeroSlides, setDraftHeroSlides] = useState<HeroSlide[]>(heroSlides);
  const [draftSections, setDraftSections] = useState<WebsiteSectionConfig[]>(sections);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  // UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync to localStorage
  useEffect(() => saveStored(STORAGE_KEYS.STAFF, staff), [staff]);
  useEffect(() => saveStored(STORAGE_KEYS.CURRENT_ADMIN, currentAdmin), [currentAdmin]);
  useEffect(() => saveStored(STORAGE_KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveStored(STORAGE_KEYS.ORDERS, orders), [orders]);
  useEffect(() => saveStored(STORAGE_KEYS.INVENTORY, inventory), [inventory]);
  useEffect(() => saveStored(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements), [stockMovements]);
  useEffect(() => saveStored(STORAGE_KEYS.SUPPLIERS, suppliers), [suppliers]);
  useEffect(() => saveStored(STORAGE_KEYS.CUSTOMERS, customers), [customers]);
  useEffect(() => saveStored(STORAGE_KEYS.COUPONS, coupons), [coupons]);
  useEffect(() => saveStored(STORAGE_KEYS.REVIEWS, reviews), [reviews]);
  useEffect(() => saveStored(STORAGE_KEYS.HERO_SLIDES, heroSlides), [heroSlides]);
  useEffect(() => saveStored(STORAGE_KEYS.SECTIONS, sections), [sections]);
  useEffect(() => saveStored(STORAGE_KEYS.REVISIONS, websiteRevisions), [websiteRevisions]);
  useEffect(() => saveStored(STORAGE_KEYS.STORE_SETTINGS, storeSettings), [storeSettings]);
  useEffect(() => saveStored(STORAGE_KEYS.DELIVERY_ZONES, deliveryZones), [deliveryZones]);
  useEffect(() => saveStored(STORAGE_KEYS.DELIVERY_PARTNERS, deliveryPartners), [deliveryPartners]);
  useEffect(() => saveStored(STORAGE_KEYS.ACTIVITY_LOGS, activityLogs), [activityLogs]);
  useEffect(() => saveStored(STORAGE_KEYS.NOTIFICATIONS, notifications), [notifications]);
  useEffect(() => saveStored(STORAGE_KEYS.ABANDONED_CARTS, abandonedCarts), [abandonedCarts]);
  useEffect(() => saveStored(STORAGE_KEYS.CART, cart), [cart]);
  useEffect(() => saveStored(STORAGE_KEYS.MEDIA, mediaItems), [mediaItems]);

  useEffect(() => {
    // 1. Fetch persistent media records from server and merge with any existing local & IndexedDB media
    (async () => {
      try {
        const serverRecords = await mediaStorageService.list().catch(() => []);
        const idbMedia = await idbGetAllMedia().catch(() => []);
        const storedImages = await imageStorageService.listImages().catch(() => []);

        // Convert storedImages into MediaItems if not already present
        const idbConverted: MediaItem[] = storedImages.map((img) => ({
          id: img.id,
          originalName: img.fileName,
          fileName: img.fileName,
          filePath: `/indexeddb/${img.id}`,
          url: img.id,
          downloadURL: img.id,
          mimeType: img.mimeType || 'image/jpeg',
          size: img.fileSize || 0,
          mediaType: (img.entityType === 'hero'
            ? 'hero'
            : img.entityType === 'banner'
            ? 'banners'
            : img.entityType === 'category'
            ? 'collections'
            : 'products') as MediaType,
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
          isActive: true,
          productId: img.entityType === 'product' ? img.entityId : undefined,
          targetId: img.entityId,
          isPrimary: true,
        }));

        const existingLocal = loadStored<MediaItem[]>(STORAGE_KEYS.MEDIA, []);
        const mergedMap = new Map<string, MediaItem>();

        // Priority merge: server records first, then existing local, then IDB media, then converted IDB images
        serverRecords.forEach((item) => mergedMap.set(item.id || item.url, item));
        existingLocal.forEach((item) => {
          if (!mergedMap.has(item.id || item.url)) mergedMap.set(item.id || item.url, item);
        });
        idbMedia.forEach((item) => {
          if (!mergedMap.has(item.id || item.url)) mergedMap.set(item.id || item.url, item);
        });
        idbConverted.forEach((item) => {
          if (!mergedMap.has(item.id || item.url)) mergedMap.set(item.id || item.url, item);
        });

        const allMedia = Array.from(mergedMap.values());
        if (allMedia.length > 0) {
          setMediaItems(allMedia);
          saveStored(STORAGE_KEYS.MEDIA, allMedia);
        }
      } catch (err) {
        console.warn('Could not sync media records on mount:', err);
      }
    })();

    // 2. Fetch persistent website sections from server
    fetch('/api/sections')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverSections) => {
        if (Array.isArray(serverSections) && serverSections.length > 0) {
          const localSecs = loadStored<WebsiteSectionConfig[]>(STORAGE_KEYS.SECTIONS, []);
          const secMap = new Map<string, WebsiteSectionConfig>();
          serverSections.forEach((s) => secMap.set(s.id, s));
          localSecs.forEach((s) => {
            if (!secMap.has(s.id)) {
              secMap.set(s.id, s);
            } else {
              const serverS = secMap.get(s.id)!;
              secMap.set(s.id, { ...serverS, ...s });
            }
          });
          const merged = Array.from(secMap.values());
          setSections(merged);
          setDraftSections(merged);
          saveStored(STORAGE_KEYS.SECTIONS, merged);
        } else {
          fetch('/api/sections', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(INITIAL_SECTIONS),
          }).catch((err) => console.warn('Error seeding sections:', err));
        }
      })
      .catch((err) => console.warn('Could not fetch server sections:', err));

    // 3. Fetch persistent hero slides from server
    fetch('/api/hero-slides')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverSlides) => {
        if (Array.isArray(serverSlides) && serverSlides.length > 0) {
          const localSlides = loadStored<HeroSlide[]>(STORAGE_KEYS.HERO_SLIDES, []);
          const slideMap = new Map<string, HeroSlide>();
          serverSlides.forEach((s) => slideMap.set(s.id, s));
          localSlides.forEach((s) => {
            if (!slideMap.has(s.id)) {
              slideMap.set(s.id, s);
            } else {
              const serverS = slideMap.get(s.id)!;
              slideMap.set(s.id, { ...serverS, ...s });
            }
          });
          const merged = Array.from(slideMap.values());
          setHeroSlides(merged);
          setDraftHeroSlides(merged);
          saveStored(STORAGE_KEYS.HERO_SLIDES, merged);
        } else {
          fetch('/api/hero-slides', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(INITIAL_HERO_SLIDES),
          }).catch((err) => console.warn('Error seeding hero slides:', err));
        }
      })
      .catch((err) => console.warn('Could not fetch server hero slides:', err));

    // 4. Fetch persistent products from server and merge with any existing local edits
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverProducts) => {
        if (Array.isArray(serverProducts) && serverProducts.length > 0) {
          const localProducts = loadStored<Product[]>(STORAGE_KEYS.PRODUCTS, []);
          const prodMap = new Map<string, Product>();
          serverProducts.forEach((p) => prodMap.set(p.id, p));
          localProducts.forEach((p) => {
            if (!prodMap.has(p.id)) {
              prodMap.set(p.id, p);
            } else {
              const serverP = prodMap.get(p.id)!;
              prodMap.set(p.id, {
                ...serverP,
                ...p,
                name: p.name || serverP.name,
                price: p.price ?? serverP.price,
                imageUrl: p.imageUrl || serverP.imageUrl,
                imageId: p.imageId || serverP.imageId,
              });
            }
          });
          const merged = Array.from(prodMap.values());
          setProducts(merged);
          saveStored(STORAGE_KEYS.PRODUCTS, merged);
        } else {
          fetch('/api/products/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(INITIAL_PRODUCTS),
          }).catch((err) => console.warn('Error seeding products:', err));
        }
      })
      .catch((err) => console.warn('Could not fetch server products:', err));

    // 5. Fetch persistent categories from server and merge with any local edits
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverCategories) => {
        if (Array.isArray(serverCategories) && serverCategories.length > 0) {
          const localCats = loadStored<Category[]>(STORAGE_KEYS.CATEGORIES, []);
          const catMap = new Map<string, Category>();
          serverCategories.forEach((c) => catMap.set(c.id, c));
          localCats.forEach((c) => {
            if (!catMap.has(c.id)) {
              catMap.set(c.id, c);
            } else {
              const sCat = catMap.get(c.id)!;
              catMap.set(c.id, { ...sCat, ...c });
            }
          });
          const merged = Array.from(catMap.values());
          setCategories(merged);
          saveStored(STORAGE_KEYS.CATEGORIES, merged);
        } else {
          fetch('/api/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(INITIAL_CATEGORIES),
          }).catch((err) => console.warn('Error seeding categories:', err));
        }
      })
      .catch((err) => console.warn('Could not fetch server categories:', err));
  }, []);

  // Toast dispatch
  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Activity Logger
  const logActivity = useCallback(
    (module: ActivityLog['module'], action: string, details: string, oldValue?: string, newValue?: string) => {
      const newLog: ActivityLog = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toISOString(),
        adminName: currentAdmin?.name || 'Admin',
        adminEmail: currentAdmin?.email || 'admin@secretpresso.com',
        module,
        action,
        details,
        oldValue,
        newValue,
      };
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 499)]);
    },
    [currentAdmin]
  );

  // Real-time broadcast sync across tabs
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('secretpresso_sync');
      channel.onmessage = (event) => {
        const { type } = event.data || {};
        if (type === 'NEW_ORDER') {
          setOrders(loadStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
          setNotifications(loadStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS));
          if (soundEnabled) playAdminNotificationSound('order');
        } else if (type === 'ORDER_STATUS_CHANGED') {
          setOrders(loadStored(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
        } else if (type === 'PRODUCTS_UPDATED') {
          setProducts(loadStored(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
        } else if (type === 'STORE_STATUS_UPDATED') {
          setStoreSettings(loadStored(STORAGE_KEYS.STORE_SETTINGS, INITIAL_STORE_SETTINGS));
        }
      };
    } catch {
      // BroadcastChannel not available in older browser environments
    }
    return () => {
      channel?.close();
    };
  }, [soundEnabled]);

  const broadcastEvent = useCallback((type: string, payload?: unknown) => {
    try {
      const channel = new BroadcastChannel('secretpresso_sync');
      channel.postMessage({ type, payload });
      channel.close();
    } catch {
      // fallback
    }
  }, []);

  // Compute Store Open status
  const isStoreOpen = React.useMemo(() => {
    if (storeSettings.isOpenManualOverride !== null && storeSettings.isOpenManualOverride !== undefined) {
      return storeSettings.isOpenManualOverride;
    }
    const days: StoreHoursDay['day'][] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const todayName = days[now.getDay()];
    const todayConfig = storeSettings.businessHours.find((h) => h.day === todayName);
    if (!todayConfig || !todayConfig.isOpen) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todayConfig.openTime.split(':').map(Number);
    const [closeH, closeM] = todayConfig.closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }, [storeSettings]);

  // Auth & Roles
  const loginAdmin = useCallback(
    (email: string, role?: AdminRole): boolean => {
      const found = staff.find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (found) {
        if (!found.isActive) {
          showToast({ type: 'error', title: 'Account Deactivated', message: 'Please contact the Super Admin.' });
          return false;
        }
        const updated = { ...found, lastLogin: new Date().toISOString(), role: role || found.role };
        setCurrentAdmin(updated);
        showToast({ type: 'success', title: `Welcome, ${updated.name}`, message: `Authenticated as ${updated.role.replace('_', ' ')}` });
        logActivity('Staff', 'Admin Login', `Logged in with role ${updated.role}`);
        return true;
      }

      // If logging in for the first time with an email
      const newAdmin: AdminUser = {
        id: `staff-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: role || 'SUPER_ADMIN',
        isActive: true,
        lastLogin: new Date().toISOString(),
        permissions: ['all'],
      };
      setStaff((prev) => [...prev, newAdmin]);
      setCurrentAdmin(newAdmin);
      showToast({ type: 'success', title: `Welcome to SECRETpresso`, message: `Provisioned as ${newAdmin.role}` });
      logActivity('Staff', 'New Admin Created', `Created account for ${email}`);
      return true;
    },
    [staff, showToast, logActivity]
  );

  const logoutAdmin = useCallback(() => {
    if (currentAdmin) {
      logActivity('Staff', 'Admin Logout', `${currentAdmin.name} logged out.`);
    }
    setCurrentAdmin(null);
    showToast({ type: 'info', title: 'Signed Out', message: 'Admin session terminated.' });
  }, [currentAdmin, logActivity, showToast]);

  const switchAdminRole = useCallback(
    (role: AdminRole) => {
      if (!currentAdmin) return;
      const updated = { ...currentAdmin, role };
      setCurrentAdmin(updated);
      setStaff((prev) => prev.map((s) => (s.id === currentAdmin.id ? updated : s)));
      showToast({ type: 'info', title: 'Role Switched', message: `Active view set to ${role.replace('_', ' ')}` });
      logActivity('Staff', 'Role Switched', `Switched active role to ${role}`);
    },
    [currentAdmin, showToast, logActivity]
  );

  const addStaffMember = useCallback(
    (member: Omit<AdminUser, 'id'>) => {
      const id = `staff-${Date.now()}`;
      const newStaff: AdminUser = { ...member, id };
      setStaff((prev) => [...prev, newStaff]);
      showToast({ type: 'success', title: 'Staff Member Added', message: `${newStaff.name} assigned as ${newStaff.role}` });
      logActivity('Staff', 'Staff Member Added', `Added ${newStaff.email} as ${newStaff.role}`);
    },
    [showToast, logActivity]
  );

  const updateStaffMember = useCallback(
    (id: string, updates: Partial<AdminUser>) => {
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      showToast({ type: 'success', title: 'Staff Updated', message: 'Permissions & details updated successfully.' });
      logActivity('Staff', 'Staff Updated', `Updated staff record ID ${id}`);
    },
    [showToast, logActivity]
  );

  const toggleStaffActive = useCallback(
    (id: string) => {
      setStaff((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const nextActive = !s.isActive;
            logActivity('Staff', 'Staff Status Toggled', `${s.name} is now ${nextActive ? 'Active' : 'Inactive'}`);
            return { ...s, isActive: nextActive };
          }
          return s;
        })
      );
      showToast({ type: 'info', title: 'Staff Status Changed' });
    },
    [logActivity, showToast]
  );

  // Products CRUD
  const addProduct = useCallback(
    (prodData: Omit<Product, 'id'>) => {
      const id = `prod-${Date.now()}`;
      const newProd: Product = { ...prodData, id };
      setProducts((prev) => {
        const next = [newProd, ...prev];
        fetch('/api/products/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist new product:', err));
        return next;
      });
      showToast({ type: 'success', title: 'Product Created', message: `${newProd.name} added to catalog.` });
      logActivity('Products', 'Created Product', `Created ${newProd.name} (${newProd.sku})`);
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [showToast, logActivity, broadcastEvent]
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      setProducts((prev) => {
        const next = prev.map((p) => {
          if (p.id === id) {
            const updated = { ...p, ...updates };
            logActivity(
              'Products',
              'Updated Product',
              `Updated ${p.name}`,
              JSON.stringify({ price: p.price, stock: p.stock }),
              JSON.stringify({ price: updated.price, stock: updated.stock })
            );
            return updated;
          }
          return p;
        });
        fetch('/api/products/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist product update:', err));
        return next;
      });
      showToast({ type: 'success', title: 'Product Updated', message: 'Catalog changes saved.' });
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [showToast, logActivity, broadcastEvent]
  );

  const duplicateProduct = useCallback(
    (id: string) => {
      const original = products.find((p) => p.id === id);
      if (!original) return;
      const dup: Product = {
        ...original,
        id: `prod-${Date.now()}`,
        name: `${original.name} (Copy)`,
        sku: `${original.sku}-COPY`,
        isAvailable: false,
      };
      setProducts((prev) => {
        const next = [dup, ...prev];
        fetch('/api/products/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist duplicated product:', err));
        return next;
      });
      showToast({ type: 'info', title: 'Product Duplicated', message: `Created draft copy: ${dup.name}` });
      logActivity('Products', 'Duplicated Product', `Copied from ${original.name}`);
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [products, showToast, logActivity, broadcastEvent]
  );

  const toggleProductVisibility = useCallback(
    (id: string) => {
      setProducts((prev) => {
        const next = prev.map((p) => {
          if (p.id === id) {
            const nextVisibility = !p.isAvailable;
            logActivity('Products', 'Visibility Toggled', `${p.name} visibility changed to ${nextVisibility ? 'Visible' : 'Hidden'}`);
            return { ...p, isAvailable: nextVisibility };
          }
          return p;
        });
        fetch('/api/products/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist visibility:', err));
        return next;
      });
      showToast({ type: 'info', title: 'Visibility Updated' });
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [showToast, logActivity, broadcastEvent]
  );

  const archiveProduct = useCallback(
    (id: string) => {
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, isArchived: true, isAvailable: false } : p));
        fetch('/api/products/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist archive:', err));
        return next;
      });
      showToast({ type: 'warning', title: 'Product Archived', message: 'Product hidden from customer store.' });
      logActivity('Products', 'Archived Product', `Archived product ID ${id}`);
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [showToast, logActivity, broadcastEvent]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const target = products.find((p) => p.id === id);
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== id);
        fetch('/api/products/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist delete product:', err));
        return next;
      });
      showToast({ type: 'error', title: 'Product Deleted', message: `${target?.name || 'Item'} removed.` });
      logActivity('Products', 'Deleted Product', `Deleted ${target?.name || id}`);
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [products, showToast, logActivity, broadcastEvent]
  );

  const reorderProducts = useCallback(
    (newProducts: Product[]) => {
      setProducts(newProducts);
      fetch('/api/products/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProducts),
      }).catch((err) => console.error('Failed to persist reorder products:', err));
      showToast({ type: 'success', title: 'Products Reordered', message: 'Catalog order updated successfully.' });
      logActivity('Products', 'Reordered Catalog', 'Updated display order of products');
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [showToast, logActivity, broadcastEvent]
  );

  const moveProductOrder = useCallback(
    (productId: string, direction: 'up' | 'down') => {
      setProducts((prev) => {
        const index = prev.findIndex((p) => p.id === productId);
        if (index === -1) return prev;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[newIndex];
        copy[newIndex] = temp;
        return copy;
      });
      broadcastEvent('PRODUCTS_UPDATED');
    },
    [broadcastEvent]
  );

  // Orders & Inventory movement
  const updateOrderStatus = useCallback(
    (orderId: string, newStatus: OrderStatus, note?: string) => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === orderId) {
            const now = new Date().toISOString();
            const updatedTimeline = [
              ...ord.timeline,
              {
                status: newStatus,
                timestamp: now,
                note: note || undefined,
                actor: currentAdmin?.name || 'Admin',
              },
            ];
            const updatedOrder: Order = {
              ...ord,
              orderStatus: newStatus,
              updatedAt: now,
              timeline: updatedTimeline,
            };

            // If order cancelled or refunded, restore stock
            if (newStatus === 'CANCELLED' || newStatus === 'REFUNDED') {
              ord.items.forEach((item) => {
                setProducts((prodList) =>
                  prodList.map((p) => (p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p))
                );
              });
            }

            logActivity('Orders', `Order ${newStatus}`, `Order #${ord.orderNumber} status changed to ${newStatus}`);
            return updatedOrder;
          }
          return ord;
        })
      );

      if (newStatus === 'READY' && soundEnabled) {
        playAdminNotificationSound('kitchen');
      }

      showToast({ type: 'success', title: 'Order Status Updated', message: `Moved to ${newStatus.replace('_', ' ')}` });
      broadcastEvent('ORDER_STATUS_CHANGED', { orderId, newStatus });
    },
    [currentAdmin, soundEnabled, showToast, logActivity, broadcastEvent]
  );

  const placeOrder = useCallback(
    (input: {
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      customerAddress: string;
      pincode: string;
      items: OrderItem[];
      notes?: string;
      couponCode?: string;
      paymentMethod: Order['paymentMethod'];
    }): Order => {
      const orderNumber = `SP-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      const subtotal = input.items.reduce((sum, item) => sum + item.subtotal, 0);
      let discount = 0;
      if (input.couponCode) {
        const foundCoupon = coupons.find((c) => c.code.toUpperCase() === input.couponCode?.toUpperCase() && c.isActive);
        if (foundCoupon) {
          if (foundCoupon.discountType === 'PERCENTAGE') {
            discount = Math.min((subtotal * foundCoupon.discountValue) / 100, foundCoupon.maximumDiscount || Infinity);
          } else if (foundCoupon.discountType === 'FLAT') {
            discount = foundCoupon.discountValue;
          } else if (foundCoupon.discountType === 'FREE_DELIVERY') {
            discount = storeSettings.defaultDeliveryFee;
          }
        }
      }

      const deliveryFee = subtotal >= storeSettings.freeDeliveryThreshold ? 0 : storeSettings.defaultDeliveryFee;
      const taxableAmount = Math.max(0, subtotal - discount);
      const taxes = parseFloat(((taxableAmount * storeSettings.taxRatePercent) / 100).toFixed(2));
      const finalAmount = parseFloat((taxableAmount + deliveryFee + taxes).toFixed(2));

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        createdAt: now,
        updatedAt: now,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        customerAddress: input.customerAddress,
        pincode: input.pincode,
        items: input.items,
        subtotal,
        discount,
        couponCode: input.couponCode,
        deliveryFee,
        taxes,
        finalAmount,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'PAID',
        orderStatus: 'NEW',
        notes: input.notes,
        estimatedDeliveryTime: `${storeSettings.estimatedDeliveryTimeMinutes} mins`,
        timeline: [{ status: 'NEW', timestamp: now, actor: 'Customer Checkout' }],
      };

      // 1. Deduct Product stock
      setProducts((prev) =>
        prev.map((p) => {
          const matchingItem = input.items.find((it) => it.productId === p.id);
          if (matchingItem) {
            const nextStock = Math.max(0, p.stock - matchingItem.quantity);
            return { ...p, stock: nextStock };
          }
          return p;
        })
      );

      // 2. Deduct raw inventory materials automatically
      setInventory((prev) =>
        prev.map((inv) => {
          let deduction = 0;
          if (inv.category === 'Packaging') deduction = input.items.reduce((s, it) => s + it.quantity, 0);
          if (inv.category === 'Beans') deduction = 0.02 * input.items.length; // ~20g per cup
          if (deduction > 0) {
            const nextCurrent = Math.max(0, parseFloat((inv.currentStock - deduction).toFixed(2)));
            return {
              ...inv,
              currentStock: nextCurrent,
              availableStock: Math.max(0, parseFloat((nextCurrent - inv.reservedStock).toFixed(2))),
              status: nextCurrent <= inv.minimumStock ? 'LOW_STOCK' : 'IN_STOCK',
            };
          }
          return inv;
        })
      );

      // 3. Record customer in CRM
      setCustomers((prev) => {
        const existing = prev.find((c) => c.email.toLowerCase() === input.customerEmail.toLowerCase());
        if (existing) {
          return prev.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  totalOrders: c.totalOrders + 1,
                  totalSpent: c.totalSpent + finalAmount,
                  lastOrderDate: now,
                  segment: c.totalOrders >= 5 ? 'VIP' : 'Returning Customer',
                }
              : c
          );
        } else {
          const newCust: Customer = {
            id: `cust-${Date.now()}`,
            name: input.customerName,
            email: input.customerEmail,
            phone: input.customerPhone,
            totalOrders: 1,
            totalSpent: finalAmount,
            lastOrderDate: now,
            registrationDate: now.split('T')[0],
            segment: 'New Customer',
            address: input.customerAddress,
            pincode: input.pincode,
          };
          return [newCust, ...prev];
        }
      });

      // 4. Update coupon usage
      if (input.couponCode) {
        setCoupons((prev) =>
          prev.map((c) => (c.code.toUpperCase() === input.couponCode?.toUpperCase() ? { ...c, usageCount: c.usageCount + 1 } : c))
        );
      }

      // 5. Append order & create notification
      setOrders((prev) => [newOrder, ...prev]);

      const newNotif: AdminNotification = {
        id: `notif-${Date.now()}`,
        title: `Incoming Order #${orderNumber}`,
        message: `${input.customerName} ordered ${input.items.length} items (₹${finalAmount})`,
        type: 'ORDER',
        createdAt: now,
        isRead: false,
        actionUrl: 'orders',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      logActivity('Orders', 'New Order Placed', `Order #${orderNumber} for ₹${finalAmount}`);

      if (soundEnabled) {
        playAdminNotificationSound('order');
      }

      broadcastEvent('NEW_ORDER', newOrder);
      return newOrder;
    },
    [coupons, storeSettings, soundEnabled, logActivity, broadcastEvent]
  );

  const cancelOrder = useCallback(
    (orderId: string, reason: string) => {
      updateOrderStatus(orderId, 'CANCELLED', `Cancelled: ${reason}`);
      showToast({ type: 'warning', title: 'Order Cancelled', message: `Stock restored to catalog.` });
    },
    [updateOrderStatus, showToast]
  );

  const refundOrder = useCallback(
    (orderId: string, reason: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'REFUNDED', orderStatus: 'REFUNDED' } : o))
      );
      updateOrderStatus(orderId, 'REFUNDED', `Refund issued: ${reason}`);
      showToast({ type: 'info', title: 'Order Refunded', message: `Payment status marked as Refunded.` });
    },
    [updateOrderStatus, showToast]
  );

  const assignDeliveryPartner = useCallback(
    (orderId: string, partnerName: string, partnerPhone: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, deliveryPartnerName: partnerName, deliveryPartnerPhone: partnerPhone } : o))
      );
      showToast({ type: 'success', title: 'Driver Assigned', message: `${partnerName} assigned to order.` });
      logActivity('Orders', 'Driver Assigned', `Assigned ${partnerName} to ${orderId}`);
    },
    [showToast, logActivity]
  );

  // Inventory & Stock Movements
  const adjustStock = useCallback(
    (itemId: string, quantityChange: number, reason: StockMovement['reason'], note?: string) => {
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const nextCurrent = Math.max(0, parseFloat((item.currentStock + quantityChange).toFixed(2)));
            const nextAvailable = Math.max(0, parseFloat((nextCurrent - item.reservedStock).toFixed(2)));
            let status: InventoryItem['status'] = 'IN_STOCK';
            if (nextCurrent <= 0) status = 'OUT_FOR_STOCK';
            else if (nextCurrent <= item.minimumStock) status = 'LOW_STOCK';

            // Record movement
            const movement: StockMovement = {
              id: `mov-${Date.now()}`,
              inventoryItemId: item.id,
              itemName: item.name,
              timestamp: new Date().toISOString(),
              adminName: currentAdmin?.name || 'Admin',
              quantityChange,
              resultingStock: nextCurrent,
              reason,
              note,
            };
            setStockMovements((sm) => [movement, ...sm]);

            logActivity('Inventory', `Adjusted Stock: ${item.name}`, `${quantityChange >= 0 ? '+' : ''}${quantityChange} ${item.unit} (${reason})`);
            return {
              ...item,
              currentStock: nextCurrent,
              availableStock: nextAvailable,
              status,
              lastRestocked: quantityChange > 0 ? new Date().toISOString().split('T')[0] : item.lastRestocked,
            };
          }
          return item;
        })
      );
      showToast({ type: 'success', title: 'Stock Updated', message: 'Inventory levels and movement history updated.' });
    },
    [currentAdmin, showToast, logActivity]
  );

  const addInventoryItem = useCallback(
    (item: Omit<InventoryItem, 'id'>) => {
      const id = `inv-${Date.now()}`;
      const newItem: InventoryItem = { ...item, id };
      setInventory((prev) => [newItem, ...prev]);
      showToast({ type: 'success', title: 'Raw Material Created', message: `${newItem.name} added.` });
      logActivity('Inventory', 'Added Inventory Item', `Created raw material ${newItem.name}`);
    },
    [showToast, logActivity]
  );

  const updateInventoryItem = useCallback(
    (id: string, updates: Partial<InventoryItem>) => {
      setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      showToast({ type: 'success', title: 'Item Updated', message: 'Inventory parameters saved.' });
      logActivity('Inventory', 'Updated Item', `Modified inventory item ID ${id}`);
    },
    [showToast, logActivity]
  );

  const deleteInventoryItem = useCallback(
    (id: string) => {
      setInventory((prev) => prev.filter((item) => item.id !== id));
      showToast({ type: 'error', title: 'Item Removed' });
      logActivity('Inventory', 'Deleted Item', `Removed inventory item ID ${id}`);
    },
    [showToast, logActivity]
  );

  // Suppliers
  const addSupplier = useCallback(
    (supplier: Omit<Supplier, 'id'>) => {
      const id = `sup-${Date.now()}`;
      const newSup: Supplier = { ...supplier, id };
      setSuppliers((prev) => [newSup, ...prev]);
      showToast({ type: 'success', title: 'Supplier Onboarded', message: newSup.company });
      logActivity('Inventory', 'Added Supplier', `Added supplier ${newSup.company}`);
    },
    [showToast, logActivity]
  );

  const updateSupplier = useCallback(
    (id: string, updates: Partial<Supplier>) => {
      setSuppliers((prev) => prev.map((sup) => (sup.id === id ? { ...sup, ...updates } : sup)));
      showToast({ type: 'success', title: 'Supplier Updated' });
      logActivity('Inventory', 'Updated Supplier', `Updated supplier ID ${id}`);
    },
    [showToast, logActivity]
  );

  const createRestockRecord = useCallback(
    (supplierId: string, items: { itemId: string; quantity: number }[], notes: string) => {
      const sup = suppliers.find((s) => s.id === supplierId);
      items.forEach((it) => {
        adjustStock(it.itemId, it.quantity, 'Purchase', `PO from ${sup?.company || 'Supplier'}: ${notes}`);
      });
      showToast({ type: 'success', title: 'Restock PO Processed', message: `Updated ${items.length} raw inventory batches.` });
    },
    [suppliers, adjustStock, showToast]
  );

  // Customer CRM
  const updateCustomerNotes = useCallback(
    (customerId: string, notes: string) => {
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, adminNotes: notes } : c)));
      showToast({ type: 'success', title: 'CRM Note Saved' });
      logActivity('Customers' as unknown as ActivityLog['module'], 'Customer Note Updated', `Updated notes for customer ID ${customerId}`);
    },
    [showToast, logActivity]
  );

  const updateCustomerSegment = useCallback(
    (customerId: string, segment: Customer['segment']) => {
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, segment } : c)));
      showToast({ type: 'info', title: 'Customer Segment Changed', message: `Moved to ${segment}` });
    },
    [showToast]
  );

  // Coupons
  const createCoupon = useCallback(
    (data: Omit<Coupon, 'id' | 'usageCount'>) => {
      const id = `coup-${Date.now()}`;
      const newCoupon: Coupon = { ...data, id, usageCount: 0 };
      setCoupons((prev) => [newCoupon, ...prev]);
      showToast({ type: 'success', title: 'Coupon Created', message: `Code: ${newCoupon.code}` });
      logActivity('Coupons', 'Created Coupon', `Created coupon ${newCoupon.code}`);
    },
    [showToast, logActivity]
  );

  const toggleCouponStatus = useCallback(
    (id: string) => {
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
      showToast({ type: 'info', title: 'Coupon Status Updated' });
      logActivity('Coupons', 'Toggled Coupon Status', `Toggled coupon ID ${id}`);
    },
    [showToast, logActivity]
  );

  const deleteCoupon = useCallback(
    (id: string) => {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showToast({ type: 'warning', title: 'Coupon Deleted' });
      logActivity('Coupons', 'Deleted Coupon', `Deleted coupon ID ${id}`);
    },
    [showToast, logActivity]
  );

  const validateCoupon = useCallback(
    (code: string, subtotal: number): { valid: boolean; discount: number; message: string } => {
      const cleanCode = code.trim().toUpperCase();
      const coup = coupons.find((c) => c.code.toUpperCase() === cleanCode);
      if (!coup) {
        return { valid: false, discount: 0, message: 'Invalid coupon code.' };
      }
      if (!coup.isActive) {
        return { valid: false, discount: 0, message: 'This coupon is currently inactive.' };
      }
      if (subtotal < coup.minimumOrder) {
        return { valid: false, discount: 0, message: `Minimum cart value of ₹${coup.minimumOrder} required.` };
      }
      if (coup.usageCount >= coup.usageLimit) {
        return { valid: false, discount: 0, message: 'This coupon has reached its maximum usage limit.' };
      }

      let discount = 0;
      if (coup.discountType === 'PERCENTAGE') {
        discount = Math.min((subtotal * coup.discountValue) / 100, coup.maximumDiscount || Infinity);
      } else if (coup.discountType === 'FLAT') {
        discount = coup.discountValue;
      } else if (coup.discountType === 'FREE_DELIVERY') {
        discount = storeSettings.defaultDeliveryFee;
      }

      return { valid: true, discount, message: `Coupon applied! You save ₹${discount}` };
    },
    [coupons, storeSettings]
  );

  // Reviews
  const moderateReview = useCallback(
    (id: string, status: Review['status']) => {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      showToast({ type: 'success', title: `Review ${status.toLowerCase()}`, message: 'Moderation status updated.' });
      logActivity('Reviews', 'Review Moderated', `Review ID ${id} set to ${status}`);
    },
    [showToast, logActivity]
  );

  const addReview = useCallback(
    (review: Omit<Review, 'id' | 'createdAt' | 'status'>) => {
      const id = `rev-${Date.now()}`;
      const newReview: Review = {
        ...review,
        id,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'PENDING',
      };
      setReviews((prev) => [newReview, ...prev]);
      showToast({ type: 'info', title: 'Review Submitted', message: 'Your review has been queued for moderation.' });
    },
    [showToast]
  );

  // Website CMS Draft, Preview & Revisions
  const updateDraftHeroSlides = useCallback((slides: HeroSlide[]) => {
    setDraftHeroSlides(slides);
    setHasDraftChanges(true);
  }, []);

  const updateDraftSections = useCallback((sec: WebsiteSectionConfig[]) => {
    setDraftSections(sec);
    setHasDraftChanges(true);
  }, []);

  const publishWebsiteChanges = useCallback(
    (
      description: string = 'Website sections and banners updated',
      customHeroSlides?: HeroSlide[],
      customSections?: WebsiteSectionConfig[]
    ) => {
      const nextHero = customHeroSlides || draftHeroSlides;
      const nextSections = customSections || draftSections;

      // 1. Create historical revision before publishing
      const rev: WebsiteRevision = {
        id: `rev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminName: currentAdmin?.name || 'Admin',
        description,
        snapshot: { heroSlides: nextHero, sections: nextSections },
      };
      setWebsiteRevisions((prev) => [rev, ...prev.slice(0, 24)]);

      // 2. Commit draft to live state
      setHeroSlides(nextHero);
      setSections(nextSections);
      setDraftHeroSlides(nextHero);
      setDraftSections(nextSections);
      setHasDraftChanges(false);

      // 3. Persist permanently to server storage database
      fetch('/api/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSections),
      }).catch((err) => console.error('Failed to persist sections to server:', err));

      fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextHero),
      }).catch((err) => console.error('Failed to persist hero slides to server:', err));

      showToast({
        type: 'success',
        title: 'Changes Published Live',
        message: 'Customer website updated immediately.',
      });
      logActivity('Website', 'Published CMS Changes', description);
    },
    [currentAdmin, draftHeroSlides, draftSections, showToast, logActivity]
  );

  const discardWebsiteDraft = useCallback(() => {
    setDraftHeroSlides(heroSlides);
    setDraftSections(sections);
    setHasDraftChanges(false);
    showToast({ type: 'info', title: 'Draft Discarded', message: 'Reset to live website configuration.' });
  }, [heroSlides, sections, showToast]);

  const restoreWebsiteRevision = useCallback(
    (revisionId: string) => {
      const rev = websiteRevisions.find((r) => r.id === revisionId);
      if (!rev) return;
      setHeroSlides(rev.snapshot.heroSlides);
      setSections(rev.snapshot.sections);
      setDraftHeroSlides(rev.snapshot.heroSlides);
      setDraftSections(rev.snapshot.sections);
      setHasDraftChanges(false);
      showToast({ type: 'success', title: 'Revision Restored', message: `Restored snapshot from ${new Date(rev.timestamp).toLocaleString()}` });
      logActivity('Website', 'Restored Revision', `Restored revision ${rev.id}`);
    },
    [websiteRevisions, showToast, logActivity]
  );

  // Section Management
  const addSection = useCallback(
    async (secData: Omit<WebsiteSectionConfig, 'id'>): Promise<WebsiteSectionConfig> => {
      // 1. Generate unique permanent section ID
      const uniqueId = `section_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // 2. Assign displayOrder = highest existing displayOrder + 1
      const maxOrder = draftSections.reduce(
        (max, s) => Math.max(max, s.displayOrder ?? s.order ?? 0),
        0
      );
      const assignedOrder = (secData.displayOrder && secData.displayOrder > maxOrder)
        ? secData.displayOrder
        : (secData.order && secData.order > maxOrder)
        ? secData.order
        : maxOrder + 1;

      const newSec: WebsiteSectionConfig = {
        ...secData,
        id: uniqueId,
        sectionKey: secData.sectionKey || uniqueId,
        displayOrder: assignedOrder,
        order: assignedOrder,
        type: secData.sectionType || secData.type || 'products',
        sectionType: secData.sectionType || (secData.type as any) || 'products',
        displayStyle: secData.displayStyle || 'slider',
        isVisible: secData.isVisible !== undefined ? secData.isVisible : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        // 3. Save to persistent database
        const res = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSec),
        });

        // 4. Confirm database write
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const savedRecord = await res.json();

        // 5. Reload section list from database (database is source of truth)
        const listRes = await fetch('/api/sections');
        if (listRes.ok) {
          const freshSections = await listRes.json();
          if (Array.isArray(freshSections)) {
            setSections(freshSections);
            setDraftSections(freshSections);
            saveStored(STORAGE_KEYS.SECTIONS, freshSections);
          }
        } else {
          const nextSections = [...draftSections, savedRecord || newSec];
          setSections(nextSections);
          setDraftSections(nextSections);
          saveStored(STORAGE_KEYS.SECTIONS, nextSections);
        }
      } catch (err) {
        console.error('Failed to persist section to server:', err);
        const nextSections = [...draftSections, newSec];
        setSections(nextSections);
        setDraftSections(nextSections);
        saveStored(STORAGE_KEYS.SECTIONS, nextSections);
      }

      // 6. Show: "Section saved successfully" (PART 7)
      showToast({
        type: 'success',
        title: 'Section saved successfully',
        message: `${newSec.name} has been published to the storefront.`,
      });
      logActivity('Website', 'Created Section', `Created section ${newSec.name}`);
      broadcastEvent('WEBSITE_UPDATED');
      return newSec;
    },
    [draftSections, showToast, logActivity, broadcastEvent]
  );

  const updateSection = useCallback(
    async (id: string, updates: Partial<WebsiteSectionConfig>): Promise<void> => {
      const nextSections = draftSections.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
      updateDraftSections(nextSections);
      setSections(nextSections);
      saveStored(STORAGE_KEYS.SECTIONS, nextSections);
      try {
        const res = await fetch(`/api/sections/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const listRes = await fetch('/api/sections');
          if (listRes.ok) {
            const freshSections = await listRes.json();
            if (Array.isArray(freshSections)) {
              setSections(freshSections);
              setDraftSections(freshSections);
              saveStored(STORAGE_KEYS.SECTIONS, freshSections);
            }
          }
        }
      } catch (err) {
        console.error('Failed to persist updated sections:', err);
      }
      showToast({ type: 'success', title: 'Section saved successfully' });
      broadcastEvent('WEBSITE_UPDATED');
    },
    [draftSections, updateDraftSections, showToast, broadcastEvent]
  );

  const deleteSection = useCallback(
    async (id: string): Promise<void> => {
      const targetSec = draftSections.find((s) => s.id === id);
      if (targetSec?.sectionKey === 'coffeeFlavours' || targetSec?.id === 'sec-2') {
        showToast({
          type: 'error',
          title: 'Protected Section',
          message: 'Coffee Flavours is the core menu and cannot be deleted.',
        });
        return;
      }
      const nextSections = draftSections.filter((s) => s.id !== id);
      nextSections.forEach((s, idx) => {
        s.order = idx + 1;
        s.displayOrder = idx + 1;
      });
      updateDraftSections(nextSections);
      setSections(nextSections);
      saveStored(STORAGE_KEYS.SECTIONS, nextSections);

      // SAFETY: Products inside this section will not be deleted. They become unassigned.
      setProducts((prev) => {
        const updatedProds = prev.map((p) => (p.sectionId === id ? { ...p, sectionId: undefined } : p));
        fetch('/api/products/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProds),
        }).catch((err) => console.error('Failed to persist unassigned products:', err));
        return updatedProds;
      });

      try {
        await fetch(`/api/sections/${id}`, { method: 'DELETE' });
        const listRes = await fetch('/api/sections');
        if (listRes.ok) {
          const freshSections = await listRes.json();
          if (Array.isArray(freshSections)) {
            setSections(freshSections);
            setDraftSections(freshSections);
            saveStored(STORAGE_KEYS.SECTIONS, freshSections);
          }
        }
      } catch (err) {
        console.error('Failed to delete section on server:', err);
      }

      showToast({
        type: 'info',
        title: 'Section Deleted',
        message: 'Products in this section remain safe and unassigned.',
      });
      logActivity('Website', 'Deleted Section', `Deleted section ${id}`);
      broadcastEvent('WEBSITE_UPDATED');
    },
    [draftSections, updateDraftSections, showToast, logActivity, broadcastEvent]
  );

  const reorderSections = useCallback(
    async (newSections: WebsiteSectionConfig[]): Promise<void> => {
      newSections.forEach((s, idx) => (s.order = idx + 1));
      updateDraftSections(newSections);
      setSections(newSections);
      saveStored(STORAGE_KEYS.SECTIONS, newSections);
      try {
        await fetch('/api/sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSections),
        });
      } catch (err) {
        console.error('Failed to save reordered sections:', err);
      }
      showToast({ type: 'success', title: 'Section Order Saved' });
    },
    [updateDraftSections, showToast]
  );

  // Category Management
  const addCategory = useCallback(
    async (catData: Omit<Category, 'id'>): Promise<Category> => {
      const id = `cat-${Date.now()}`;
      const newCat: Category = { ...catData, id };
      setCategories((prev) => {
        const next = [...prev, newCat];
        saveStored(STORAGE_KEYS.CATEGORIES, next);
        return next;
      });
      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCat),
        });
      } catch (err) {
        console.error('Failed to persist category to server:', err);
      }
      showToast({ type: 'success', title: 'Category Created', message: `${newCat.name} category created.` });
      logActivity('Products', 'Created Category', `Created category ${newCat.name}`);
      return newCat;
    },
    [showToast, logActivity]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>): Promise<void> => {
      let updatedCat: Category | null = null;
      setCategories((prev) => {
        const next = prev.map((c) => {
          if (c.id === id) {
            updatedCat = { ...c, ...updates };
            return updatedCat;
          }
          return c;
        });
        saveStored(STORAGE_KEYS.CATEGORIES, next);
        return next;
      });
      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCat || { id, ...updates }),
        });
      } catch (err) {
        console.error('Failed to update category on server:', err);
      }
      showToast({ type: 'success', title: 'Category Updated' });
    },
    [showToast]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveStored(STORAGE_KEYS.CATEGORIES, next);
        return next;
      });
      // Safety: products are not deleted! We leave them intact.
      try {
        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete category on server:', err);
      }
      showToast({ type: 'info', title: 'Category Deleted', message: 'Products in this category were not deleted.' });
      logActivity('Products', 'Deleted Category', `Deleted category ID ${id}`);
    },
    [showToast, logActivity]
  );

  // Store Settings & Control
  const setStoreOpenManualOverride = useCallback(
    (override: boolean | null) => {
      setStoreSettings((prev) => {
        const next = { ...prev, isOpenManualOverride: override };
        const statusText = override === true ? 'FORCE OPEN' : override === false ? 'FORCE CLOSED' : 'AUTO SCHEDULE';
        logActivity('Store Control', 'Store Status Override', `Store set to ${statusText}`);
        return next;
      });
      showToast({
        type: override === false ? 'warning' : 'success',
        title: override === false ? 'Store CLOSED' : override === true ? 'Store OPEN' : 'Schedule Resumed',
        message: override === false ? 'Customers cannot place orders until opened.' : 'Online orders accepting now.',
      });
      broadcastEvent('STORE_STATUS_UPDATED');
    },
    [showToast, logActivity, broadcastEvent]
  );

  const updateStoreSettings = useCallback(
    (updates: Partial<StoreSettings>) => {
      setStoreSettings((prev) => ({ ...prev, ...updates }));
      showToast({ type: 'success', title: 'Settings Saved', message: 'Store parameters and operational rules updated.' });
      logActivity('Store Control', 'Updated Store Settings', 'Modified business info or delivery rules');
      broadcastEvent('STORE_STATUS_UPDATED');
    },
    [showToast, logActivity, broadcastEvent]
  );

  // Delivery
  const updateDeliveryZone = useCallback(
    (id: string, updates: Partial<DeliveryZone>) => {
      setDeliveryZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...updates } : z)));
      showToast({ type: 'success', title: 'Delivery Zone Updated' });
    },
    [showToast]
  );

  const addDeliveryZone = useCallback(
    (zone: Omit<DeliveryZone, 'id'>) => {
      const id = `zone-${Date.now()}`;
      setDeliveryZones((prev) => [...prev, { ...zone, id }]);
      showToast({ type: 'success', title: 'Delivery Zone Added' });
    },
    [showToast]
  );

  const updateDeliveryPartnerStatus = useCallback(
    (id: string, status: DeliveryPartner['status']) => {
      setDeliveryPartners((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      showToast({ type: 'info', title: 'Partner Status Updated', message: `Status: ${status}` });
    },
    [showToast]
  );

  const addDeliveryPartner = useCallback(
    (partner: Omit<DeliveryPartner, 'id' | 'activeOrdersCount'>) => {
      const id = `part-${Date.now()}`;
      setDeliveryPartners((prev) => [...prev, { ...partner, id, activeOrdersCount: 0 }]);
      showToast({ type: 'success', title: 'Delivery Partner Added', message: partner.name });
    },
    [showToast]
  );

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    showToast({ type: 'info', title: 'Notifications Cleared' });
  }, [showToast]);

  // Abandoned Carts
  const sendCartRecoveryReminder = useCallback(
    (cartId: string) => {
      setAbandonedCarts((prev) => prev.map((c) => (c.id === cartId ? { ...c, recovered: true } : c)));
      showToast({ type: 'success', title: 'Recovery Alert Sent', message: 'Simulated email/SMS sent with 10% coupon.' });
    },
    [showToast]
  );

  // Customer Shopping Cart
  const addToCart = useCallback(
    (item: OrderItem) => {
      setCart((prev) => {
        const existingIndex = prev.findIndex((i) => i.productId === item.productId && JSON.stringify(i.customization) === JSON.stringify(item.customization));
        if (existingIndex > -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + item.quantity,
            subtotal: (next[existingIndex].quantity + item.quantity) * next[existingIndex].price,
          };
          return next;
        }
        return [...prev, item];
      });
      showToast({ type: 'success', title: 'Added to Coffee Bag', message: item.productName });
    },
    [showToast]
  );

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity, subtotal: quantity * i.price } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Media Management (Server Persistent via mediaStorageService)
  const uploadMedia = useCallback(
    async (
      file: File,
      mediaType: MediaType,
      targetId?: string,
      isPrimary?: boolean,
      altText?: string,
      onProgress?: (progress: number) => void
    ): Promise<MediaItem> => {
      const isProduct = mediaType === 'product' || mediaType === 'products';
      const isHeroOrBanner =
        mediaType === 'hero' || mediaType === 'banner' || mediaType === 'banners';

      const item = await mediaStorageService.upload(file, {
        mediaType,
        productId: isProduct ? targetId : undefined,
        bannerId: isHeroOrBanner ? targetId : undefined,
        isPrimary,
        altText,
        onProgress,
      });

      // Verification check on server
      const exists = await mediaStorageService.exists(item.url);
      if (!exists) {
        throw new Error('Image write verification failed on server storage.');
      }

      setMediaItems((prev) => [item, ...prev.filter((m) => m.id !== item.id)]);

      // If attached to a product, sync directly into product catalog AND persist to server database
      if (targetId && isProduct) {
        setProducts((prev) => {
          const next = prev.map((p) => {
            if (p.id === targetId) {
              if (isPrimary || !p.imageUrl) {
                return {
                  ...p,
                  imageUrl: item.url,
                  storagePath: item.filePath,
                };
              } else {
                const addImages = p.additionalImages || [];
                if (!addImages.includes(item.url)) {
                  return {
                    ...p,
                    additionalImages: [...addImages, item.url],
                  };
                }
              }
            }
            return p;
          });
          // Persist catalog to server immediately
          fetch('/api/products/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          }).catch((err) => console.error('Failed to sync products after image upload:', err));
          return next;
        });
      }

      // If attached to a hero slide or section, sync BOTH live and draft states immediately
      if (targetId && isHeroOrBanner) {
        if (mediaType === 'hero' || targetId.startsWith('hero-')) {
          setHeroSlides((prev) => {
            const next = prev.map((s) => (s.id === targetId ? { ...s, imageUrl: item.url, storagePath: item.filePath } : s));
            fetch('/api/hero-slides', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(next),
            }).catch((err) => console.error('Failed to persist hero slides:', err));
            return next;
          });
          setDraftHeroSlides((prev) =>
            prev.map((s) => (s.id === targetId ? { ...s, imageUrl: item.url, storagePath: item.filePath } : s))
          );
        } else {
          setSections((prev) => {
            const next = prev.map((s) =>
              s.id === targetId || s.sectionKey === targetId
                ? { ...s, imageUrl: item.url, storagePath: item.filePath }
                : s
            );
            fetch('/api/sections', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(next),
            }).catch((err) => console.error('Failed to persist sections:', err));
            return next;
          });
          setDraftSections((prev) =>
            prev.map((s) =>
              s.id === targetId || s.sectionKey === targetId
                ? { ...s, imageUrl: item.url, storagePath: item.filePath }
                : s
            )
          );
        }
      }

      logActivity('Website', 'Upload Media', `Uploaded ${file.name} to persistent server storage`);
      showToast({
        type: 'success',
        title: 'Image uploaded successfully',
        message: 'Image uploaded successfully',
      });
      return item;
    },
    [logActivity, showToast]
  );

  const replaceMedia = useCallback(
    async (
      oldMediaId: string,
      newFile: File,
      onProgress?: (progress: number) => void
    ): Promise<MediaItem> => {
      const existing = mediaItems.find((m) => m.id === oldMediaId || m.mediaId === oldMediaId);

      const updated = await mediaStorageService.replace(oldMediaId, newFile, {
        mediaType: existing?.mediaType || 'general',
        productId: existing?.productId,
        bannerId: existing?.bannerId,
        isPrimary: existing?.isPrimary,
        altText: existing?.altText,
        onProgress,
      });

      // Verification check on server
      const exists = await mediaStorageService.exists(updated.url);
      if (!exists) {
        throw new Error('Image replacement verification failed on server storage.');
      }

      setMediaItems((prev) =>
        prev.map((m) => (m.id === oldMediaId || m.mediaId === oldMediaId ? updated : m))
      );

      // Sync into products if matched
      if (existing) {
        setProducts((prev) => {
          const next = prev.map((p) => {
            if (p.id === existing.productId || p.imageUrl === existing.url) {
              const wasPrimary = p.imageUrl === existing.url || existing.isPrimary;
              if (wasPrimary) {
                return { ...p, imageUrl: updated.url, storagePath: updated.filePath };
              }
              const addImages = (p.additionalImages || []).map((img) =>
                img === existing.url ? updated.url : img
              );
              return { ...p, additionalImages: addImages };
            }
            return p;
          });
          fetch('/api/products/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          }).catch((err) => console.error('Failed to persist products after replace:', err));
          return next;
        });

        // Sync into hero slides and sections in both live and draft
        setHeroSlides((prev) => {
          const next = prev.map((s) =>
            s.imageUrl === existing.url || s.id === existing.bannerId
              ? { ...s, imageUrl: updated.url, storagePath: updated.filePath }
              : s
          );
          fetch('/api/hero-slides', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          }).catch((err) => console.error('Failed to persist hero slides after replace:', err));
          return next;
        });
        setDraftHeroSlides((prev) =>
          prev.map((s) =>
            s.imageUrl === existing.url || s.id === existing.bannerId
              ? { ...s, imageUrl: updated.url, storagePath: updated.filePath }
              : s
          )
        );

        setSections((prev) => {
          const next = prev.map((s) =>
            s.imageUrl === existing.url || s.id === existing.bannerId
              ? { ...s, imageUrl: updated.url, storagePath: updated.filePath }
              : s
          );
          fetch('/api/sections', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          }).catch((err) => console.error('Failed to persist sections after replace:', err));
          return next;
        });
        setDraftSections((prev) =>
          prev.map((s) =>
            s.imageUrl === existing.url || s.id === existing.bannerId
              ? { ...s, imageUrl: updated.url, storagePath: updated.filePath }
              : s
          )
        );
      }

      logActivity('Website', 'Replace Media', `Replaced media ${existing?.fileName || oldMediaId} with ${newFile.name}`);
      showToast({
        type: 'success',
        title: 'Image uploaded successfully',
        message: 'Image uploaded successfully',
      });
      return updated;
    },
    [mediaItems, logActivity, showToast]
  );

  const deleteMedia = useCallback(
    async (mediaId: string): Promise<void> => {
      const existing = mediaItems.find(
        (m) =>
          m.id === mediaId ||
          m.mediaId === mediaId ||
          m.url === mediaId ||
          m.filePath === mediaId ||
          m.fileName === mediaId
      );

      const resolvedId = existing?.id || mediaId;
      const targetUrl = existing?.url || (mediaId.startsWith('/') ? mediaId : '');

      try {
        await mediaStorageService.delete(resolvedId);
      } catch (err: any) {
        console.warn('Backend delete warning:', err);
      }

      setMediaItems((prev) =>
        prev.filter(
          (m) =>
            m.id !== mediaId &&
            m.mediaId !== mediaId &&
            m.url !== mediaId &&
            (existing ? m.id !== existing.id && m.url !== existing.url : true)
        )
      );

      // Clean up references in products and persist to server
      setProducts((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          let newImg = p.imageUrl;
          let newAdd = p.additionalImages || [];

          if (
            (existing && p.imageUrl === existing.url) ||
            p.imageUrl === mediaId ||
            (targetUrl && p.imageUrl === targetUrl)
          ) {
            newImg = newAdd.length > 0 ? newAdd[0] : '';
            newAdd = newAdd.filter((u) => u !== newImg);
            changed = true;
          }
          if (
            (existing && newAdd.includes(existing.url)) ||
            newAdd.includes(mediaId) ||
            (targetUrl && newAdd.includes(targetUrl))
          ) {
            newAdd = newAdd.filter(
              (u) =>
                u !== mediaId &&
                (!existing || u !== existing.url) &&
                (!targetUrl || u !== targetUrl)
            );
            changed = true;
          }
          return changed ? { ...p, imageUrl: newImg, additionalImages: newAdd } : p;
        });

        if (changed) {
          fetch('/api/products/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          }).catch((err) => console.error('Failed to sync products after media delete:', err));
        }
        return next;
      });

      // Clean up references in hero slides / sections (both live and draft)
      const clearUrlMatch = (url?: string) =>
        Boolean(
          url &&
            (url === mediaId ||
              (existing && url === existing.url) ||
              (targetUrl && url === targetUrl))
        );

      setHeroSlides((prev) => {
        const next = prev.map((s) => (clearUrlMatch(s.imageUrl) ? { ...s, imageUrl: '' } : s));
        fetch('/api/hero-slides', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist hero slides after delete:', err));
        return next;
      });
      setDraftHeroSlides((prev) =>
        prev.map((s) => (clearUrlMatch(s.imageUrl) ? { ...s, imageUrl: '' } : s))
      );

      setSections((prev) => {
        const next = prev.map((s) => (clearUrlMatch(s.imageUrl) ? { ...s, imageUrl: '' } : s));
        fetch('/api/sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        }).catch((err) => console.error('Failed to persist sections after delete:', err));
        return next;
      });
      setDraftSections((prev) =>
        prev.map((s) => (clearUrlMatch(s.imageUrl) ? { ...s, imageUrl: '' } : s))
      );

      logActivity('Website', 'Delete Media', `Deleted media ${existing?.fileName || mediaId} permanently`);
      showToast({
        type: 'info',
        title: 'Deleted Permanently',
        message: `${existing?.fileName || 'Asset'} removed from server.`,
      });
    },
    [mediaItems, logActivity, showToast]
  );

  const updateMediaMetadata = useCallback(
    async (mediaId: string, updates: Partial<MediaItem>): Promise<void> => {
      const updated = await mediaStorageService.update(mediaId, updates);
      setMediaItems((prev) =>
        prev.map((m) => (m.id === mediaId || m.mediaId === mediaId ? updated : m))
      );
      showToast({ type: 'success', title: 'Media Updated', message: updated.fileName });
    },
    [showToast]
  );

  return (
    <StoreContext.Provider
      value={{
        currentAdmin,
        staff,
        loginAdmin,
        logoutAdmin,
        switchAdminRole,
        addStaffMember,
        updateStaffMember,
        toggleStaffActive,
        products,
        addProduct,
        updateProduct,
        duplicateProduct,
        toggleProductVisibility,
        archiveProduct,
        deleteProduct,
        reorderProducts,
        moveProductOrder,
        orders,
        updateOrderStatus,
        placeOrder,
        cancelOrder,
        refundOrder,
        assignDeliveryPartner,
        inventory,
        stockMovements,
        adjustStock,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        suppliers,
        addSupplier,
        updateSupplier,
        createRestockRecord,
        customers,
        updateCustomerNotes,
        updateCustomerSegment,
        coupons,
        createCoupon,
        toggleCouponStatus,
        deleteCoupon,
        validateCoupon,
        reviews,
        moderateReview,
        addReview,
        heroSlides,
        sections,
        websiteRevisions,
        draftHeroSlides,
        draftSections,
        hasDraftChanges,
        updateDraftHeroSlides,
        updateDraftSections,
        publishWebsiteChanges,
        discardWebsiteDraft,
        restoreWebsiteRevision,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        storeSettings,
        setStoreOpenManualOverride,
        updateStoreSettings,
        isStoreOpen,
        deliveryZones,
        deliveryPartners,
        updateDeliveryZone,
        addDeliveryZone,
        updateDeliveryPartnerStatus,
        addDeliveryPartner,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        activityLogs,
        logActivity,
        abandonedCarts,
        sendCartRecoveryReminder,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toasts,
        showToast,
        dismissToast,
        soundEnabled,
        setSoundEnabled,
        mediaItems,
        uploadMedia,
        replaceMedia,
        deleteMedia,
        updateMediaMetadata,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
