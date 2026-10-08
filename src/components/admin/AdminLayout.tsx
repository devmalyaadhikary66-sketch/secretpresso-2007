import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Radio,
  CookingPot,
  Package,
  Box,
  Users,
  FileText,
  Store,
  Tag,
  Star,
  Truck,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  History,
  HelpCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ExternalLink,
  PlusCircle,
  Coffee,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Image as ImageIcon,
  HardDrive,
} from 'lucide-react';
import { AdminRole } from '../../types';
import { GlobalSearchModal } from './GlobalSearchModal';
import { QuickActionsModal } from './QuickActionsModal';

interface AdminLayoutProps {
  currentModule: string;
  onNavigate: (module: string, itemId?: string) => void;
  onSwitchToCustomer: () => void;
  onOpenAddProduct: () => void;
  onOpenAdjustStock: () => void;
  onOpenCreateCoupon: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentModule,
  onNavigate,
  onSwitchToCustomer,
  onOpenAddProduct,
  onOpenAdjustStock,
  onOpenCreateCoupon,
  children,
}) => {
  const {
    currentAdmin,
    logoutAdmin,
    switchAdminRole,
    isStoreOpen,
    setStoreOpenManualOverride,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    orders,
    inventory,
  } = useStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Global search keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.isRead);
  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus === 'NEW' || o.orderStatus === 'PREPARING' || o.orderStatus === 'ACCEPTED'
  ).length;
  const lowStockCount = inventory.filter((i) => i.status === 'LOW_STOCK' || i.currentStock <= i.minimumStock).length;

  // Sidebar navigation configuration
  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeVariant?: 'gold' | 'red' | 'blue';
    allowedRoles: AdminRole[];
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: orders.length,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'ORDER_MANAGER'],
    },
    {
      id: 'live_orders',
      label: 'Live Orders',
      icon: Radio,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeVariant: 'red',
      allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN_STAFF', 'ORDER_MANAGER'],
    },
    {
      id: 'kitchen',
      label: 'Kitchen (KDS)',
      icon: CookingPot,
      badge: activeOrdersCount > 0 ? `${activeOrdersCount} Brew` : undefined,
      badgeVariant: 'gold',
      allowedRoles: ['SUPER_ADMIN', 'KITCHEN_STAFF'],
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Box,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeVariant: 'red',
      allowedRoles: ['SUPER_ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck,
      allowedRoles: ['SUPER_ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      id: 'customers',
      label: 'Customers CRM',
      icon: Users,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'website',
      label: 'Website Editor',
      icon: FileText,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_EDITOR'],
    },
    {
      id: 'media_library',
      label: 'Media Library',
      icon: ImageIcon,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_EDITOR', 'MANAGER'],
    },
    {
      id: 'image_storage',
      label: 'Image Storage',
      icon: HardDrive,
      badge: 'Local',
      badgeVariant: 'gold',
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_EDITOR', 'MANAGER'],
    },
    {
      id: 'data_safety',
      label: 'Data Safety & Backups',
      icon: ShieldCheck,
      badge: 'Protected',
      badgeVariant: 'gold',
      allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'store_control',
      label: 'Store Control',
      icon: Store,
      allowedRoles: ['SUPER_ADMIN'],
    },
    {
      id: 'promotions',
      label: 'Promotions & Coupons',
      icon: Tag,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR'],
    },
    {
      id: 'delivery',
      label: 'Delivery & Fleet',
      icon: Truck,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'ORDER_MANAGER'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'abandoned_carts',
      label: 'Abandoned Carts',
      icon: ShoppingBag,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'finance',
      label: 'Finance Overview',
      icon: DollarSign,
      allowedRoles: ['SUPER_ADMIN'],
    },
    {
      id: 'staff',
      label: 'Staff & Roles',
      icon: ShieldCheck,
      allowedRoles: ['SUPER_ADMIN'],
    },
    {
      id: 'activity_logs',
      label: 'Activity Logs',
      icon: History,
      allowedRoles: ['SUPER_ADMIN', 'INVENTORY_MANAGER'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      allowedRoles: ['SUPER_ADMIN'],
    },
    {
      id: 'help',
      label: 'Help & Manual',
      icon: HelpCircle,
      allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN_STAFF', 'INVENTORY_MANAGER', 'ORDER_MANAGER', 'CONTENT_EDITOR'],
    },
  ];

  const userRole = currentAdmin?.role || 'SUPER_ADMIN';
  const visibleNavItems = navItems.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <div className="min-h-screen bg-[#090503] text-zinc-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-[#100a06]/95 border-b border-[#281810] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-md">
        {/* Left Side: Mobile toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-[#1a100a]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2f1b11] to-[#120b08] border border-[#cfa851]/40 flex items-center justify-center text-[#cfa851] shadow-md shadow-[#cfa851]/10 group-hover:border-[#cfa851] transition">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-widest text-sm text-[#fae8be]">
                  SECRETPRESSO
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#2a1a12] text-[#cfa851] border border-[#3d271c]">
                  Control Center
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono tracking-tight">
                Role: {userRole.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#180f0b] border border-[#301c13] hover:border-[#cfa851]/50 text-xs text-zinc-400 transition w-72 shadow-inner"
        >
          <Search className="w-4 h-4 text-zinc-500" />
          <span className="flex-1 text-left">Search orders, SKU, products...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#24150d] rounded text-zinc-400 border border-[#3a2216]">
            ⌘K
          </kbd>
        </button>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Actions trigger */}
          <button
            onClick={() => setIsQuickActionsOpen(true)}
            title="Operational Quick Actions"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#26160e] hover:bg-[#352015] border border-[#3e2619] text-xs font-semibold text-[#f0e2cf] transition shadow"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#cfa851]" />
            <span>Quick Actions</span>
          </button>

          {/* Store Status Pill */}
          <div
            onClick={() => setStoreOpenManualOverride(!isStoreOpen)}
            title="Click to toggle store Open/Close override"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer border transition shadow ${
              isStoreOpen
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-red-950/60 border-red-500/30 text-red-300 hover:bg-red-900/60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
            <span className="hidden sm:inline">{isStoreOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
          </div>

          {/* Customer Storefront Launcher */}
          <button
            onClick={onSwitchToCustomer}
            title="View Live Customer Storefront"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-md shadow-[#cfa851]/15 hover:brightness-110"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Live Store</span>
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-[#1a100a] transition relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-bounce-short">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#140c08] border border-[#382319] shadow-2xl p-4 text-xs z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#261710]">
                  <span className="font-bold font-serif text-[#fae8be]">
                    Live Store Notifications ({notifications.length})
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#20140d] max-h-72 overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-zinc-500 text-xs">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.actionUrl) onNavigate(n.actionUrl);
                          setIsNotifOpen(false);
                        }}
                        className={`py-2.5 px-2 hover:bg-[#1c110a] rounded-lg cursor-pointer transition ${
                          !n.isRead ? 'bg-[#20120a]/60 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-zinc-200">{n.title}</p>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#1a100a] transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#cfa851] to-[#8c6722] text-zinc-950 font-bold flex items-center justify-center text-xs">
                {currentAdmin?.name.charAt(0) || 'A'}
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#140c08] border border-[#382319] shadow-2xl p-3 text-xs z-50">
                <div className="p-2 border-b border-[#261710]">
                  <p className="font-bold text-zinc-100">{currentAdmin?.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{currentAdmin?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#281810] text-[#cfa851]">
                    {userRole}
                  </span>
                </div>

                {/* Role Switcher */}
                <div className="py-2 border-b border-[#261710]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                    Quick Role Switcher
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {(['SUPER_ADMIN', 'MANAGER', 'KITCHEN_STAFF', 'INVENTORY_MANAGER', 'ORDER_MANAGER', 'CONTENT_EDITOR'] as AdminRole[]).map(
                      (role) => (
                        <button
                          key={role}
                          onClick={() => {
                            switchAdminRole(role);
                            setIsProfileOpen(false);
                          }}
                          className={`p-1.5 rounded text-left truncate transition ${
                            userRole === role
                              ? 'bg-[#cfa851] text-zinc-950 font-bold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#20140e]'
                          }`}
                        >
                          {role.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logoutAdmin();
                    }}
                    className="w-full p-2 text-left text-red-400 hover:bg-red-950/30 rounded-lg flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Admin Center</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main App Body with Sidebar & View Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-[#261710] bg-[#0d0704] transition-all duration-300 ${
            isCollapsed ? 'w-18' : 'w-64'
          }`}
        >
          {/* Collapse Toggle */}
          <div className="p-3 border-b border-[#20130c] flex justify-end">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-[#1a100a] transition"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2a1a12] to-[#1c110a] text-[#fae8be] border border-[#cfa851]/40 shadow-md shadow-[#cfa851]/5'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#160d08]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#cfa851]' : 'text-zinc-500'}`} />
                  {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        item.badgeVariant === 'red'
                          ? 'bg-red-500/20 text-red-300'
                          : item.badgeVariant === 'gold'
                          ? 'bg-[#cfa851]/20 text-[#e6ca85]'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar User Info */}
          {!isCollapsed && (
            <div className="p-3.5 m-2.5 rounded-xl bg-[#140c08] border border-[#261710] text-[11px] text-zinc-400 flex items-center justify-between">
              <div className="truncate">
                <p className="font-semibold text-zinc-200 truncate">{currentAdmin?.name.split(' ')[0]}</p>
                <p className="text-[10px] text-[#cfa851] font-mono truncate">{userRole}</p>
              </div>
              <button
                onClick={logoutAdmin}
                title="Sign Out"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </aside>

        {/* Mobile Slide-out Drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm">
            <div className="w-72 h-full bg-[#100a06] border-r border-[#2d1b12] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#261710] mb-4">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-[#cfa851]" />
                    <span className="font-serif font-black tracking-wider text-sm text-[#fae8be]">
                      SECRETPRESSO
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1 max-h-[75vh] overflow-y-auto">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive
                            ? 'bg-[#2a1a12] text-[#fae8be] border border-[#cfa851]/40'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#261710] flex items-center justify-between">
                <button
                  onClick={onSwitchToCustomer}
                  className="text-xs text-[#cfa851] hover:underline"
                >
                  Customer Storefront →
                </button>
                <button
                  onClick={logoutAdmin}
                  className="p-2 text-zinc-400 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090503]">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Quick Actions Modal */}
      <QuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onNavigate={onNavigate}
        onOpenAddProduct={onOpenAddProduct}
        onOpenAdjustStock={onOpenAdjustStock}
        onOpenCreateCoupon={onOpenCreateCoupon}
      />
    </div>
  );
};
