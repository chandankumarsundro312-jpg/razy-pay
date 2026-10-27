import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Sparkles,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  QrCode,
  Upload,
  Clock,
  ArrowRight,
  RefreshCw,
  Calendar,
  Layers,
  FileCheck2,
  Shield,
  Search,
  CreditCard,
  Lock
} from 'lucide-react';
import { PhoneListing, RentalBooking, PaymentClaim, QrSettings } from '../types';
import { api } from '../utils/api';
import { compressImage } from '../utils/imageCompress';

interface RentalBookingModalProps {
  phone: PhoneListing;
  initialDays?: number;
  qrSettings?: QrSettings;
  onClose: () => void;
  onBookingSuccess: (booking: RentalBooking) => void;
}

export const RentalBookingModal: React.FC<RentalBookingModalProps> = ({
  phone,
  initialDays = 3,
  qrSettings,
  onClose,
  onBookingSuccess
}) => {
  // Wizard steps: 1: 'form' | 2: 'payment' | 3: 'claim' | 4: 'success'
  const [step, setStep] = useState<'form' | 'payment' | 'claim' | 'success'>('form');

  // Customer Form State (No Login Required)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1 + initialDays);
    return d.toISOString().split('T')[0];
  });
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Mandatory Aadhaar Card Verification State
  const [aadhaarCardUrl, setAadhaarCardUrl] = useState<string | null>(null);
  const [aadhaarFileName, setAadhaarFileName] = useState('');
  const [isUploadingAadhaar, setIsUploadingAadhaar] = useState(false);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  // Auto PIN Code Verification & Post Office State
  const [pincode, setPincode] = useState('');
  const [isVerifyingPincode, setIsVerifyingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [postOffices, setPostOffices] = useState<string[]>([]);
  const [selectedPostOffice, setSelectedPostOffice] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');

  const [notes, setNotes] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Created Booking State
  const [createdBooking, setCreatedBooking] = useState<RentalBooking | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Auto verify PIN code when 6 digits are typed
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    setPincodeError(null);

    if (clean.length === 6) {
      try {
        setIsVerifyingPincode(true);
        const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const poList: string[] = data[0].PostOffice.map((po: any) => po.Name);
          setPostOffices(poList);
          setSelectedPostOffice(poList[0] || '');
          setDistrict(data[0].PostOffice[0].District || '');
          setStateName(data[0].PostOffice[0].State || '');
          setPincodeError(null);
        } else {
          setPostOffices([]);
          setSelectedPostOffice('');
          setDistrict('');
          setStateName('');
          setPincodeError('Invalid PIN code. Please enter a valid 6-digit Indian PIN code.');
        }
      } catch (err) {
        setPincodeError('Could not verify PIN code online. You can still proceed with manual address.');
      } finally {
        setIsVerifyingPincode(false);
      }
    } else {
      setPostOffices([]);
      setSelectedPostOffice('');
      setDistrict('');
      setStateName('');
    }
  };

  // Upload and compress Aadhaar Card image
  const handleAadhaarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBookingError('Please upload an image file (JPG, PNG, WEBP) of your Aadhaar Card.');
      return;
    }

    try {
      setIsUploadingAadhaar(true);
      setAadhaarFileName(file.name);
      const compressedDataUrl = await compressImage(file, 1600, 0.85);
      setAadhaarCardUrl(compressedDataUrl);
      setBookingError(null);
    } catch (err) {
      console.error('Failed to compress Aadhaar Card image:', err);
      setBookingError('Failed to process Aadhaar image. Please try another photo.');
    } finally {
      setIsUploadingAadhaar(false);
    }
  };

  // Payment QR State
  const exactUpiId = qrSettings?.upiId || 'wallepayy@naviaxis';
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  // Payment Claim State (UTR submission)
  const [upiTxnId, setUpiTxnId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<PaymentClaim | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Razorpay Gateway State & Checkout Handler
  const [isPayingRazorpay, setIsPayingRazorpay] = useState(false);
  const [razorpaySuccessMsg, setRazorpaySuccessMsg] = useState<string | null>(null);

  const handleRazorpayCheckout = async () => {
    if (!createdBooking) return;
    try {
      setIsPayingRazorpay(true);
      setClaimError(null);

      // 1. Create order on backend
      const orderData = await api.createRazorpayOrder({
        bookingId: createdBooking.id,
        amount: createdBooking.totalPayable,
        customerPhone: createdBooking.customerPhone,
        customerName: createdBooking.customerName
      });

      // 2. Check if window.Razorpay script loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay SDK is loading. Please check your internet connection and try again.');
      }

      // 3. Launch Razorpay Standard Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: orderData.merchantName || 'Chandan Store',
        description: `Order ${createdBooking.id} • ${phone.model}`,
        image: phone.primaryImage || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=300&q=80',
        order_id: orderData.orderId,
        prefill: {
          name: createdBooking.customerName,
          contact: createdBooking.customerPhone,
          email: 'chandankumarsundro312@gmail.com'
        },
        theme: {
          color: '#312e81' // Indigo 900
        },
        handler: async function (response: any) {
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: createdBooking.id,
              amount: createdBooking.totalPayable
            });

            if (verifyRes.success) {
              setRazorpaySuccessMsg(`Payment of ₹${createdBooking.totalPayable.toLocaleString('en-IN')} successfully verified via Razorpay!`);
              if (verifyRes.booking) {
                setCreatedBooking(verifyRes.booking);
                onBookingSuccess(verifyRes.booking);
              }
            }
          } catch (verErr: any) {
            setClaimError(verErr.message || 'Payment completed but verification failed. Please contact support.');
          } finally {
            setIsPayingRazorpay(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPayingRazorpay(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (failRes: any) {
        console.error('Razorpay payment failed:', failRes.error);
        setClaimError(failRes.error?.description || 'Payment was unsuccessful or cancelled.');
        setIsPayingRazorpay(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Failed to initiate Razorpay checkout:', err);
      setClaimError(err.message || 'Could not initiate Razorpay checkout.');
      setIsPayingRazorpay(false);
    }
  };

  // Date calculation
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  const totalDays = Math.max(1, Math.ceil((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Rate calculator
  const calculateCharges = (d: number) => {
    if (d >= 30) {
      const months = Math.floor(d / 30);
      const rem = d % 30;
      return months * phone.monthlyPrice + rem * phone.dailyPrice;
    } else if (d >= 7) {
      const weeks = Math.floor(d / 7);
      const rem = d % 7;
      return weeks * phone.weeklyPrice + rem * phone.dailyPrice;
    }
    return d * phone.dailyPrice;
  };

  const [paymentMode, setPaymentMode] = useState<'online' | 'cod'>('online');
  const fullPhonePrice = phone.price || phone.dailyPrice || 2000;
  const codProcessingFee = 501;
  const totalPayableNow = paymentMode === 'cod' ? codProcessingFee : fullPhonePrice;
  const codBalanceOnDelivery = Math.max(0, fullPhonePrice - codProcessingFee);
  const totalPayable = totalPayableNow;

  // Generate dynamic QR Code using exact UPI ID when booking is ready
  useEffect(() => {
    if (!createdBooking) return;
    let isMounted = true;

    const generateQr = async () => {
      try {
        // Standard NPCI UPI URI with exact payable amount
        const upiAmount = createdBooking.totalPayable || totalPayable;
        const upiUri = `upi://pay?pa=${encodeURIComponent(exactUpiId)}&pn=${encodeURIComponent(
          'Chandan Store'
        )}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(
          `Refurbished ${phone.model} Ref ${createdBooking.id}`
        )}`;

        const url = await QRCode.toDataURL(upiUri, {
          width: 320,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });
        if (isMounted) setGeneratedQrUrl(url);
      } catch (err) {
        console.error('Failed to generate payment QR code:', err);
      }
    };

    generateQr();
    return () => {
      isMounted = false;
    };
  }, [createdBooking, exactUpiId, phone.model]);

  // Handle Initial Booking Submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!customerName.trim()) {
      setBookingError('Please enter your full customer name.');
      return;
    }

    const cleanPhone = customerPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setBookingError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    if (totalDays < 1) {
      setBookingError('Rental end date must be on or after start date.');
      return;
    }

    if (!pincode || pincode.length !== 6) {
      setBookingError('Please enter a valid 6-digit PIN code.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setBookingError('Please enter your complete doorstep delivery street address.');
      return;
    }

    if (!aadhaarCardUrl) {
      setBookingError('Aadhaar Card upload is mandatory! Please upload a clear photo of your Aadhaar Card.');
      return;
    }

    if (!acceptedTerms) {
      setBookingError('You must accept the Chandan Store rental agreement.');
      return;
    }

    try {
      setIsSubmittingBooking(true);
      const res = await api.createBooking({
        phoneId: phone.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        startDate,
        endDate,
        fulfillmentType,
        deliveryAddress: deliveryAddress.trim(),
        pincode,
        postOffice: selectedPostOffice || undefined,
        district: district || undefined,
        state: stateName || undefined,
        aadhaarCardUrl,
        notes: notes.trim() || undefined,
        acceptedTerms: true,
        paymentMethod: paymentMode
      });

      setCreatedBooking(res.booking);
      setStep('payment');
      onBookingSuccess(res.booking);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Failed to create booking.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Handle Screenshot File Change
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setClaimError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsUploadingScreenshot(true);
      setClaimError(null);
      const compressed = await compressImage(file, 900, 0.85);
      setScreenshotUrl(compressed);
      setScreenshotFileName(file.name);
    } catch (err) {
      setClaimError('Failed to read and compress screenshot. Please try again.');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  // Handle UTR Claim Submission
  const handleSubmitPaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdBooking) return;
    setClaimError(null);

    const cleanUtr = upiTxnId.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 8) {
      setClaimError('Please enter a valid UPI Transaction ID / 12-digit UTR reference number.');
      return;
    }

    try {
      setIsSubmittingClaim(true);
      const res = await api.submitPaymentClaim({
        bookingId: createdBooking.id,
        upiTxnId: cleanUtr,
        claimedAmount: createdBooking.totalPayable,
        paymentTimestamp: new Date().toISOString(),
        screenshotUrl: screenshotUrl || undefined
      });

      setSubmittedClaim(res.paymentClaim);
      // Save credentials for instant Order section view
      const formattedPhone = customerPhone.trim().replace(/\D/g, '');
      localStorage.setItem('last_booking_id', createdBooking.id);
      localStorage.setItem('last_customer_phone', formattedPhone);
      setStep('success');
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Failed to submit payment details.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Display QR source: if admin uploaded a custom QR image, display that, else dynamic UPI QR
  const activeQrImage = qrSettings?.customQrUrl || generatedQrUrl;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
      <div className="relative w-full h-full flex flex-col bg-white overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-8 sm:py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-xs">
              CS
            </span>
            <div>
              <h3 className="font-display text-base font-black text-slate-900">
                {step === 'form' && 'Order Confirmation Form'}
                {step === 'payment' && 'QR Code UPI Payment'}
                {step === 'claim' && 'Submit Payment Details'}
                {step === 'success' && 'Order Request Submitted!'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Chandan Store • {phone.brand} {phone.model}
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

        {/* Modal Scroll Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* STEP 1: CUSTOMER BOOKING FORM */}
          {step === 'form' && (
            <form onSubmit={handleCreateBooking} className="space-y-4">
              {bookingError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Selected Phone Summary Bar */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
                <img
                  src={phone.primaryImage}
                  alt={phone.model}
                  className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-indigo-200/60 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {phone.model} {phone.color ? `(${phone.color})` : ''}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {phone.ram} • {phone.storage} • {phone.color ? `Colour: ${phone.color} • ` : ''}{phone.condition} Condition
                  </p>
                  <p className="text-[11px] font-bold text-emerald-800 font-mono-num mt-0.5">
                    Price: ₹{(phone.price || phone.dailyPrice || 2000).toLocaleString('en-IN')} • Express Delivery Available
                  </p>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Full Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210 (10 digits)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400">Used for order status lookup without login.</span>
                </div>
              </div>

              {/* PIN Code Auto-Verification & Post Office Selection */}
              <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Delivery Location</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {isVerifyingPincode && (
                    <span className="text-[11px] text-indigo-700 font-bold flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Verifying PIN...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* PIN Code Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      6-Digit PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="e.g. 400001, 110001, 800001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-indigo-600 bg-white"
                    />
                    {pincodeError && (
                      <p className="text-[11px] text-rose-600 font-medium">{pincodeError}</p>
                    )}
                  </div>

                  {/* Post Office Selection Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Choose Post Office / Area <span className="text-rose-500">*</span>
                    </label>
                    {postOffices.length > 0 ? (
                      <select
                        required
                        value={selectedPostOffice}
                        onChange={(e) => setSelectedPostOffice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-white text-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                      >
                        {postOffices.map((po) => (
                          <option key={po} value={po}>
                            {po}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder="Enter 6-digit PIN code to load post offices"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                {/* Auto-detected District & State pill indicator */}
                {district && stateName && (
                  <div className="flex items-center gap-2 text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-xl animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Verified: <strong>{selectedPostOffice}</strong>, District: <strong>{district}</strong>, State: <strong>{stateName}</strong>
                    </span>
                  </div>
                )}

                {/* Complete Street Address textarea */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    House / Flat No., Street & Landmark <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Building A, Near City Hospital"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>

              {/* Mandatory Aadhaar Card Verification Upload */}
              <div className="space-y-2 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-amber-700" />
                    <span>Upload Aadhaar Card (Mandatory ID Verification)</span>
                    <span className="text-rose-600 font-extrabold">*</span>
                  </label>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Mandatory
                  </span>
                </div>

                <input
                  type="file"
                  ref={aadhaarInputRef}
                  accept="image/*"
                  onChange={handleAadhaarUpload}
                  className="hidden"
                />

                {aadhaarCardUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-300 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={aadhaarCardUrl}
                        alt="Aadhaar Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Aadhaar Card Attached</span>
                        </span>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{aadhaarFileName || 'aadhaar_card_photo.jpg'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAadhaarCardUrl(null);
                        setAadhaarFileName('');
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploadingAadhaar}
                    onClick={() => aadhaarInputRef.current?.click()}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                      {isUploadingAadhaar ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {isUploadingAadhaar ? 'Processing Aadhaar photo...' : 'Click to Upload Aadhaar Card Photo'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        PNG, JPG, JPEG up to 10MB
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Order Cost Breakdown Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-indigo-50/50 border border-emerald-200/90 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Product Model:</span>
                  <span className="font-bold text-slate-900">
                    {phone.model} {phone.storage ? `(${phone.storage})` : ''} {phone.color ? `• ${phone.color}` : ''}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phone Price:</span>
                  <span className="font-mono-num font-black text-slate-900">₹{fullPhonePrice.toLocaleString('en-IN')}</span>
                </div>
                {paymentMode === 'cod' ? (
                  <>
                    <div className="flex justify-between text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <div>
                        <span className="font-bold block">COD Advance Booking Fee:</span>
                        <span className="text-[10px] text-amber-700">Token fee to confirm dispatch (payable now)</span>
                      </div>
                      <span className="font-mono-num font-black text-amber-900 text-sm">₹501</span>
                    </div>

                    <div className="flex justify-between text-slate-700 bg-slate-100/80 p-2 rounded-xl border border-slate-200">
                      <div>
                        <span className="font-bold block">Remaining Cash on Delivery:</span>
                        <span className="text-[10px] text-slate-500">
                          (₹{fullPhonePrice.toLocaleString('en-IN')} − ₹501 Advance)
                        </span>
                      </div>
                      <span className="font-mono-num font-black text-slate-900 text-sm">
                        ₹{codBalanceOnDelivery.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-200 pt-1.5">
                      <span>Total Payable Now:</span>
                      <span className="font-mono-num text-amber-700 text-base">₹501</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Extra Charges / Documentation / Security:</span>
                      <span className="font-bold text-emerald-700">₹0 (No Extra Charge)</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-200 pt-1.5">
                      <span>Total Payable Now:</span>
                      <span className="font-mono-num text-emerald-800 text-base">₹{totalPayable.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}

                {/* 6 Month Warranty & 10 Din Return Guarantee */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 bg-indigo-100/70 text-indigo-950 font-bold px-2 py-1 rounded-lg border border-indigo-200/80">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                    <span>6 Month Warranty</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-100/70 text-emerald-950 font-bold px-2 py-1 rounded-lg border border-emerald-200/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>10 Din Return Policy</span>
                  </div>
                </div>
              </div>

              {/* Rental Agreement Checkbox */}
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  I confirm that I have read and agree to the <strong>Chandan Store Terms & Conditions</strong>.
                </span>
              </label>

              {/* Primary Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Full Payment Button */}
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  onClick={() => setPaymentMode('online')}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    paymentMode === 'online'
                      ? 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-700 hover:from-indigo-800 hover:to-purple-600 text-white shadow-indigo-900/30'
                      : 'bg-white text-indigo-950 border-2 border-indigo-900 hover:bg-indigo-50'
                  }`}
                >
                  {isSubmittingBooking && paymentMode === 'online' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating UPI Payment QR...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 text-purple-300" />
                      <span>Pay ₹{fullPhonePrice.toLocaleString('en-IN')} via UPI QR (Full Payment)</span>
                    </>
                  )}
                </button>

                {/* 2. Cash on Delivery Button (with ₹501 deducted from total) */}
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  onClick={() => setPaymentMode('cod')}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    paymentMode === 'cod'
                      ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-amber-900/30 border-2 border-amber-500'
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 border-2 border-amber-300 hover:bg-amber-100/70'
                  }`}
                >
                  {isSubmittingBooking && paymentMode === 'cod' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Setting up Cash on Delivery...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 text-amber-600" />
                      <span>
                        Cash on Delivery (₹501 Advance • ₹{codBalanceOnDelivery.toLocaleString('en-IN')} on Delivery)
                      </span>
                    </>
                  )}
                </button>

                {paymentMode === 'cod' && (
                  <p className="text-[11px] text-center text-slate-500">
                    💡 COD Mode Selected: Pay ₹501 token advance now via UPI QR. Balance ₹{codBalanceOnDelivery.toLocaleString('en-IN')} (₹{fullPhonePrice.toLocaleString('en-IN')} − ₹501) doorstep delivery par cash/UPI se dena hai.
                  </p>
                )}
              </div>
            </form>
          )}

          {/* STEP 2: QR CODE & UPI PAYMENT INSTRUCTIONS */}
          {step === 'payment' && createdBooking && (
            <div className="space-y-4">
              {/* Reference & Amount Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                <div>
                  <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                    Order Reference Number
                  </span>
                  <span className="font-mono text-base font-black text-white">{createdBooking.id}</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Price (No Extra Charge)
                  </span>
                  <span className="font-mono-num text-xl font-black text-emerald-300">
                    ₹{(createdBooking.totalPayable || totalPayable).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Strict QR Payment Box as specified in Section 8 */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Merchant UPI Payment Rail</span>
                  </div>
                  <h4 className="font-display text-lg font-black text-slate-900">
                    Scan QR Code with Any UPI App
                  </h4>
                  <p className="text-xs text-slate-500">
                    Open Google Pay, PhonePe, Paytm, or BHIM and scan the QR below to pay the exact amount.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="relative inline-block mx-auto bg-white p-4 rounded-2xl border-2 border-indigo-200 shadow-md">
                  {activeQrImage ? (
                    <img
                      src={activeQrImage}
                      alt="Chandan Store Payment QR"
                      className="w-56 h-56 object-contain mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold">Generating Payment QR...</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsQrZoomed(!isQrZoomed)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white text-[10px] flex items-center gap-1 hover:bg-slate-900 cursor-pointer shadow-xs"
                    title="Enlarge QR Code"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>
                </div>

                {/* Zoomed QR Modal Backdrop */}
                {isQrZoomed && (
                  <div
                    onClick={() => setIsQrZoomed(false)}
                    className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer"
                  >
                    <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-3" onClick={(e) => e.stopPropagation()}>
                      <h4 className="text-sm font-bold text-slate-900">Scan to Pay Chandan Store</h4>
                      <p className="font-mono-num font-black text-2xl text-indigo-900">₹{createdBooking.totalPayable.toLocaleString('en-IN')}</p>
                      <img src={activeQrImage} alt="Zoomed QR" className="w-72 h-72 mx-auto object-contain" />
                      <button
                        type="button"
                        onClick={() => setIsQrZoomed(false)}
                        className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                      >
                        Close Zoom
                      </button>
                    </div>
                  </div>
                )}

                {/* Instant Scan Banner */}
                <div className="max-w-md mx-auto p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center gap-2 text-indigo-950 text-xs font-semibold">
                  <QrCode className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Scan QR code with PhonePe, Google Pay, Paytm, or BHIM</span>
                </div>

                {/* Razorpay Gateway Direct Checkout Option */}
                <div className="p-4 rounded-2xl bg-white border-2 border-indigo-600 shadow-sm text-center space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-purple-200" />
                      </div>
                      <div className="text-left">
                        <h5 className="font-bold text-xs text-slate-900">Razorpay Secure Online Checkout</h5>
                        <p className="text-[10px] text-slate-500">Instant UPI Apps, Credit/Debit Cards, Net Banking & Wallets</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Auto Verified
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isPayingRazorpay}
                    onClick={handleRazorpayCheckout}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-900 to-purple-900 hover:from-blue-600 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-900/25 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isPayingRazorpay ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                        <span>Opening Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-emerald-300" />
                        <span>Pay ₹{(createdBooking.totalPayable || totalPayable).toLocaleString('en-IN')} via Razorpay</span>
                      </>
                    )}
                  </button>

                  {razorpaySuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 text-left">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{razorpaySuccessMsg}</span>
                    </div>
                  )}
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-300"></div>
                  <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-400">OR SCAN NPCI UPI QR</span>
                  <div className="flex-grow border-t border-slate-300"></div>
                </div>

                {/* Important Notice */}
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  If paying directly via UPI QR scanner above, please click below to submit your 12-digit UPI UTR / Transaction ID so our administrators can verify your payment record.
                </p>

                {/* Action button: Submit Payment Details */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('claim')}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>I Paid via UPI QR • Submit UTR Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMIT PAYMENT DETAILS (UTR & PROOF) */}
          {step === 'claim' && createdBooking && (
            <form onSubmit={handleSubmitPaymentDetails} className="space-y-4">
              {claimError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{createdBooking.id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Price Payable:</span>
                  <span className="font-mono-num font-bold text-emerald-800">₹{(createdBooking.totalPayable || totalPayable).toLocaleString('en-IN')} (No Extra Charge)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Merchant UPI ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{exactUpiId}</span>
                </div>
              </div>

              {/* UPI UTR / Transaction ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">
                  UPI Transaction ID / 12-Digit UTR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={upiTxnId}
                  onChange={(e) => setUpiTxnId(e.target.value.toUpperCase())}
                  placeholder="e.g. 439281928374 (Found in PhonePe / GPay receipt)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 text-sm font-bold uppercase focus:outline-none focus:border-indigo-600 tracking-wider"
                />
                <span className="text-[10px] text-slate-400 block">
                  Check your UPI app's transaction history for the 12-digit numeric reference.
                </span>
              </div>

              {/* Payment Screenshot (Optional but recommended) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block">
                  Upload Payment Screenshot / QR Receipt (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100 text-center cursor-pointer transition-colors space-y-1.5"
                >
                  <Upload className="w-5 h-5 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">
                    {screenshotFileName ? screenshotFileName : 'Click to select payment screenshot image'}
                  </p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, or WebP up to 10MB</p>
                </div>

                {screenshotUrl && (
                  <div className="mt-2 p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Screenshot ready for submission</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotUrl(null);
                        setScreenshotFileName('');
                      }}
                      className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Payment Details Button */}
              <button
                type="submit"
                disabled={isSubmittingClaim || isUploadingScreenshot}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-700 hover:from-indigo-800 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-900/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingClaim ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Payment Claim...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4 text-purple-200" />
                    <span>Submit Payment Details</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('payment')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                ← Back to QR Code Payment
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS / PENDING CONFIRMATION STATE */}
          {step === 'success' && createdBooking && (
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Clock className="w-9 h-9 text-amber-600 animate-pulse" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Payment Pending Verification</span>
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                  Rental Request Under Verification
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We have received your payment claim with UTR reference. Our administrator will verify the merchant UPI statement and confirm your rental booking shortly.
                </p>
              </div>

              {/* Reference Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Booking Reference:</span>
                  <span className="font-bold text-slate-900">{createdBooking.id}</span>
                </div>
                {submittedClaim && (
                  <div className="flex justify-between text-slate-500">
                    <span>Payment Reference:</span>
                    <span className="font-bold text-slate-900">{submittedClaim.id}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Submitted UTR:</span>
                  <span className="font-bold text-indigo-900">{upiTxnId}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Smartphone:</span>
                  <span className="text-slate-800">{phone.model}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Price Paid:</span>
                  <span className="text-emerald-700 font-bold font-mono-num">₹{(createdBooking.totalPayable || totalPayable).toLocaleString('en-IN')} (No Extra Charge)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 text-left">
                <p className="font-bold">How to check your refurbished phone order?</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Your order is saved! Click <strong>"View My Order"</strong> below or tap <strong>"Orders"</strong> in the navigation anytime to track status in real-time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // Custom event to open Order section with this booking
                    const ph = customerPhone.trim().replace(/\D/g, '');
                    window.dispatchEvent(new CustomEvent('open_order_tracker', {
                      detail: { bookingId: createdBooking.id, phone: ph }
                    }));
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Search className="w-4 h-4" />
                  <span>View My Order Now</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
