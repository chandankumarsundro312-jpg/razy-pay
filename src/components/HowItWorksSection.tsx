import React from 'react';
import {
  Smartphone,
  QrCode,
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface HowItWorksProps {
  onExploreClick: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({ onExploreClick }) => {
  const steps = [
    {
      num: '01',
      icon: Smartphone,
      title: 'Select Refurbished Phone',
      desc: 'Browse certified refurbished iPhones, Samsung Galaxy Ultras, Pixel and OnePlus flagships with warranty.'
    },
    {
      num: '02',
      icon: QrCode,
      title: 'Pay via Official UPI QR',
      desc: 'No extra charge! Pay your order price via official UPI QR using PhonePe, Google Pay, or Paytm and submit your 12-digit UTR.'
    },
    {
      num: '03',
      icon: Truck,
      title: 'Doorstep Delivery or Pickup',
      desc: 'Certified refurbished phone arrives sanitized in pristine condition with charger, original cable, and armor case.'
    },
    {
      num: '04',
      icon: RotateCcw,
      title: 'Zero Hidden Extra Charges',
      desc: 'Enjoy your certified refurbished flagship without extra documentation fee, processing cost, or surprise charges.'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black uppercase tracking-wider">
            Simple 4-Step Process
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How Buying Refurbished at Chandan Store Works
          </h2>
          <p className="text-sm text-slate-500">
            Just ₹2,000 down payment with absolutely zero extra charges or hidden fees. Simple, transparent refurbished flagships.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="relative p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-indigo-200 group-hover:text-indigo-400 transition-colors">
                      {st.num}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-900 shadow-xs group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-indigo-700" />
                    </div>
                  </div>

                  <h3 className="font-display text-base font-black text-slate-900 group-hover:text-indigo-900 transition-colors">
                    {st.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed mt-2">
                    {st.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-bold text-indigo-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chandan Store Verified</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={onExploreClick}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-700 hover:from-indigo-800 hover:to-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-900/20 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Order Your Refurbished iPhone Today</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
