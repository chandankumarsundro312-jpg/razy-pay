import React from 'react';
import {
  Home,
  Smartphone,
  Apple,
  Search,
  CreditCard,
  Layers,
  Menu,
  Shield,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { NavItem } from '../config/navigation';

interface BottomNavigationProps {
  activeSection: string;
  onNavigateItem: (item: NavItem) => void;
  onOpenMobileDrawer: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
  isAdminLoggedIn: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeSection,
  onNavigateItem,
  onOpenMobileDrawer,
  onOpenCart,
  cartCount = 0,
  isAdminLoggedIn
}) => {
  const isHomeActive = activeSection === 'home' || activeSection === '';
  const isIPhonesActive = activeSection === 'iphones';
  const isExploreActive = activeSection === 'explore' || activeSection === 'browse-available';
  const isCartActive = activeSection === 'cart';
  const isBookingActive =
    activeSection === 'my-booking' ||
    activeSection === 'my-payments' ||
    activeSection === 'rental-extension' ||
    activeSection === 'submit-payment' ||
    activeSection === 'screenshot-upload';
  const isDrawerActive =
    !isHomeActive && !isIPhonesActive && !isExploreActive && !isCartActive && !isBookingActive;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5 transition-all"
    >
      <div className="max-w-md mx-auto px-1 grid grid-cols-5 items-center">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() =>
            onNavigateItem({
              id: 'home',
              label: 'Home',
              hash: '#home',
              icon: Home,
              type: 'section'
            })
          }
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none ${
            isHomeActive
              ? 'text-indigo-900 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
              isHomeActive
                ? 'bg-indigo-100 text-indigo-900 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            <Home className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-bold">Home</span>
        </button>

        {/* 2. Cart */}
        <button
          type="button"
          onClick={() => {
            if (onOpenCart) {
              onOpenCart();
            } else {
              onNavigateItem({
                id: 'cart',
                label: 'Cart',
                hash: '#cart',
                icon: ShoppingCart,
                type: 'modal'
              });
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none relative ${
            isCartActive
              ? 'text-indigo-900 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-7 rounded-full flex items-center justify-center transition-all relative ${
              isCartActive
                ? 'bg-indigo-100 text-indigo-900 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-mono-num flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-bold">Cart</span>
        </button>

        {/* 3. Orders / Payments */}
        <button
          type="button"
          onClick={() =>
            onNavigateItem({
              id: 'my-booking',
              label: 'Orders',
              hash: '#my-booking',
              icon: Search,
              type: 'modal'
            })
          }
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none ${
            isBookingActive
              ? 'text-emerald-900 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
              isBookingActive
                ? 'bg-emerald-100 text-emerald-900 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            <Search className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-bold">Orders</span>
        </button>

        {/* 5. More / All Sections (opens the full drawer with every policy, admin portal, etc.) */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none ${
            isDrawerActive
              ? 'text-purple-900 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="All Categories & Sections"
        >
          <div
            className={`w-9 h-7 rounded-full flex items-center justify-center transition-all relative ${
              isDrawerActive
                ? 'bg-purple-100 text-purple-900 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            <Menu className="w-4 h-4" />
            {isAdminLoggedIn && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-bold">All Menus</span>
        </button>
      </div>
    </nav>
  );
};
