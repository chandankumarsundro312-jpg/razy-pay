import React from 'react';
import {
  X,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Sparkles,
  Users,
  Send
} from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
  onExplorePhones?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  onClose,
  onExplorePhones
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header with Breadcrumbs and Back Button */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Information & Support</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-black text-indigo-950">About Chandan Store</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-600 leading-relaxed flex-1">
          {/* Hero Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-950 via-indigo-900 to-purple-900 text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-purple-200 text-[10px] font-black uppercase tracking-wider border border-white/10 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-300" />
                <span>Certified Flagship Smartphone Platform</span>
              </span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
              About Chandan Store
            </h3>
            <p className="text-purple-200 text-xs sm:text-sm max-w-xl">
              We make the world's most desired flagship smartphones accessible to everyone in India with just ₹2,000 down payment and zero extra charges.
            </p>
          </div>

          {/* Our Story & Mission */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Our Story & Mission</span>
            </h4>
            <p>
              Founded by <strong>Chandan Kumar</strong>, Chandan Store was built with a simple conviction: you shouldn't have to spend ₹1,50,000 to shoot cinematic video on a family vacation, test your mobile apps across the latest iOS and Android operating systems, or carry a pristine flagship to a high-profile business conference.
            </p>
            <p>
              We provide authentic Apple iPhones, Samsung Galaxy flagships, Google Pixel computational photography beasts, and OnePlus flagships with certified refurbished quality, starting with just <strong>₹2,000 down payment and zero extra charges</strong>.
            </p>
          </div>

          {/* Pillars of Chandan Store */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">100% Genuine Fleet</h5>
              <p className="text-[11px] text-slate-500">
                Every unit undergoes 36-point diagnostic inspection and comes with original chargers and cases.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Users className="w-4 h-4 text-indigo-700" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">Instant Booking</h5>
              <p className="text-[11px] text-slate-500">
                Book in minutes with quick verification. Track orders easily using your booking reference number and phone.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 text-purple-700" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">Express Delivery</h5>
              <p className="text-[11px] text-slate-500">
                Same-day delivery across Mumbai & Pune; expedited air express across Pan-India metro centers.
              </p>
            </div>
          </div>

          {/* Physical Presence & Contact */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span>Headquarters & Pickup Lounge</span>
            </h5>
            <p className="text-slate-600 font-medium">
              Gandhi Nagar, Dukan No. 12, Patna, Bihar
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
              <a
                href="https://t.me/Chandanstoresupport"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-bold text-sky-700 hover:text-sky-800"
              >
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>Telegram: t.me/Chandanstoresupport</span>
              </a>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Open Mon–Sun: 9:00 AM – 9:00 PM IST</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer"
          >
            Close
          </button>

          {onExplorePhones && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onExplorePhones();
              }}
              className="px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
            >
              Browse Refurbished Catalog →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
