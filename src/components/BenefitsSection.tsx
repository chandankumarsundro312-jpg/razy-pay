import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Camera,
  Coins,
  Smile,
  Clock,
  Sparkles
} from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: Coins,
      title: 'Unmatched Refurbished Prices',
      desc: 'Get your dream iPhone at direct wholesale refurbished rates. No massive showroom markups.'
    },
    {
      icon: Sparkles,
      title: 'Zero Extra Charges',
      desc: 'No hidden processing fees, no surprise documentation charges, and no platform markups.'
    },
    {
      icon: Camera,
      title: 'Certified Refurbished Flagships',
      desc: 'From iPhone 16 Pro Max to Samsung Galaxy S25 Ultra, get genuine tested flagships with flawless cameras.'
    },
    {
      icon: ShieldCheck,
      title: '42-Point Quality Inspected',
      desc: 'Every refurbished phone passes 42-point hardware tests for 100% battery health, genuine display, and original parts.'
    },
    {
      icon: Zap,
      title: 'Direct UPI Payment',
      desc: 'Pay directly using any UPI app (GPay, PhonePe, Paytm, BHIM) to official merchant QR code with instant UTR receipt.'
    },
    {
      icon: Clock,
      title: 'No Complex KYC Required',
      desc: 'Quick 2-minute order process without passwords, OTPs, or complicated delays. Simple and fast.'
    }
  ];

  return (
    <section id="benefits" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-black uppercase tracking-wider">
            Certified Quality
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Why Choose Refurbished From Chandan Store?
          </h2>
          <p className="text-sm text-slate-500">
            Enjoy premium refurbished flagship smartphone technology with just ₹2,000 down payment and zero extra charges.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-300 space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base font-black text-slate-900">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
