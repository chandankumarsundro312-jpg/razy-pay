import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Do I need to create a customer account to order a refurbished phone?',
      a: 'No! Chandan Store does not require customer login, password, or account signup. You can browse all refurbished phones, submit orders, and track your order status anytime using just your Order Reference Number and Contact Phone Number.'
    },
    {
      q: 'How does the ₹2,000 down payment work?',
      a: 'Chandan Store offers transparent refurbished smartphone orders starting with just ₹2,000 down payment. There are strictly zero hidden documentation charges, zero processing fees, and no extra charge.'
    },
    {
      q: 'Which payment methods are accepted?',
      a: 'We exclusively accept direct QR-code / UPI payments to our verified merchant UPI ID. You can scan using Google Pay, PhonePe, Paytm, or BHIM. After paying ₹2,000 down payment, simply submit your 12-digit UTR for fast verification.'
    },
    {
      q: 'Are there any extra charges or hidden fees?',
      a: 'No! There is absolutely no extra charge on your ₹2,000 down payment. All pricing is 100% transparent.'
    },
    {
      q: 'What accessories come included with the refurbished smartphone?',
      a: 'All refurbished phones arrive with an original fast charger, braided USB-C/Lightning cable, shockproof protective armor case, and pre-applied screen protector so your experience is ready out of the box.'
    },
    {
      q: 'What warranty is provided with refurbished phones?',
      a: 'Every refurbished phone undergoes strict 42-point hardware and software quality checks for 100% genuine parts, tested display, and battery health with guaranteed customer support.'
    }
  ];

  return (
    <section id="faq" className="py-16 sm:py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-black uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500">
            Everything you need to know about certified refurbished smartphones at Chandan Store.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-50/60 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <span className="font-display text-sm sm:text-base font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
