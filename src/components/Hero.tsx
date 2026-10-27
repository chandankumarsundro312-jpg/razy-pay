import React from 'react';
import { Flame, Sparkles, Gift, Truck } from 'lucide-react';

interface HeroProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedBrand?: string;
  onBrandSelect?: (brand: string) => void;
  onExploreClick?: () => void;
  onListPhoneClick?: () => void;
}

export const Hero: React.FC<HeroProps> = () => {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-r from-amber-700 via-rose-800 to-purple-950 text-white py-6 sm:py-8 border-b-2 border-amber-400/40 shadow-inner">
      {/* Festive ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-25">
        <div className="absolute -top-10 left-10 w-72 h-72 rounded-full bg-amber-400 blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 right-10 w-72 h-72 rounded-full bg-rose-500 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          {/* Offer Heading & Details */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-wider shadow-sm">
              <Flame className="w-4 h-4 text-rose-600 fill-rose-600 animate-bounce" />
              <span>शुभ नवरात्रि महा ऑफर • Navratri Special Fest</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              Navratri Dhamaka: Refurbished iPhones at Unbeatable Festive Rates!
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/90 font-medium max-w-2xl">
              Celebrate this festive season with certified pristine iPhones. Free 20W Fast Charger, Premium Case & Tempered Glass with every festive order!
            </p>
          </div>

          {/* Highlights Box */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-2 sm:gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-300/30 text-center">
              <span className="block text-[10px] uppercase font-bold text-amber-200">Festive Gift</span>
              <span className="text-xs sm:text-sm font-black text-white flex items-center justify-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-300" />
                <span>Free Kit</span>
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-amber-400 text-amber-950 text-center font-bold shadow-md">
              <span className="block text-[10px] uppercase font-black text-amber-900">Delivery</span>
              <span className="text-xs sm:text-sm font-black flex items-center justify-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Express 24H</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
