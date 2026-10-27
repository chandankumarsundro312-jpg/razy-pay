import React, { useState } from 'react';
import {
  Smartphone,
  Search,
  PlusCircle,
  FileText,
  CreditCard,
  Shield,
  Menu,
  Sparkles,
  CheckCircle2,
  ShoppingCart,
  Share2,
  Check,
  Zap
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileDrawer: () => void;
  activeSectionTitle?: string;
  onNavigate: (sectionId: string) => void;
  onOpenListPhone: () => void;
  onOpenMyBooking: () => void;
  onOpenMyPayments: () => void;
  onOpenAdmin: () => void;
  onOpenRushPay?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
  isAdminLoggedIn: boolean;
  phoneCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileDrawer,
  activeSectionTitle = 'Home',
  onNavigate,
  onOpenListPhone,
  onOpenMyBooking,
  onOpenMyPayments,
  onOpenAdmin,
  onOpenRushPay,
  onOpenCart,
  cartCount = 0,
  isAdminLoggedIn,
  phoneCount = 6
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareSite = async () => {
    const shareData = {
      title: 'Chandan Store - Certified Refurbished Flagships',
      text: 'Explore premium refurbished iPhones with 6 Months Official Warranty & 10 Days Return Guarantee at Chandan Store! Zero hidden charges & Cash on Delivery available.',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          console.log('Error sharing:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Brand logo & Desktop Active Section indicator */}
          <div className="flex items-center gap-3">
            {/* Mobile Brand Logo */}
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex lg:hidden items-center gap-2 cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-900 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display text-base font-black tracking-tight text-slate-900">
                  Chandan Store
                </span>
                <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Refurbished
                </span>
              </div>
            </button>

            {/* Desktop Active Section Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Current Section:</span>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-950 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>{activeSectionTitle}</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Certified Refurbished • No Extra Charge</span>
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Cart Shortcut Button */}
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="View Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4 text-indigo-700" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-mono-num flex items-center justify-center -ml-0.5 shadow-xs">
                    {cartCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(0)</span>
                )}
              </button>
            )}

            {/* Quick Orders Button */}
            <button
              type="button"
              onClick={onOpenMyBooking}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/60 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">My Orders</span>
              <span className="sm:hidden">Orders</span>
            </button>

            {/* My Payments Shortcut */}
            <button
              type="button"
              onClick={onOpenMyPayments}
              className="hidden md:flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300/80 transition-colors cursor-pointer items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              <span>My Payments</span>
            </button>

            {/* List Your Phone Shortcut */}
            <button
              type="button"
              onClick={onOpenListPhone}
              className="hidden lg:flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300/80 transition-colors cursor-pointer items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>List Phone</span>
            </button>

            {/* Razy Pay Portal Button */}
            {onOpenRushPay && (
              <button
                type="button"
                onClick={onOpenRushPay}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 hover:from-blue-600 hover:to-indigo-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-900/20 active:scale-95"
                title="Open Razy Pay Financial Platform"
              >
                <Zap className="w-3.5 h-3.5 text-blue-200 fill-white" />
                <span className="hidden sm:inline">Razy Pay</span>
              </button>
            )}

            {/* Share Store Shortcut */}
            <button
              type="button"
              onClick={handleShareSite}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-900 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Share Chandan Store with friends"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Admin Portal Button */}
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAdminLoggedIn
                  ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
              title="Chandan Store Admin Dashboard (Server-Side Protected)"
            >
              <Shield className={`w-4 h-4 ${isAdminLoggedIn ? 'text-purple-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline text-[11px] font-semibold">
                {isAdminLoggedIn ? 'Admin Active' : 'Admin'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
