import React from 'react';
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import { CartItem, PhoneListing } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (phoneId: string, quantity: number) => void;
  onRemoveItem: (phoneId: string) => void;
  onClearCart: () => void;
  onCheckoutItem: (phone: PhoneListing) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckoutItem
}) => {
  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((acc, item) => {
    const itemPrice = item.phone.price || item.phone.dailyPrice || 2000;
    return acc + itemPrice * item.quantity;
  }, 0);

  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Fullscreen Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
              <span className="hidden sm:inline">Back to Store</span>
            </button>

            <div className="h-6 w-px bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-base sm:text-lg font-black tracking-tight leading-tight">
                  Shopping Cart ({totalItemCount} {totalItemCount === 1 ? 'device' : 'devices'})
                </h1>
                <p className="text-[11px] text-slate-300 hidden sm:block">
                  Chandan Store • 6 Month Warranty & 10 Days Return Guarantee
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1 py-1.5 px-3 rounded-xl bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Cart</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </header>

      {/* Main Fullscreen Body */}
      <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {cartItems.length === 0 ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16 space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShoppingCart className="w-12 h-12" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-black text-slate-900">
                Your Shopping Cart is Empty
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Chandan Store ke sabhi certified refurbished phones 6 Month Official Warranty aur 10 Din Return Guarantee ke sath aate hain.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-8 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-800 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Browse Certified Flagships
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left 8 Cols: List of Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h2 className="font-display text-lg font-black text-slate-900">
                  Selected Flagship Phones
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {cartItems.length} {cartItems.length === 1 ? 'model' : 'models'} in your cart
                </span>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => {
                  const itemPrice = item.phone.price || item.phone.dailyPrice || 2000;
                  return (
                    <div
                      key={item.phone.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      {/* Image + Specs */}
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-200/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                          <img
                            src={item.phone.primaryImage}
                            alt={item.phone.model}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="min-w-0 space-y-1 flex-1 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Refurbished
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {item.phone.condition || 'Certified Pristine'}
                            </span>
                          </div>

                          <h3 className="font-display font-black text-base sm:text-lg text-slate-900 truncate">
                            {item.phone.model}
                          </h3>

                          <p className="text-xs text-slate-500">
                            Storage: <strong className="text-slate-800 font-semibold">{item.selectedStorage || item.phone.storage}</strong> • Color: <strong className="text-slate-800 font-semibold">{item.selectedColor || item.phone.color}</strong>
                          </p>

                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              <Shield className="w-3 h-3 text-indigo-600" />
                              6 Month Warranty
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <RotateCcw className="w-3 h-3 text-emerald-600" />
                              10 Din Return
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity, Item Total & Checkout Action */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.phone.id, item.quantity - 1)}
                            className="p-2 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3.5 font-mono-num font-black text-xs text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.phone.id, item.quantity + 1)}
                            className="p-2 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-[100px]">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Total</p>
                          <p className="font-mono-num font-black text-base text-emerald-700">
                            ₹{(itemPrice * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Fast Order this specific phone */}
                        <button
                          type="button"
                          onClick={() => {
                            onCheckoutItem({
                              ...item.phone,
                              color: item.selectedColor || item.phone.color,
                              storage: item.selectedStorage || item.phone.storage
                            });
                          }}
                          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-indigo-900 text-white font-black text-xs shadow-xs hover:from-emerald-600 hover:to-indigo-800 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 uppercase tracking-wide"
                        >
                          <span>Order Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete from cart */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.phone.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guarantees Box */}
              <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Chandan Store Genuine Customer Assurance</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>6 Month Stamped Warranty</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <RotateCcw className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>10 Din No-Risk Return</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Doorstep Open Box Verification</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Order Summary & Checkout Card */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4 text-left">
                <h3 className="font-display text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Selected Devices:</span>
                    <span className="font-bold text-slate-800">{totalItemCount} Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cart Subtotal:</span>
                    <span className="font-mono-num font-bold text-slate-900">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Doorstep Delivery:</span>
                    <span>FREE (₹0)</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Extra Charges / Paper Fee:</span>
                    <span>₹0 (Zero Extra Charge)</span>
                  </div>
                  <div className="flex justify-between text-indigo-700 font-semibold">
                    <span>6 Month Warranty:</span>
                    <span>Included Free</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Total Payable</p>
                    <p className="font-mono-num font-black text-2xl text-slate-900">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Best Value
                  </span>
                </div>

                {/* Order Now Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (cartItems.length > 0) {
                      const firstItem = cartItems[0];
                      onCheckoutItem({
                        ...firstItem.phone,
                        color: firstItem.selectedColor || firstItem.phone.color,
                        storage: firstItem.selectedStorage || firstItem.phone.storage
                      });
                    }
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-900 hover:from-emerald-500 hover:to-indigo-800 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-emerald-400/30"
                >
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                  <span>Order Now • ₹{totalAmount.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200 ml-1" />
                </button>

                <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                  UPI QR Instant Verification and Cash on Delivery (₹501 advance token) available at checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
