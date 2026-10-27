import React, { useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Upload,
  CreditCard,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { QrSettings } from '../types';

interface UpiQrPaymentModalProps {
  qrSettings?: QrSettings | null;
  onClose: () => void;
  onOpenSubmitPayment: (mode: 'payment' | 'screenshot') => void;
}

export const UpiQrPaymentModal: React.FC<UpiQrPaymentModalProps> = ({
  qrSettings,
  onClose,
  onOpenSubmitPayment
}) => {
  const [copied, setCopied] = useState(false);

  const upiId = qrSettings?.upiId || 'wallepayy@naviaxis';
  const merchantName = qrSettings?.merchantName || 'Chandan Store';

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=2000&cu=INR&tn=${encodeURIComponent('Chandan Store Refurbished Down Payment')}`;
  const qrImage =
    qrSettings?.customQrUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header with Breadcrumbs & Back Button */}
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
            <span className="text-xs text-slate-500">Rental & Payments</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-black text-indigo-950">UPI QR Payment</span>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-center flex-1">
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                Official Merchant Payment Rail
              </span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-900 text-white text-[10px] font-black uppercase tracking-wider">
                Instant UPI Payment
              </span>
            </div>
            <h3 className="font-display text-xl font-black text-slate-900 tracking-tight mt-1.5">
              Scan & Pay via Any UPI App
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Google Pay • PhonePe • Paytm • BHIM • Cred • Zero Extra Charge
            </p>
          </div>

          {/* QR Code Container */}
          <div className="relative mx-auto w-56 h-56 p-3 bg-white rounded-3xl border-2 border-indigo-200 shadow-lg flex items-center justify-center">
            <img
              src={qrImage}
              alt="Chandan Store Merchant UPI QR"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          {/* UPI ID Copier */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
              Official Merchant UPI ID:
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 break-all select-all">
                {upiId}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white text-[11px] font-bold cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 transition-transform"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Verification Warning */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-left text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              After paying, remember to note the <strong>12-digit UTR (Bank Reference Number)</strong> or take a screenshot of your successful transaction to submit below.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSubmitPayment('screenshot');
            }}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Upload Screenshot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSubmitPayment('payment');
            }}
            className="py-2.5 px-3 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
            <span>Submit 12-Digit UTR →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
