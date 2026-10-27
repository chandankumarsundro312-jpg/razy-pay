import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCheck2,
  Clock
} from 'lucide-react';
import { RentalBooking, PaymentClaim } from '../types';
import { api } from '../utils/api';
import { compressImage } from '../utils/imageCompress';

interface SubmitPaymentModalProps {
  initialBooking?: RentalBooking | null;
  initialMode?: 'payment' | 'screenshot';
  onClose: () => void;
  onSuccess: (paymentClaim: PaymentClaim) => void;
}

export const SubmitPaymentModal: React.FC<SubmitPaymentModalProps> = ({
  initialBooking,
  initialMode = 'payment',
  onClose,
  onSuccess
}) => {
  const [bookingId, setBookingId] = useState(initialBooking?.id || '');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [amount, setAmount] = useState(initialBooking ? String(initialBooking.totalPayable) : '');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<PaymentClaim | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMsg(null);
      const comp = await compressImage(file, 900, 0.85);
      setScreenshotUrl(comp);
      setScreenshotFileName(file.name);
    } catch (err) {
      setErrorMsg('Failed to process screenshot.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const bId = bookingId.trim().toUpperCase();
    const utr = upiTxnId.trim().toUpperCase();
    const numAmt = Number(amount) || 0;

    if (!bId) {
      setErrorMsg('Please enter your Booking Reference Number.');
      return;
    }

    if (!utr || utr.length < 8) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR / Transaction ID.');
      return;
    }

    if (numAmt <= 0) {
      setErrorMsg('Please enter the exact amount paid.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitPaymentClaim({
        bookingId: bId,
        upiTxnId: utr,
        claimedAmount: numAmt,
        paymentTimestamp: new Date().toISOString(),
        screenshotUrl: screenshotUrl || undefined
      });

      setSubmittedClaim(res.paymentClaim);
      onSuccess(res.paymentClaim);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit payment claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <h3 className="font-display text-base font-black text-slate-900">
                Submit UPI Payment Details
              </h3>
              <p className="text-[11px] text-slate-500">
                Link your 12-digit UTR reference with your booking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {submittedClaim ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 mx-auto flex items-center justify-center">
                <Clock className="w-9 h-9 text-amber-600 animate-pulse" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  Payment Under Verification
                </span>
                <h4 className="text-xl font-black text-slate-900">
                  Payment Claim Submitted
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Our Chandan Store accounts administrator will verify your UTR against merchant records and confirm your booking.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Payment Claim Ref:</span>
                  <span className="font-bold text-slate-900">{submittedClaim.id}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Booking Reference:</span>
                  <span className="font-bold text-slate-900">{submittedClaim.bookingId}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>UTR Reference:</span>
                  <span className="font-bold text-indigo-900">{submittedClaim.upiTxnId}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Claimed Amount:</span>
                  <span className="text-emerald-700 font-bold">₹{submittedClaim.claimedAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Booking Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.toUpperCase())}
                  placeholder="e.g. CS-BKG-84920"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  12-Digit UPI Transaction ID / UTR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={upiTxnId}
                  onChange={(e) => setUpiTxnId(e.target.value.toUpperCase())}
                  placeholder="e.g. 439281928374 (From PhonePe / GPay)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase focus:outline-none focus:border-indigo-600 tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Amount Paid (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Exact amount paid"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono-num text-xs font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Upload Payment Screenshot (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 text-center cursor-pointer space-y-1"
                >
                  <Upload className="w-4 h-4 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">
                    {screenshotFileName || 'Click to select screenshot image'}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-700 hover:from-indigo-800 hover:to-purple-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-900/20"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Payment...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4 text-purple-200" />
                    <span>Submit Payment Details</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
