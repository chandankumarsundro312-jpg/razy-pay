import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { PaymentClaim, RentalBooking } from '../types';
import { api } from '../utils/api';

interface MyPaymentsModalProps {
  onClose: () => void;
  onOpenSubmitPayment: (bookingId?: string) => void;
  onOpenScreenshotUpload: (bookingId?: string) => void;
  onOpenBookingLookup: (bookingId?: string) => void;
}

export const MyPaymentsModal: React.FC<MyPaymentsModalProps> = ({
  onClose,
  onOpenSubmitPayment,
  onOpenScreenshotUpload,
  onOpenBookingLookup
}) => {
  const [searchPhone, setSearchPhone] = useState(() => {
    try {
      const stored = localStorage.getItem('cs_customer_phone');
      return stored || '';
    } catch {
      return '';
    }
  });
  const [searchBookingId, setSearchBookingId] = useState('');
  const [activeSearchTab, setActiveSearchTab] = useState<'phone' | 'booking'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentClaim[]>([]);
  const [relatedBookings, setRelatedBookings] = useState<RentalBooking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Zoomed screenshot preview
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);

  // Auto-search if stored phone exists
  useEffect(() => {
    if (searchPhone.trim().length >= 10) {
      handleSearchByPhone(searchPhone.trim());
    }
  }, []);

  const handleSearchByPhone = async (phoneVal: string) => {
    const cleanPhone = phoneVal.trim().replace(/\D/g, '');
    if (cleanPhone.length < 5) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setHasSearched(true);
      try {
        localStorage.setItem('cs_customer_phone', cleanPhone);
      } catch {}

      const res = await api.getMyOrders(cleanPhone);
      setPayments(res.payments || []);
      setRelatedBookings(res.bookings || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to retrieve payment records.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchByBooking = async (bIdVal: string) => {
    const cleanId = bIdVal.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg('Please enter a valid Booking Reference.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setHasSearched(true);

      // Using phone if available, or prompt
      const phoneToUse = searchPhone.trim() || '0000000000';
      const res = await api.lookupBooking(cleanId, phoneToUse).catch(async () => {
        // Fallback: try search with empty or query orders
        return null;
      });

      if (res && res.paymentClaim) {
        setPayments([res.paymentClaim]);
        if (res.booking) setRelatedBookings([res.booking]);
      } else {
        // Search in general orders
        if (searchPhone.trim()) {
          const ordersRes = await api.getMyOrders(searchPhone.trim());
          const matchPayment = (ordersRes.payments || []).filter(p => p.bookingId.toUpperCase() === cleanId);
          setPayments(matchPayment);
          setRelatedBookings(ordersRes.bookings || []);
        } else {
          setPayments([]);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No payment claim found for this booking.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified & Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Verification Rejected
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            Refunded
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Admin Verification
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-slate-900">
                My Payments & Receipts
              </h3>
              <p className="text-[11px] text-slate-500">
                Track UPI transaction approvals, verification status & payment proofs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Search Toggle */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveSearchTab('phone');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
                activeSearchTab === 'phone'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lookup by Contact Phone
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSearchTab('booking');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
                activeSearchTab === 'booking'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lookup by Booking Reference
            </button>
          </div>

          {/* Search Input Bar */}
          {activeSearchTab === 'phone' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchByPhone(searchPhone);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Find Payments</span>
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchByBooking(searchBookingId);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchBookingId}
                  onChange={(e) => setSearchBookingId(e.target.value)}
                  placeholder="Enter Booking Reference (e.g. CS-BKG-123456)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 uppercase focus:outline-none focus:border-indigo-600"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>
            </form>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Action Strip */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-indigo-950">
                Made a UPI payment? Submit your UTR or screenshot for prompt verification.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubmitPayment();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Submit UTR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScreenshotUpload();
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                <span>Upload Proof</span>
              </button>
            </div>
          </div>

          {/* Payments List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Payment Records ({payments.length})</span>
              {hasSearched && (
                <span className="text-[11px] text-slate-400 font-normal">
                  Updated just now
                </span>
              )}
            </h4>

            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const matchedBooking = relatedBookings.find(b => b.id === payment.bookingId);
                  return (
                    <div
                      key={payment.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {payment.id}
                            </span>
                            {getStatusBadge(payment.status)}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Booking Reference:{' '}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenBookingLookup(payment.bookingId);
                              }}
                              className="font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              {payment.bookingId}
                            </button>
                            {matchedBooking && ` • ${matchedBooking.phoneModel}`}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-mono-num font-black text-base text-slate-900">
                            ₹{payment.claimedAmount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            UPI Transaction ID / UTR
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {payment.upiTxnId}
                          </span>
                        </div>

                        {payment.screenshotUrl ? (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Payment Proof
                              </span>
                              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Screenshot Attached
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setZoomedScreenshot(payment.screenshotUrl || null)}
                              className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-amber-700 block">
                                Proof Missing
                              </span>
                              <span className="text-[11px] text-amber-900">
                                Attach screenshot for quick approval
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenScreenshotUpload(payment.bookingId);
                              }}
                              className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                            >
                              Upload
                            </button>
                          </div>
                        )}
                      </div>

                      {payment.adminNotes && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                          <strong className="text-slate-800">Admin Remark: </strong>
                          {payment.adminNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : hasSearched ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-xs text-slate-700">No payment records found</p>
                <p className="text-[11px] text-slate-500">
                  If you recently made a payment, please submit your 12-digit UPI UTR to log the payment.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSubmitPayment();
                  }}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-900 text-white text-xs font-bold cursor-pointer"
                >
                  Submit Payment Claim
                </button>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-xs text-slate-700">Lookup your payments</p>
                <p className="text-[11px] text-slate-500">
                  Enter your mobile number or booking reference above to view your payment history.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <a
            href="https://t.me/Chandanstoresupport"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-sky-700 font-bold hover:underline"
          >
            Need payment help? Contact Telegram Support: t.me/Chandanstoresupport
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Zoomed Screenshot Modal */}
      {zoomedScreenshot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900">Payment Screenshot Proof</h4>
              <button
                type="button"
                onClick={() => setZoomedScreenshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={zoomedScreenshot}
              alt="Payment Proof"
              className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
