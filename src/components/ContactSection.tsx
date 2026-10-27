import React from 'react';
import {
  Clock,
  Send,
  Smartphone
} from 'lucide-react';

interface ContactSectionProps {
  onOpenLegal: (tab: 'terms' | 'rental' | 'privacy' | 'pricing' | 'damage' | 'return') => void;
  onOpenMyBooking: () => void;
  onOpenListPhone: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenLegal }) => {
  return (
    <footer id="contact" className="bg-slate-900 text-white pt-12 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-6 text-center sm:text-left">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-black text-white tracking-tight">
                  Chandan Store
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Official Telegram Support Link */}
              <div id="telegram-support" className="flex items-center gap-3 scroll-mt-24 p-2 rounded-xl transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Official Telegram Support</span>
                  <a
                    href="https://t.me/Chandanstoresupport"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sky-300 hover:text-sky-200 flex items-center gap-1.5 transition-colors"
                  >
                    <span>t.me/Chandanstoresupport</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-black tracking-wide">
                      Connect
                    </span>
                  </a>
                </div>
              </div>

              <div id="operating-hours" className="flex items-center gap-3 scroll-mt-24 p-2 rounded-xl transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Operating Hours</span>
                  <span className="text-slate-300">Monday &ndash; Sunday: 9:00 AM &ndash; 10:00 PM IST</span>
                </div>
              </div>
            </div>

            {/* Footer Legal & Policy Links */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="hover:text-white transition-colors cursor-pointer underline underline-offset-4"
              >
                Terms of Use & Conditions
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('rental')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Rental Agreement
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('return')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                10 Din Return Policy
              </button>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};
