import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Search,
  ShieldCheck,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../utils/api';
import { RentalBooking } from '../types';

interface CustomerProfileModalProps {
  onClose: () => void;
  onOpenMyBookings: () => void;
  onOpenMyPayments: () => void;
  onOpenExplore: () => void;
  onOpenListPhone: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  onClose,
  onOpenMyBookings,
  onOpenMyPayments,
  onOpenExplore,
  onOpenListPhone
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active bookings counter
  const [activeBookingsCount, setActiveBookingsCount] = useState<number>(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState<number>(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cs_customer_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.city) setCity(parsed.city);

        if (parsed.phone) {
          fetchUserStats(parsed.phone);
        }
      } else {
        const storedPhone = localStorage.getItem('cs_customer_phone');
        if (storedPhone) {
          setPhone(storedPhone);
          fetchUserStats(storedPhone);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUserStats = async (userPhone: string) => {
    try {
      setIsLoadingOrders(true);
      const res = await api.getMyOrders(userPhone);
      const bList = res.bookings || [];
      setTotalBookingsCount(bList.length);
      const active = bList.filter(
        b => b.bookingStatus === 'Rental Active' || b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Payment Under Verification'
      );
      setActiveBookingsCount(active.length);
    } catch {
      // Ignore if none found
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profile = { name, phone, email, address, city };
      localStorage.setItem('cs_customer_profile', JSON.stringify(profile));
      if (phone) localStorage.setItem('cs_customer_phone', phone.replace(/\D/g, ''));
      setSavedSuccess(true);
      if (phone) fetchUserStats(phone);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
              <User className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-slate-900">
                Customer Profile & Preferences
              </h3>
              <p className="text-[11px] text-slate-500">
                Personalized rental preferences & quick order tracking
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

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Member Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                  Chandan Store Member
                </span>
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Member
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black tracking-tight">
                  {name || 'Valued Smartphone Renter'}
                </h4>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {phone ? `+91 ${phone}` : 'No phone linked yet'}
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-center">
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-indigo-300 block">Active Orders</span>
                  <span className="font-mono-num font-black text-sm">{activeBookingsCount}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-indigo-300 block">Total Orders</span>
                  <span className="font-mono-num font-black text-sm">{totalBookingsCount}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-300 block">Extra Charges</span>
                  <span className="font-mono-num font-black text-sm text-emerald-300">₹0 Extra</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMyBookings();
              }}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Search className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Track My Bookings</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMyPayments();
              }}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
              <span>My Payments & UTR</span>
            </button>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Personal Information & Delivery Details
            </h4>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile details saved successfully! Future bookings will auto-fill.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Mobile Number (Used for Lookups)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Default Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No., Street, Landmark"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Preferences</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenListPhone();
            }}
            className="text-xs font-bold text-purple-700 hover:underline cursor-pointer flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List phone & earn</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
