import React, { useState, useRef } from 'react';
import {
  X,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  FileCheck2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { PhoneListing } from '../types';
import { api } from '../utils/api';
import { compressImage } from '../utils/imageCompress';

interface ListPhoneModalProps {
  onClose: () => void;
  onSuccess: (newListing: PhoneListing) => void;
}

export const ListPhoneModal: React.FC<ListPhoneModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [ram, setRam] = useState('8GB');
  const [storage, setStorage] = useState('256GB');
  const [condition, setCondition] = useState<'Pristine' | 'Like New' | 'Excellent' | 'Good'>('Pristine');
  const [color, setColor] = useState('Titanium');
  const [dailyPrice, setDailyPrice] = useState('399');
  const [weeklyPrice, setWeeklyPrice] = useState('2299');
  const [monthlyPrice, setMonthlyPrice] = useState('6999');
  const [location, setLocation] = useState('Mumbai, Maharashtra');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [accessories, setAccessories] = useState('Original 30W Charger, Cable, Protective Case');
  const [description, setDescription] = useState('');
  const [rentalRules, setRentalRules] = useState('Return device in undamaged condition with all accessories.');
  const [screen, setScreen] = useState('6.7-inch OLED 120Hz Display');
  const [battery, setBattery] = useState('4,800 mAh Battery');
  const [camera, setCamera] = useState('48MP Quad Camera System');
  const [processor, setProcessor] = useState('Flagship Octa-Core Chipset');
  const [ownsPhoneConfirmed, setOwnsPhoneConfirmed] = useState(false);

  // Uploaded images state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingImage(true);
      setErrorMsg(null);
      const newImgs: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file, 900, 0.82);
          newImgs.push(compressed);
        }
      }

      setUploadedImages((prev) => [...prev, ...newImgs]);
    } catch (err) {
      setErrorMsg('Failed to process image file. Please try again.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!ownerName.trim() || !ownerPhone.trim() || !model.trim()) {
      setErrorMsg('Please complete all required fields (Owner Name, Phone, Brand, Model).');
      return;
    }

    if (!ownsPhoneConfirmed) {
      setErrorMsg('You must certify that you own or are authorized to rent this smartphone.');
      return;
    }

    const dPrice = Number(dailyPrice) || 0;

    if (dPrice < 50) {
      setErrorMsg('Daily rental price must be at least ₹50.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        brand,
        model: model.trim(),
        ram,
        storage,
        condition,
        color,
        dailyPrice: dPrice,
        weeklyPrice: Number(weeklyPrice) || dPrice * 6,
        monthlyPrice: Number(monthlyPrice) || dPrice * 22,
        securityDeposit: 0,
        location: location.trim(),
        deliveryAvailable,
        images: uploadedImages.length > 0
          ? uploadedImages
          : ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80'],
        accessories: accessories.split(',').map((s) => s.trim()).filter(Boolean),
        description: description.trim() || `Authentic ${model} available for rent on Chandan Store.`,
        rentalRules: rentalRules.trim(),
        screen,
        battery,
        camera,
        processor,
        ownsPhoneConfirmed: true
      };

      const res = await api.submitPhoneListing(payload);
      setSubmittedRef(res.referenceNumber);
      onSuccess(res.listing);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit phone listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <h3 className="font-display text-base font-black text-slate-900">
                List Your Phone for Rent
              </h3>
              <p className="text-[11px] text-slate-500">
                No customer account required • Monetize your spare flagship smartphone
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

        {/* Modal Scroll Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {submittedRef ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider">
                  Pending Admin Approval
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                  Listing Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Thank you for submitting your device to Chandan Store. Your phone listing reference is:
                </p>
                <p className="font-mono text-base font-black text-indigo-900 py-1">
                  {submittedRef}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <p className="text-slate-600">
                  <strong>What happens next?</strong>
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Our Chandan Store verification team will inspect your specifications and pricing within 24 hours. Once approved, your phone will appear live on the public storefront for customers to rent!
                </p>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Owner Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Owner Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Chandan Kumar"
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
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Brand <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Apple">Apple iPhone</option>
                    <option value="Samsung">Samsung</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Google">Google Pixel</option>
                    <option value="Other Android">Other Android</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Phone Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. iPhone 15 Pro, Galaxy S24 Ultra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Specs: RAM, Storage, Condition, Color */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">RAM</label>
                  <input
                    type="text"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    placeholder="8GB / 12GB"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Storage</label>
                  <input
                    type="text"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    placeholder="256GB"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold bg-white"
                  >
                    <option value="Pristine">Pristine (Flawless)</option>
                    <option value="Like New">Like New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Titanium / Black"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Upload Genuine Phone Photos <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100 text-center cursor-pointer transition-colors space-y-1"
                >
                  <Upload className="w-5 h-5 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">
                    {isProcessingImage ? 'Compressing photos...' : 'Click to select phone photos (Front, Back, Screen on)'}
                  </p>
                  <p className="text-[10px] text-slate-400">Multiple images supported. JPG, PNG, or WebP.</p>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden group">
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-90 hover:opacity-100 cursor-pointer shadow-xs"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing Section: Daily, Weekly, Monthly */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-950 block">
                    Rental Pricing Rates
                  </span>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-300">
                    Daily Rates
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Daily (₹)</label>
                    <input
                      type="number"
                      required
                      min="50"
                      value={dailyPrice}
                      onChange={(e) => setDailyPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Weekly (₹)</label>
                    <input
                      type="number"
                      required
                      min="200"
                      value={weeklyPrice}
                      onChange={(e) => setWeeklyPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">Monthly (₹)</label>
                    <input
                      type="number"
                      required
                      min="500"
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num text-xs font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    City / Pickup Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai, Andheri West"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Included Accessories
                  </label>
                  <input
                    type="text"
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    placeholder="Charger, Cable, Case"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Ownership Confirmation */}
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={ownsPhoneConfirmed}
                  onChange={(e) => setOwnsPhoneConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  I legally certify that I own this device or am fully authorized to list it for rental. I agree that Chandan Store will inspect the listing before making it live on the marketplace.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isProcessingImage}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-800 to-indigo-900 hover:from-purple-600 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Phone Listing...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-purple-200" />
                    <span>Submit Phone Listing for Approval</span>
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
