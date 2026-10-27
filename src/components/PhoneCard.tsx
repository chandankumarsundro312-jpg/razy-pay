import React, { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  Truck,
  Sparkles,
  Cpu,
  Layers,
  RotateCcw,
  Shield,
  ShoppingCart,
  Share2,
  Check
} from 'lucide-react';
import { PhoneListing } from '../types';

interface PhoneCardProps {
  phone: PhoneListing;
  onViewDetails: (phone: PhoneListing) => void;
  onRentNow: (phone: PhoneListing) => void;
  onAddToCart?: (phone: PhoneListing) => void;
}

export const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  onViewDetails,
  onRentNow,
  onAddToCart
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const sharePrice = phone.price || phone.dailyPrice || 2000;
    const shareUrl = `${window.location.origin}/#details-${phone.id}`;
    const shareData = {
      title: `${phone.model} - Chandan Store`,
      text: `Check out Certified Refurbished ${phone.model} (${phone.storage}, ${phone.color}) for just ₹${sharePrice.toLocaleString('en-IN')} with 6 Months Official Warranty & 10 Days Return Guarantee at Chandan Store!`,
      url: shareUrl
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

    // Fallback: Copy link with summary to clipboard
    try {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // Fallback fallback
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };
  const isAvailable = phone.status === 'available';

  const conditionColor =
    phone.condition === 'Pristine'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : phone.condition === 'Like New'
      ? 'bg-blue-50 text-blue-800 border-blue-200'
      : 'bg-purple-50 text-purple-800 border-purple-200';

  return (
    <div
      onClick={() => onViewDetails(phone)}
      className="group rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden text-left cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-4/3 w-full bg-gradient-to-b from-slate-100 to-slate-50 overflow-hidden flex items-center justify-center p-4">
        <img
          src={phone.primaryImage || (phone.images && phone.images[0])}
          alt={`${phone.brand} ${phone.model}`}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // Fallback safe smartphone image
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80';
          }}
        />

        {/* Condition Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${conditionColor}`}
          >
            {phone.condition}
          </span>
          {phone.featured && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Popular</span>
            </span>
          )}
        </div>

        {/* Availability Badge & Share Button */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-900 shadow-md backdrop-blur-xs transition-all cursor-pointer border border-slate-200/80 active:scale-90"
            title="Share this phone with friends"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${
              isAvailable
                ? 'bg-emerald-500 text-white border-emerald-400'
                : phone.status === 'rented'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            {phone.status === 'available'
              ? 'Available'
              : phone.status === 'rented'
              ? 'Reserved'
              : 'Out of Stock'}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Brand, Model & Specs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span className="text-indigo-900 font-bold uppercase tracking-wider text-[11px]">
              {phone.brand}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>
                {phone.ram} • {phone.storage}
              </span>
            </span>
          </div>

          <h3 className="font-display text-lg font-black text-slate-900 group-hover:text-indigo-900 transition-colors line-clamp-1">
            {phone.model}
          </h3>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span className="truncate max-w-[140px]">
              Colour: <strong className="text-slate-800">{phone.color || 'Multiple Colours'}</strong>
            </span>
            <span className="text-indigo-700 font-medium truncate max-w-[150px]">
              {phone.specifications?.processor}
            </span>
          </div>
        </div>

        {/* Refurbished Pricing Box: ₹2,000 Down Payment & No Extra Charge */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-slate-50 to-indigo-50/50 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
              Refurbished Flagship
            </span>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
              No Extra Charge
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                Price
              </p>
              <p className="font-mono-num font-black text-base sm:text-lg text-emerald-700">
                ₹{(phone.price || phone.dailyPrice || 2000).toLocaleString('en-IN')}
                <span className="text-[10px] font-semibold text-slate-500 ml-1">only</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                Quality Grade
              </p>
              <p className="font-bold text-xs text-indigo-950">
                {phone.condition || 'Certified Pristine'}
              </p>
            </div>
          </div>

          {/* Guarantee banner */}
          <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">Extra Charges / Hidden Fees:</span>
            <span className="font-bold text-emerald-700">
              ₹0 (Zero Extra Charge)
            </span>
          </div>

          {/* 6 Month Warranty & 10 Days Return Guarantee Strip */}
          <div className="pt-1.5 border-t border-emerald-200/60 grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1 text-indigo-950 font-bold bg-indigo-100/70 py-1 px-1.5 rounded-lg border border-indigo-200/70">
              <Shield className="w-3 h-3 text-indigo-700 shrink-0" />
              <span className="truncate">6 Month Warranty</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-950 font-bold bg-emerald-100/70 py-1 px-1.5 rounded-lg border border-emerald-200/70">
              <RotateCcw className="w-3 h-3 text-emerald-700 shrink-0" />
              <span className="truncate">10 Din Return Policy</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Add to Cart + View Details */}
        <div className="pt-1 flex items-center gap-2">
          {onAddToCart && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isAvailable) onAddToCart(phone);
              }}
              disabled={!isAvailable}
              className={`p-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer ${
                isAvailable
                  ? 'border-indigo-300 bg-indigo-50/80 text-indigo-950 hover:bg-indigo-100 hover:border-indigo-400 shadow-2xs'
                  : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title="Add to Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 text-indigo-700" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(phone);
            }}
            disabled={!isAvailable}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
              isAvailable
                ? 'bg-gradient-to-r from-emerald-700 via-teal-800 to-indigo-900 hover:from-emerald-600 hover:to-indigo-800 text-white shadow-emerald-900/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
            <span className="truncate">
              {isAvailable
                ? `Order • ₹${(phone.price || phone.dailyPrice || 2000).toLocaleString('en-IN')}`
                : phone.status === 'rented'
                ? 'Sold Out'
                : 'Out of Stock'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
