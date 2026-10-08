import React, { useState, useRef, useEffect } from 'react';
import {
  Coffee,
  ShoppingBag,
  Search,
  ChevronDown,
  User,
  Package,
  Clock,
  Radio,
  HelpCircle,
  LogOut,
  X,
  Menu,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

interface StorefrontNavbarProps {
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onOpenAccount: () => void;
  onOpenProductDetail: (product: Product) => void;
  onOpenAdmin: () => void;
}

export const StorefrontNavbar: React.FC<StorefrontNavbarProps> = ({
  onOpenCart,
  onOpenTracking,
  onOpenAccount,
  onOpenProductDetail,
  onOpenAdmin,
}) => {
  const { cart, products } = useStore();
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMySecretOpen, setIsMySecretOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMySecretOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for live search in header
  const searchResults = searchQuery.trim()
    ? products
        .filter((p) => p.isAvailable && !p.isArchived)
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-transparent px-4 sm:px-8 lg:px-12 py-5 transition-all text-white pointer-events-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo on the Left */}
        <a href="#top" className="flex items-center gap-3 group shrink-0">
          <div className="w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center text-white/90 group-hover:border-[#cfa851] group-hover:text-[#cfa851] transition">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif font-black tracking-widest text-base sm:text-lg text-white block leading-none">
              SECRETPRESSO
            </span>
            <span className="text-[8px] font-mono tracking-[0.25em] text-zinc-300 block mt-1 uppercase">
              SIP. DISCOVER. COLLECT.
            </span>
          </div>
        </a>

        {/* Center Main Navigation: BREW HOME, OUR BREW, MY SECRET (Transparent, elegant typography) */}
        <nav className="hidden md:flex items-center gap-9 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-200">
          <a
            href="#top"
            className="hover:text-[#fae8be] transition-colors duration-200"
          >
            BREW HOME
          </a>
          <a
            href="#coffee-menu"
            className="hover:text-[#fae8be] transition-colors duration-200"
          >
            OUR BREW
          </a>

          {/* MY SECRET Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMySecretOpen(!isMySecretOpen)}
              className="flex items-center gap-1.5 hover:text-[#fae8be] transition-colors duration-200 focus:outline-none cursor-pointer"
            >
              <span>MY SECRET</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMySecretOpen ? 'rotate-180 text-[#cfa851]' : 'text-zinc-400'
                }`}
              />
            </button>

            {isMySecretOpen && (
              <div className="absolute top-full left-0 mt-3.5 w-60 rounded-2xl bg-[#120b08]/95 border border-[#3e271c] shadow-2xl p-2 text-xs text-zinc-200 backdrop-blur-xl animate-in fade-in duration-150 z-50">
                <div className="px-3 py-2 border-b border-[#24150e] mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#cfa851] block">
                    Customer Sanctuary
                  </span>
                  <span className="text-xs font-semibold text-white">MY SECRET Concierge</span>
                </div>

                <button
                  onClick={() => {
                    setIsMySecretOpen(false);
                    onOpenAccount();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#251710] flex items-center gap-2.5 transition text-zinc-300 hover:text-white"
                >
                  <User className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => {
                    setIsMySecretOpen(false);
                    onOpenAccount();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#251710] flex items-center gap-2.5 transition text-zinc-300 hover:text-white"
                >
                  <Package className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>My Orders</span>
                </button>

                <button
                  onClick={() => {
                    setIsMySecretOpen(false);
                    onOpenAccount();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#251710] flex items-center gap-2.5 transition text-zinc-300 hover:text-white"
                >
                  <Clock className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>Order History</span>
                </button>

                <button
                  onClick={() => {
                    setIsMySecretOpen(false);
                    onOpenAccount();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#251710] flex items-center gap-2.5 transition text-zinc-300 hover:text-white"
                >
                  <User className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>Account</span>
                </button>

                <button
                  onClick={() => {
                    setIsMySecretOpen(false);
                    onOpenTracking();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#251710] flex items-center gap-2.5 transition text-zinc-300 hover:text-white"
                >
                  <Radio className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>Track Order</span>
                </button>

                <button
                  onClick={() => {
                    setIsMySecretOpen(false);
                    onOpenAccount();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#251710] flex items-center gap-2.5 transition text-zinc-300 hover:text-white"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#cfa851]" />
                  <span>Help</span>
                </button>

                <div className="pt-1 mt-1 border-t border-[#24150e]">
                  <button
                    onClick={() => {
                      setIsMySecretOpen(false);
                      onOpenAccount();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-[#20100a] flex items-center gap-2.5 transition text-[11px]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Controls: Minimal Pill Search, Shopping Bag, and Admin Access */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Minimal Pill Search Field (transparent / glassy floating aesthetic) */}
          <div className="relative" ref={searchContainerRef}>
            <div className="flex items-center rounded-full bg-black/30 border border-white/25 hover:border-white/50 backdrop-blur-md px-3.5 py-1.5 text-xs transition-all w-32 sm:w-44 focus-within:w-56 focus-within:border-[#cfa851] focus-within:bg-black/50">
              <Search className="w-3.5 h-3.5 text-zinc-300 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search brews..."
                className="w-full bg-transparent text-white placeholder-zinc-300/70 text-xs focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="text-zinc-400 hover:text-white ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#120b08]/95 border border-[#3e271c] shadow-2xl p-3 text-xs z-50 backdrop-blur-xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2 px-1">
                  Search Results ({searchResults.length})
                </span>

                {searchResults.length === 0 ? (
                  <p className="py-4 text-center text-zinc-400 text-xs">No coffee or confectionery found.</p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          onOpenProductDetail(prod);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#251710] cursor-pointer transition"
                      >
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-800"
                          />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-100 truncate">{prod.name}</p>
                          <p className="text-[11px] font-mono text-[#cfa851]">
                            ₹{prod.salePrice || prod.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shopping Bag Icon with Count Badge */}
          <button
            onClick={onOpenCart}
            title="View Order Bag"
            className="relative p-2 rounded-full text-zinc-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#cfa851] text-zinc-950 font-mono text-[9px] font-black flex items-center justify-center shadow">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Admin Launcher Link */}
          <button
            onClick={onOpenAdmin}
            title="Admin Control Center"
            className="text-[10px] font-mono uppercase tracking-widest text-[#fae8be]/80 hover:text-[#fae8be] px-2.5 py-1 rounded-full border border-white/20 hover:border-[#cfa851] transition"
          >
            Admin
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-zinc-200 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 p-4 rounded-2xl bg-[#120b08]/95 border border-[#3e271c] shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
          <nav className="flex flex-col gap-3 text-xs font-mono tracking-wider">
            <a
              href="#top"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-zinc-300 hover:text-white border-b border-[#251710]"
            >
              BREW HOME
            </a>
            <a
              href="#coffee-menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-zinc-300 hover:text-white border-b border-[#251710]"
            >
              OUR BREW
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAccount();
              }}
              className="py-1.5 text-left text-zinc-300 hover:text-[#cfa851] border-b border-[#251710] flex items-center justify-between"
            >
              <span>MY SECRET (Account & Orders)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenTracking();
              }}
              className="py-1.5 text-left text-zinc-300 hover:text-[#cfa851]"
            >
              TRACK ORDER
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
