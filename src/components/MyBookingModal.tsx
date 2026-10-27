import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Truck,
  ShieldCheck,
  QrCode,
  Calendar,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { RentalBooking, PhoneListing, PaymentClaim, QrSettings } from '../types';
import { api } from '../utils/api';

import { ArrowLeft, Repeat, Send } from 'lucide-react';

interface MyBookingModalProps {
  initialMode?: 'lookup' | 'extension';
  initialBookingId?: string;
  initialPhone?: string;
  onClose: () => void;
  onOpenSubmitPayment?: (booking: RentalBooking) => void;
}

export const MyBookingModal: React.FC<MyBookingModalProps> = ({
  initialMode = 'lookup',
  initialBookingId = '',
  initialPhone = '',
  onClose,
  onOpenSubmitPayment
}) => {
  const [activeTab, setActiveTab] = useState<'lookup' | 'extension'>(initialMode);
  const [extensionDays, setExtensionDays] = useState<number>(3);
  const [extensionSubmitted, setExtensionSubmitted] = useState<boolean>(false);
  const [bookingIdInput, setBookingIdInput] = useState(() => {
    if (initialBookingId) return initialBookingId;
    return localStorage.getItem('last_booking_id') || '';
  });
  const [phoneInput, setPhoneInput] = useState(() => {
    if (initialPhone) return initialPhone;
    return localStorage.getItem('last_customer_phone') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [lookupResult, setLookupResult] = useState<{
    booking: RentalBooking;
    phone?: PhoneListing;
    paymentClaim?: PaymentClaim;
    qrSettings: QrSettings;
  } | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const bId = bookingIdInput.trim();
    const phone = phoneInput.trim();

    if (!bId || !phone) {
      setErrorMsg('Please enter both Booking Reference and Contact Phone Number.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.lookupBooking(bId, phone);
      setLookupResult(res);
      // Save for quick auto-lookup in order section
      localStorage.setItem('last_booking_id', bId);
      localStorage.setItem('last_customer_phone', phone);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No booking found matching those details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch if booking reference and phone are already available
  useEffect(() => {
    if (bookingIdInput && phoneInput && !lookupResult && !isLoading) {
      api.lookupBooking(bookingIdInput, phoneInput)
        .then((res) => setLookupResult(res))
        .catch(() => {});
    }
  }, []);

  const booking = lookupResult?.booking;
  const phone = lookupResult?.phone;
  const paymentClaim = lookupResult?.paymentClaim;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Rental Active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Payment Under Verification':
      case 'Payment Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelled':
      case 'Disputed':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
      <div className="relative w-full h-full flex flex-col bg-white overflow-hidden">
        {/* Header with Breadcrumbs & Back Button */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-8 sm:py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
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
            <span className="text-xs text-slate-500">Refurbished Orders & Payments</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-black text-indigo-950">
              {activeTab === 'extension' ? 'Order Support' : 'Order Status'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>




        {/* Modal Scroll Content */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Lookup Input Form */}
            <form onSubmit={handleLookup} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Booking Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={bookingIdInput}
                  onChange={(e) => setBookingIdInput(e.target.value.toUpperCase())}
                  placeholder="e.g. CS-BKG-84920"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Looking up booking...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{activeTab === 'extension' ? 'Get Order Support' : 'Track My Order'}</span>
                </>
              )}
            </button>
          </form>

          {/* Dedicated Order Support Guidance when tab is active */}
          {activeTab === 'extension' && !booking && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Repeat className="w-4 h-4 text-emerald-600" />
                <span>Refurbished Order Assistance & Support</span>
              </div>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                Enter your Order Reference Number and Phone number above to check shipment status, warranty assistance, or delivery queries. Strictly zero extra charges apply!
              </p>
              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 pt-1">
                <span>Direct Telegram Support:</span>
                <a
                  href="https://t.me/Chandanstoresupport"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>t.me/Chandanstoresupport</span>
                </a>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Rental Extension Form when Booking is Found */}
          {booking && activeTab === 'extension' && (
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-purple-600" />
                  <span>Request Support / Extension for {booking.phoneModel}</span>
                </h5>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  No Extra Charge
                </span>
              </div>

              {extensionSubmitted ? (
                <div className="p-3.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs space-y-1 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  <p className="font-bold">Request Submitted!</p>
                  <p className="text-[11px]">
                    We have registered your +{extensionDays} days extension request with zero extra charges. Our team will contact you or update the order status.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-600">
                    Select additional days for your current schedule ({booking.startDate} &rarr; {booking.endDate}):
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setExtensionDays(days)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          extensionDays === days
                            ? 'bg-purple-900 text-white shadow-xs'
                            : 'bg-white border border-purple-200 text-purple-900 hover:bg-purple-100'
                        }`}
                      >
                        +{days} {days === 1 ? 'day' : 'd'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-200 text-xs">
                    <span className="text-slate-600">Extra Charges ({extensionDays} days):</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      ₹0 (No Extra Charge)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExtensionSubmitted(true)}
                    className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
                  >
                    Confirm & Submit Request
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Booking Found Details */}
          {booking && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
              {/* Status Header Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Current Status
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(
                        booking.bookingStatus
                      )}`}
                    >
                      {booking.bookingStatus}
                    </span>
                    <span className="text-xs text-slate-500">• Payment: <strong>{booking.paymentStatus}</strong></span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Amount
                  </span>
                  <span className="font-mono-num font-black text-lg text-slate-900">
                    ₹{booking.totalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Phone Info Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3">
                <img
                  src={booking.phoneImage || phone?.primaryImage}
                  alt={booking.phoneModel}
                  className="w-14 h-14 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{booking.phoneModel}</h4>
                  <p className="text-xs text-slate-500">
                    {booking.totalDays} {booking.totalDays === 1 ? 'day' : 'days'} duration • {booking.startDate} to {booking.endDate}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    Certified Refurbished Flagship • No Extra Charge
                  </p>
                </div>
              </div>

              {/* Fulfillment & Dates */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Order Schedule:</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {booking.startDate} &rarr; {booking.endDate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    {booking.fulfillmentType === 'delivery' ? (
                      <Truck className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <MapPin className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Fulfillment:</span>
                  </span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {booking.fulfillmentType === 'delivery' ? 'Express Doorstep Delivery' : 'Store Pickup'}
                  </span>
                </div>

                {booking.deliveryAddress && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>Delivery Address: </span>
                    <strong className="text-slate-800">{booking.deliveryAddress}</strong>
                  </div>
                )}
              </div>

              {/* Payment Claim Details if submitted (UTR & Screenshot) */}
              {paymentClaim && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <span>Payment Claim & UTR Verification</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      paymentClaim.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : paymentClaim.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {paymentClaim.status === 'pending' ? 'Verification In Progress' : paymentClaim.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="flex justify-between sm:flex-col text-slate-600 bg-white p-2.5 rounded-xl border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Submitted UTR Reference</span>
                      <span className="font-mono font-black text-xs text-indigo-950 mt-0.5">{paymentClaim.upiTxnId}</span>
                    </div>

                    <div className="flex justify-between sm:flex-col text-slate-600 bg-white p-2.5 rounded-xl border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Claimed Amount</span>
                      <span className="font-mono font-black text-xs text-emerald-700 mt-0.5">₹{paymentClaim.claimedAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {paymentClaim.screenshotUrl && (
                    <div className="pt-2 border-t border-indigo-100 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Submitted Payment Screenshot:</span>
                      <div className="relative rounded-xl overflow-hidden border border-indigo-200 bg-white max-w-xs">
                        <img
                          src={paymentClaim.screenshotUrl}
                          alt="Payment Screenshot"
                          className="w-full h-40 object-contain bg-slate-50"
                        />
                      </div>
                    </div>
                  )}

                  {paymentClaim.adminNotes && (
                    <div className="text-[11px] text-slate-600 pt-1">
                      <span>Note from Admin: </span>
                      <strong className="text-slate-900">{paymentClaim.adminNotes}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* If still unpaid or pending payment submission */}
              {booking.paymentStatus === 'unpaid' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Payment Not Yet Submitted</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Please pay ₹{booking.totalPayable.toLocaleString('en-IN')} to UPI ID <strong>wallepayy@naviaxis</strong> and submit your 12-digit UTR reference.
                  </p>
                  {onOpenSubmitPayment && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSubmitPayment(booking);
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Submit Payment Details Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
