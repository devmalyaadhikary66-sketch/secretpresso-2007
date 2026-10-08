export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'CARD' | 'UPI' | 'NET_BANKING' | 'CASH_ON_DELIVERY' | 'APPLE_PAY';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'MANAGER'
  | 'KITCHEN_STAFF'
  | 'INVENTORY_MANAGER'
  | 'ORDER_MANAGER'
  | 'CONTENT_EDITOR';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions?: string[];
}

export interface ProductCustomization {
  milk?: 'Whole' | 'Oat' | 'Almond' | 'Soy' | 'Skim';
  sweetness?: 'Normal' | 'Less Sugar' | 'No Sugar' | 'Extra Sweet';
  temperature?: 'Hot' | 'Iced';
  size?: 'Regular (250ml)' | 'Grande (350ml)' | 'Venti (480ml)';
  extraShots?: number;
  syrup?: 'None' | 'Vanilla' | 'Caramel' | 'Hazelnut' | 'Dark Chocolate';
  specialInstructions?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  customization?: ProductCustomization;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  pincode: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  taxes: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  estimatedDeliveryTime?: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    actor?: string;
  }[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  image?: string;
  imageId?: string; // Persistent IndexedDB image ID
  categoryType?: string; // 'Food' | 'Coffee' | 'Merchandise' | 'Desserts' | 'Bakery' | 'General'
  displayOrder: number;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string; // 'Espresso & Hot' | 'Iced & Cold Brew' | 'Signature Tiramisu' | 'Beans & Roast' | 'Collectibles & Merch' | 'Bites & Indulgence' | custom
  categoryId?: string;
  subcategory?: string;
  sectionId?: string; // Section assignment e.g. "sec-bites-indulgence", "sec-2", etc.
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  costPrice: number;
  taxPercent: number;
  discountPercent?: number;
  stock: number;
  lowStockThreshold: number;
  weight?: string;
  size?: string;
  ingredients: string[];
  allergens: string[];
  preparationTimeMinutes: number;
  imageUrl: string;
  imageId?: string; // Persistent IndexedDB image ID
  mainImageId?: string; // Persistent IndexedDB main image ID
  additionalImages?: string[];
  galleryImageIds?: string[]; // Persistent IndexedDB gallery image IDs
  videoUrl?: string;
  badge?: 'Best Seller' | 'New' | 'Chef Choice' | 'Limited' | 'Special Reserve';
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isAvailable: boolean; // Controls customer visibility
  isVisible?: boolean; // Alias for availability
  isArchived?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TextElementPosition {
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
}

export interface ResponsiveTextPositions {
  desktop: {
    subtitle?: TextElementPosition;
    heading?: TextElementPosition;
    description?: TextElementPosition;
    cta?: TextElementPosition;
  };
  tablet: {
    subtitle?: TextElementPosition;
    heading?: TextElementPosition;
    description?: TextElementPosition;
    cta?: TextElementPosition;
  };
  mobile: {
    subtitle?: TextElementPosition;
    heading?: TextElementPosition;
    description?: TextElementPosition;
    cta?: TextElementPosition;
  };
}

export interface TextElementStyle {
  fontSize?: string; // e.g. "32px", "1.75rem"
  fontWeight?: string; // "300" | "400" | "500" | "600" | "700" | "900"
  letterSpacing?: string; // "normal" | "0.05em" | "0.15em" | "0.25em"
  lineHeight?: string; // "1" | "1.2" | "1.4" | "1.6"
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string; // "#fae8be"
  maxWidth?: string; // "450px"
}

export interface BannerTextConfig {
  showSubtitle?: boolean;
  showHeading?: boolean;
  showDescription?: boolean;
  showCta?: boolean;
  ctaText?: string;
  ctaLink?: string;
  subtitleStyle?: TextElementStyle;
  headingStyle?: TextElementStyle;
  descriptionStyle?: TextElementStyle;
  ctaStyle?: TextElementStyle;
  positions?: ResponsiveTextPositions;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'Beans' | 'Dairy & Mylk' | 'Syrups' | 'Cocoa & Chocolate' | 'Bakery & Tiramisu' | 'Packaging' | 'Merch';
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  unit: 'kg' | 'liters' | 'bottles' | 'units' | 'boxes';
  costPerUnit: number;
  supplierId: string;
  supplierName: string;
  lastRestocked: string;
  expiryDate?: string;
  batchNumber: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_FOR_STOCK' | 'EXPIRED';
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  timestamp: string;
  adminName: string;
  quantityChange: number; // positive for restock, negative for deduction
  resultingStock: number;
  reason: 'Purchase' | 'Sale' | 'Manual adjustment' | 'Damaged' | 'Expired' | 'Return' | 'Wastage';
  orderId?: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  productsSupplied: string[];
  paymentTerms: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  registrationDate: string;
  segment: 'New Customer' | 'Returning Customer' | 'VIP' | 'High Value' | 'Inactive' | 'At Risk';
  address: string;
  pincode: string;
  adminNotes?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  startDate: string;
  endDate: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'HIDDEN';
  verifiedPurchase: boolean;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  imageId?: string; // Persistent IndexedDB image ID
  mobileImageUrl?: string;
  mobileImageId?: string;
  storagePath?: string;
  videoUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface Banner {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  imageId?: string; // Persistent IndexedDB image ID
  mobileImageUrl?: string;
  mobileImageId?: string;
  heading: string;
  subtitle?: string;
  subheading?: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bannerType?: 'hero' | 'promotional' | 'section';
  displayOrder: number;
  order?: number;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
  bannerTextConfig?: BannerTextConfig;
}

export interface WebsiteSectionConfig {
  id: string;
  sectionKey?: string; // 'hero' | 'coffeeFlavours' | 'bitesAndIndulgence' | 'whatsInside' | 'tiramisuSpotlight' | custom
  name: string;
  heading?: string;
  subheading?: string;
  subtitle?: string;
  description: string;
  type?: string; // 'products' | 'banner' | 'hero' | 'custom'
  sectionType?: 'products' | 'banner' | 'hero' | 'custom';
  displayStyle?: 'slider' | 'grid' | 'horizontal-slider'; // Default 'slider' for new non-coffee food/product sections
  image?: string | null;
  imageUrl?: string;
  imageId?: string; // Persistent IndexedDB image ID
  mobileImageUrl?: string;
  mobileImageId?: string;
  storagePath?: string;
  videoUrl?: string;
  products?: string[];
  targetProductIds?: string[]; // Specific products mapped to this section
  categoryIds?: string[];
  displayOrder?: number;
  order: number;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
  ctaText?: string;
  ctaLink?: string;
  bannerType?: 'hero' | 'promotional' | 'section';
  bannerHeight?: 'compact' | 'medium' | 'large';
  imagePosition?: string;
  imageFit?: 'cover' | 'contain';
  textPosition?: 'left' | 'center' | 'right';
  textAlignment?: 'left' | 'center' | 'right';
  overlayIntensity?: number; // 0-100, default 0
  bannerTextConfig?: BannerTextConfig;
}

export interface WebsiteRevision {
  id: string;
  timestamp: string;
  adminName: string;
  description: string;
  snapshot: {
    heroSlides: HeroSlide[];
    sections: WebsiteSectionConfig[];
  };
}

export interface StoreHoursDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isOpen: boolean;
  openTime: string; // "08:00"
  closeTime: string; // "22:00"
  breakStart?: string;
  breakEnd?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  isOpenManualOverride: boolean | null; // null follows schedule, true = forced open, false = forced closed
  isStoreOpenCurrently: boolean;
  closedAnnouncementMessage: string;
  businessHours: StoreHoursDay[];
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  gstNumber: string;
  currency: string;
  taxRatePercent: number;
  freeDeliveryThreshold: number;
  defaultDeliveryFee: number;
  estimatedDeliveryTimeMinutes: number;
  paymentGatewayStatus: {
    stripe: 'NOT_CONNECTED' | 'CONNECTED';
    razorpay: 'NOT_CONNECTED' | 'CONNECTED';
    cashOnDelivery: 'ACTIVE';
  };
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    keywords: string;
  };
}

export interface DeliveryZone {
  id: string;
  name: string;
  pincodes: string[];
  deliveryFee: number;
  freeDeliveryAbove: number;
  estimatedTimeMin: number;
  isActive: boolean;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFF_DUTY';
  activeOrdersCount: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'STOCK' | 'REVIEW' | 'STORE' | 'CUSTOMER';
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  module: 'Products' | 'Orders' | 'Inventory' | 'Website' | 'Store Control' | 'Coupons' | 'Staff' | 'Reviews';
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface AbandonedCart {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  cartValue: number;
  abandonedAt: string;
  recovered: boolean;
}

export type MediaType =
  | 'hero'
  | 'banners'
  | 'banner'
  | 'products'
  | 'product'
  | 'collections'
  | 'collection'
  | 'promotions'
  | 'promotional'
  | 'videos'
  | 'video'
  | 'general';

export interface MediaItem {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  url: string;
  mimeType: string;
  size: number;
  mediaType: MediaType;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  // Product image specifics
  productId?: string;
  isPrimary?: boolean;
  displayOrder?: number;
  // Banner specifics
  bannerId?: string;
  deviceType?: 'desktop' | 'mobile';
  // Compatibility & metadata helpers
  altText?: string;
  targetId?: string;
  mediaId?: string;
  downloadURL?: string;
  storagePath?: string;
  fileSize?: number;
  contentType?: string;
  usedIn?: string;
}

