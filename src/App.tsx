import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ToastContainer } from './components/common/ToastContainer';
import { Product } from './types';

// Admin Module Components (Completely preserved and functional)
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { DashboardView } from './components/admin/DashboardView';
import { OrdersView } from './components/admin/OrdersView';
import { LiveOrdersView } from './components/admin/LiveOrdersView';
import { KitchenView } from './components/admin/KitchenView';
import { ProductsView } from './components/admin/ProductsView';
import { InventoryView } from './components/admin/InventoryView';
import { SuppliersView } from './components/admin/SuppliersView';
import { CustomersView } from './components/admin/CustomersView';
import { WebsiteEditorView } from './components/admin/WebsiteEditorView';
import { StoreControlView } from './components/admin/StoreControlView';
import { PromotionsView } from './components/admin/PromotionsView';
import { ReviewsView } from './components/admin/ReviewsView';
import { MediaLibraryView } from './components/admin/MediaLibraryView';
import { ImageStorageDashboard } from './components/admin/ImageStorageDashboard';
import { DeliveryView } from './components/admin/DeliveryView';
import { AnalyticsView } from './components/admin/AnalyticsView';
import { AbandonedCartsView } from './components/admin/AbandonedCartsView';
import { FinanceView } from './components/admin/FinanceView';
import { StaffRolesView } from './components/admin/StaffRolesView';
import { ActivityLogsView } from './components/admin/ActivityLogsView';
import { SettingsView } from './components/admin/SettingsView';
import { HelpView } from './components/admin/HelpView';
import { DataSafetyCenter } from './components/admin/DataSafetyCenter';

// Redesigned Customer Storefront Components
import { StorefrontNavbar } from './components/storefront/StorefrontNavbar';
import { StorefrontHero } from './components/storefront/StorefrontHero';
import { StorefrontProducts } from './components/storefront/StorefrontProducts';
import { StorefrontBitesAndIndulgence } from './components/storefront/StorefrontBitesAndIndulgence';
import { StorefrontCustomProductSection } from './components/storefront/StorefrontCustomProductSection';
import { StorefrontBannerSection } from './components/storefront/StorefrontBannerSection';
import { StorefrontSweetAndSavoury } from './components/storefront/StorefrontSweetAndSavoury';
import { StorefrontTiramisu } from './components/storefront/StorefrontTiramisu';
import { StorefrontWhatsInside } from './components/storefront/StorefrontWhatsInside';
import { StorefrontCartPage } from './components/storefront/StorefrontCartPage';
import { StorefrontCheckoutPage } from './components/storefront/StorefrontCheckoutPage';
import { StorefrontFloatingCartBar } from './components/storefront/StorefrontFloatingCartBar';
import { StorefrontActiveOrderBar } from './components/storefront/StorefrontActiveOrderBar';
import { StorefrontOrderTracking } from './components/storefront/StorefrontOrderTracking';
import { StorefrontOurStory } from './components/storefront/StorefrontOurStory';
import { StorefrontFooter } from './components/storefront/StorefrontFooter';
import { CustomerAccountModal } from './components/storefront/CustomerAccountModal';
import { StorefrontProductModal } from './components/storefront/StorefrontProductModal';

const AppContent: React.FC = () => {
  const { currentAdmin, cart, sections } = useStore();

  // Root view: 'customer' (default for customer website experience) or 'admin'
  const [viewMode, setViewMode] = useState<'admin' | 'customer'>('customer');
  const [customerSubView, setCustomerSubView] = useState<'store' | 'cart' | 'checkout' | 'tracking' | 'our_story'>('store');
  const [trackingOrderId, setTrackingOrderId] = useState<string | undefined>(undefined);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    return localStorage.getItem('secretpresso_active_order') || null;
  });
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // Admin Module Navigation
  const [adminModule, setAdminModule] = useState<string>('dashboard');
  const [adminTargetId, setAdminTargetId] = useState<string | undefined>(undefined);

  // Modals for Admin Quick Actions
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);

  const handleAdminNavigate = (module: string, itemId?: string) => {
    setAdminModule(module);
    setAdminTargetId(itemId);
  };

  const handleOrderPlaced = (orderId: string) => {
    setTrackingOrderId(orderId);
    setCustomerSubView('tracking');
  };

  // If in Admin Mode (Completely preserved and intact)
  if (viewMode === 'admin') {
    if (!currentAdmin) {
      return (
        <AdminLogin
          onSuccess={() => setAdminModule('dashboard')}
          onSwitchToCustomer={() => setViewMode('customer')}
        />
      );
    }

    return (
      <AdminLayout
        currentModule={adminModule}
        onNavigate={handleAdminNavigate}
        onSwitchToCustomer={() => setViewMode('customer')}
        onOpenAddProduct={() => {
          setAdminModule('products');
          setIsAddProductOpen(true);
        }}
        onOpenAdjustStock={() => {
          setAdminModule('inventory');
          setIsAdjustStockOpen(true);
        }}
        onOpenCreateCoupon={() => {
          setAdminModule('promotions');
          setIsCreateCouponOpen(true);
        }}
      >
        {adminModule === 'dashboard' && (
          <DashboardView
            onNavigate={handleAdminNavigate}
            onOpenAddProduct={() => {
              setAdminModule('products');
              setIsAddProductOpen(true);
            }}
            onOpenAdjustStock={() => {
              setAdminModule('inventory');
              setIsAdjustStockOpen(true);
            }}
          />
        )}
        {adminModule === 'orders' && <OrdersView initialOrderId={adminTargetId} />}
        {adminModule === 'live_orders' && <LiveOrdersView />}
        {adminModule === 'kitchen' && <KitchenView />}
        {adminModule === 'products' && (
          <ProductsView
            initialProductId={adminTargetId}
            isAddModalOpenInitially={isAddProductOpen}
          />
        )}
        {adminModule === 'inventory' && (
          <InventoryView
            initialItemId={adminTargetId}
            isAdjustModalOpenInitially={isAdjustStockOpen}
          />
        )}
        {adminModule === 'suppliers' && <SuppliersView />}
        {adminModule === 'customers' && <CustomersView />}
        {adminModule === 'website' && <WebsiteEditorView />}
        {adminModule === 'media_library' && <MediaLibraryView />}
        {adminModule === 'image_storage' && <ImageStorageDashboard />}
        {adminModule === 'data_safety' && <DataSafetyCenter />}
        {adminModule === 'store_control' && <StoreControlView />}
        {adminModule === 'promotions' && (
          <PromotionsView isCreateOpenInitially={isCreateCouponOpen} />
        )}
        {adminModule === 'reviews' && <ReviewsView />}
        {adminModule === 'delivery' && <DeliveryView />}
        {adminModule === 'analytics' && <AnalyticsView />}
        {adminModule === 'abandoned_carts' && <AbandonedCartsView />}
        {adminModule === 'finance' && <FinanceView />}
        {adminModule === 'staff' && <StaffRolesView />}
        {adminModule === 'activity_logs' && <ActivityLogsView />}
        {adminModule === 'settings' && <SettingsView />}
        {adminModule === 'help' && <HelpView />}
      </AdminLayout>
    );
  }

  // Redesigned Customer Storefront Mode
  return (
    <div className="min-h-screen bg-[#0C0704] text-zinc-100 flex flex-col font-sans selection:bg-[#cfa851] selection:text-zinc-950">
      {/* Premium Floating Transparent Navigation */}
      <StorefrontNavbar
        onOpenCart={() => setCustomerSubView('cart')}
        onOpenTracking={() => setCustomerSubView('tracking')}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenProductDetail={(prod) => setSelectedProductDetail(prod)}
        onOpenAdmin={() => setViewMode('admin')}
      />

      <main className="flex-1">
        {customerSubView === 'cart' ? (
          <StorefrontCartPage
            onContinueShopping={() => setCustomerSubView('store')}
            onProceedToCheckout={() => setCustomerSubView('checkout')}
          />
        ) : customerSubView === 'checkout' ? (
          <StorefrontCheckoutPage
            onBackToCart={() => setCustomerSubView('cart')}
            onOrderSuccess={(orderId) => {
              setActiveOrderId(orderId);
              localStorage.setItem('secretpresso_active_order', orderId);
              setCustomerSubView('store');
            }}
            onContinueShopping={() => setCustomerSubView('store')}
          />
        ) : customerSubView === 'tracking' ? (
          <StorefrontOrderTracking
            initialOrderId={trackingOrderId || activeOrderId || undefined}
            onBackToMenu={() => setCustomerSubView('store')}
          />
        ) : customerSubView === 'our_story' ? (
          <StorefrontOurStory onBackToMenu={() => setCustomerSubView('store')} />
        ) : (
          <>
            {/* Cinematic Full-Width Hero */}
            <StorefrontHero onOrderClick={() => {}} />

            {/* Dynamically Ordered Storefront Sections */}
            {[...sections]
              .filter((s) => s.isVisible !== false && s.sectionKey !== 'hero' && s.type !== 'hero' && s.sectionType !== 'hero')
              .sort((a, b) => {
                const orderA = a.displayOrder ?? a.order ?? 999;
                const orderB = b.displayOrder ?? b.order ?? 999;
                return orderA - orderB;
              })
              .map((section) => {
                // 1. Coffee Flavours (Primary coffee catalogue - KEPT COMPLETELY UNCHANGED)
                if (section.sectionKey === 'coffeeFlavours' || section.id === 'sec-2') {
                  return (
                    <StorefrontProducts
                      key={section.id}
                      onOpenCart={() => setCustomerSubView('cart')}
                      onOpenProductDetail={(prod) => setSelectedProductDetail(prod)}
                    />
                  );
                }

                // 2. Bites & Indulgence (Unified food & snacks horizontal slider)
                if (
                  section.sectionKey === 'bitesAndIndulgence' ||
                  section.sectionKey === 'sweetAndSavoury' ||
                  section.id === 'sec-bites-indulgence' ||
                  section.id === 'sec-sweet-savoury'
                ) {
                  return (
                    <StorefrontBitesAndIndulgence
                      key={section.id}
                      sectionConfig={section}
                      onOpenCart={() => setCustomerSubView('cart')}
                      onOpenProductDetail={(prod) => setSelectedProductDetail(prod)}
                    />
                  );
                }

                // 3. What's Inside & Secret Surprise Banner
                if (section.sectionKey === 'whatsInside' || section.id === 'sec-3') {
                  return <StorefrontWhatsInside key={section.id} />;
                }

                // 4. Editorial Tiramisu Spotlight
                if (section.sectionKey === 'tiramisuSpotlight' || section.id === 'sec-tiramisu' || section.id === 'sec-4') {
                  return (
                    <StorefrontTiramisu
                      key={section.id}
                      onOpenCart={() => setCustomerSubView('cart')}
                    />
                  );
                }

                // 5. Future Banner Section created via Admin Panel
                if (section.sectionType === 'banner' || section.type === 'banner') {
                  return <StorefrontBannerSection key={section.id} sectionConfig={section} />;
                }

                // 6. Future Non-Coffee Product Section created via Admin Panel (Horizontal Slider by default, or Grid)
                return (
                  <StorefrontCustomProductSection
                    key={section.id}
                    sectionConfig={section}
                    onOpenCart={() => setCustomerSubView('cart')}
                    onOpenProductDetail={(prod) => setSelectedProductDetail(prod)}
                  />
                );
              })}
          </>
        )}
      </main>

      {/* Floating Bottom Bars: Cart & Active Order Status */}
      {customerSubView !== 'cart' && customerSubView !== 'checkout' && (
        <>
          {activeOrderId && (
            <StorefrontActiveOrderBar
              activeOrderId={activeOrderId}
              hasCartItems={cart.length > 0}
              onOpenTracking={(orderId) => {
                setTrackingOrderId(orderId);
                setCustomerSubView('tracking');
              }}
              onDismiss={() => {
                setActiveOrderId(null);
                localStorage.removeItem('secretpresso_active_order');
              }}
            />
          )}

          {cart.length > 0 && (
            <StorefrontFloatingCartBar
              onOpenCartPage={() => setCustomerSubView('cart')}
            />
          )}
        </>
      )}

      {/* Premium Dark Footer */}
      <StorefrontFooter
        onOpenAdmin={() => setViewMode('admin')}
        onOpenTracking={() => setCustomerSubView('tracking')}
        onOpenOurStory={() => setCustomerSubView('our_story')}
        onOpenAccount={() => setIsAccountOpen(true)}
      />

      {/* Customer Account & Order History Modal */}
      <CustomerAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onTrackOrder={(orderId) => {
          setTrackingOrderId(orderId);
          setCustomerSubView('tracking');
          setIsAccountOpen(false);
        }}
      />

      {/* Product Detail Modal */}
      <StorefrontProductModal
        product={selectedProductDetail}
        isOpen={!!selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
      <ToastContainer />
    </StoreProvider>
  );
}
