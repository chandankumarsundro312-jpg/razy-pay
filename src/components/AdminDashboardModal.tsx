import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Shield,
  Layers,
  Smartphone,
  CreditCard,
  FileText,
  QrCode,
  Settings,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Trash2,
  Edit,
  Eye,
  Upload,
  Search,
  ExternalLink,
  Lock,
  LogOut,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import {
  PhoneListing,
  RentalBooking,
  PaymentClaim,
  QrSettings,
  AdminOverviewStats,
  AdminAuditLog,
  CustomNavItemConfig
} from '../types';
import { DEFAULT_NAV_CONFIG } from '../config/navigation';
import { api } from '../utils/api';
import { compressImage } from '../utils/imageCompress';
import { syncPhoneToFirestore, fetchPhonesFromFirestore, deletePhoneFromFirestore } from '../lib/firestoreService';

export type AdminTabType =
  | 'overview'
  | 'phones'
  | 'add-phone'
  | 'bookings'
  | 'payments'
  | 'qr-settings'
  | 'navigation'
  | 'logs';

interface AdminDashboardModalProps {
  initialTab?: AdminTabType;
  onClose: () => void;
  onRefreshData?: () => void;
  onTabChange?: (tab: AdminTabType) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  initialTab = 'overview',
  onClose,
  onRefreshData,
  onTabChange
}) => {
  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => !!api.getAdminToken());
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTabState] = useState<AdminTabType>(initialTab);

  const setActiveTab = (tab: AdminTabType) => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTabState(initialTab);
    }
  }, [initialTab]);

  // Data states
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [phones, setPhones] = useState<PhoneListing[]>([]);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [payments, setPayments] = useState<PaymentClaim[]>([]);
  const [qrSettings, setQrSettings] = useState<QrSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editing Phone State
  const [editingPhone, setEditingPhone] = useState<PhoneListing | null>(null);

  // Fleet Filter & Search State
  const [adminBrandFilter, setAdminBrandFilter] = useState<'All' | 'Apple' | 'Android'>('All');
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');

  // New / Edit Phone Form State
  const [formBrand, setFormBrand] = useState('Apple');
  const [formModel, setFormModel] = useState('');
  const [formRam, setFormRam] = useState('8GB');
  const [formStorage, setFormStorage] = useState('256GB');
  const [formCondition, setFormCondition] = useState<'Pristine' | 'Like New' | 'Excellent' | 'Good'>('Pristine');
  const [formColor, setFormColor] = useState('Titanium');
  const [formDailyPrice, setFormDailyPrice] = useState('150');
  const [formWeeklyPrice, setFormWeeklyPrice] = useState('900');
  const [formMonthlyPrice, setFormMonthlyPrice] = useState('2999');
  const [formSecurityDeposit, setFormSecurityDeposit] = useState('0');
  const [formStatus, setFormStatus] = useState<'available' | 'rented' | 'maintenance'>('available');
  const [formLocation, setFormLocation] = useState('Mumbai & Express Delivery');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formAccessories, setFormAccessories] = useState('30W Charger, Cable, MagSafe Case');
  const [formScreen, setFormScreen] = useState('6.9-inch Super Retina XDR OLED 120Hz');
  const [formBattery, setFormBattery] = useState('4,685 mAh Battery');
  const [formCamera, setFormCamera] = useState('48MP Quad Camera');
  const [formProcessor, setFormProcessor] = useState('A18 Pro Flagship CPU');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const photoUploadInputRef = useRef<HTMLInputElement>(null);

  // QR Code Settings State
  const [customQrImage, setCustomQrImage] = useState<string | null>(null);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>('');
  const qrImageUploadRef = useRef<HTMLInputElement>(null);

  // Navigation Manager State
  const [customNavItems, setCustomNavItems] = useState<CustomNavItemConfig[]>(DEFAULT_NAV_CONFIG);
  const [isSavingNav, setIsSavingNav] = useState(false);
  const [navCategoryFilter, setNavCategoryFilter] = useState<'all' | 'main-nav' | 'rental-payments' | 'info-support'>('all');

  // Screenshot Preview Modal
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  // Fetch all admin data
  const loadAdminData = async () => {
    try {
      setIsLoadingData(true);
      const [overviewRes, phonesRes, bookingsRes, paymentsRes, qrRes, logsRes, settingsRes, firestorePhones] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminPhones(),
        api.getAdminBookings(),
        api.getAdminPayments(),
        api.getQrSettings(),
        api.getAdminAuditLogs(),
        api.getSettings().catch(() => ({ settings: { navigationConfig: DEFAULT_NAV_CONFIG } as any })),
        fetchPhonesFromFirestore().catch(() => [])
      ]);

      const adminPhoneMap = new Map<string, PhoneListing>();
      (phonesRes.phones || []).forEach((p) => adminPhoneMap.set(p.id, p));
      (firestorePhones || []).forEach((p) => adminPhoneMap.set(p.id, p));
      const combinedAdminPhones = Array.from(adminPhoneMap.values());

      setStats(overviewRes.stats);
      setPhones(combinedAdminPhones);
      setBookings(bookingsRes.bookings);
      setPayments(paymentsRes.payments);
      setQrSettings(qrRes.qrSettings);
      setCustomQrImage(qrRes.qrSettings.customQrUrl || null);
      setAuditLogs(logsRes.auditLogs);

      if (settingsRes?.settings?.navigationConfig && settingsRes.settings.navigationConfig.length > 0) {
        setCustomNavItems(settingsRes.settings.navigationConfig);
      } else {
        setCustomNavItems(DEFAULT_NAV_CONFIG);
      }

      // Generate dynamic QR preview
      const upiUri = `upi://pay?pa=${encodeURIComponent(
        qrRes.qrSettings.upiId || 'wallepayy@naviaxis'
      )}&pn=Chandan%20Store&cu=INR`;
      const url = await QRCode.toDataURL(upiUri, { width: 280, margin: 1 });
      setDynamicQrUrl(url);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        setIsAdminLoggedIn(false);
        api.clearAdminToken();
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAdminData();
    }
  }, [isAdminLoggedIn]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      setIsLoggingIn(true);
      await api.adminLogin(adminPhone.trim(), adminPassword.trim());
      setIsAdminLoggedIn(true);
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid administrator credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    await api.adminLogout();
    setIsAdminLoggedIn(false);
    onClose();
  };

  // Populate form for editing
  const handleStartEditPhone = (phone: PhoneListing) => {
    setEditingPhone(phone);
    setFormBrand(phone.brand);
    setFormModel(phone.model);
    setFormRam(phone.ram);
    setFormStorage(phone.storage);
    setFormCondition(phone.condition);
    setFormColor(phone.color);
    setFormDailyPrice(String(phone.dailyPrice));
    setFormWeeklyPrice(String(phone.weeklyPrice));
    setFormMonthlyPrice(String(phone.monthlyPrice));
    setFormSecurityDeposit(String(phone.securityDeposit !== undefined ? phone.securityDeposit : 0));
    setFormStatus(phone.status || 'available');
    setFormLocation(phone.location);
    setFormImages(phone.images || [phone.primaryImage]);
    setFormAccessories((phone.accessories || []).join(', '));
    setFormScreen(phone.specifications?.screen || '');
    setFormBattery(phone.specifications?.battery || '');
    setFormCamera(phone.specifications?.camera || '');
    setFormProcessor(phone.specifications?.processor || '');
    setFormDescription(phone.description);
    setFormFeatured(!!phone.featured);
    setActiveTab('add-phone');
  };

  const handleResetPhoneForm = () => {
    setEditingPhone(null);
    setFormModel('');
    setFormImages([]);
    setFormDescription('');
    setFormStatus('available');
    setFormSecurityDeposit('0');
  };

  // Quick Toggle Phone Status (Available / Rented / Maintenance)
  const handleQuickStatusToggle = async (phone: PhoneListing, nextStatus: 'available' | 'rented' | 'maintenance') => {
    try {
      await api.updateAdminPhone(phone.id, { status: nextStatus });
      setFeedbackMsg({ type: 'success', text: `${phone.model} status updated to '${nextStatus}'` });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update phone status' });
    }
  };

  // Upload Photos to Phone form
  const handleUploadPhonePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const comp = await compressImage(files[i], 1000, 0.85);
          compressedList.push(comp);
        }
      }
      setFormImages((prev) => [...prev, ...compressedList]);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to process images.' });
    }
  };

  // Save / Update Phone
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModel.trim()) return;

    try {
      setIsSavingPhone(true);
      const payload = {
        brand: formBrand,
        model: formModel.trim(),
        ram: formRam,
        storage: formStorage,
        condition: formCondition,
        color: formColor,
        dailyPrice: Number(formDailyPrice),
        weeklyPrice: Number(formWeeklyPrice),
        monthlyPrice: Number(formMonthlyPrice),
        securityDeposit: Number(formSecurityDeposit || 0),
        status: formStatus,
        location: formLocation,
        images: formImages.length > 0 ? formImages : ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80'],
        primaryImage: formImages[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80',
        accessories: formAccessories.split(',').map((s) => s.trim()).filter(Boolean),
        specifications: {
          screen: formScreen,
          battery: formBattery,
          camera: formCamera,
          processor: formProcessor
        },
        description: formDescription.trim(),
        featured: formFeatured
      };

      if (editingPhone) {
        const res = await api.updateAdminPhone(editingPhone.id, payload);
        if (res?.phone) {
          await syncPhoneToFirestore(res.phone).catch((e) => console.warn('Firestore sync failed:', e));
        }
        setFeedbackMsg({ type: 'success', text: `Phone '${formModel}' updated and saved to Firebase Firestore!` });
      } else {
        const res = await api.addAdminPhone(payload);
        if (res?.phone) {
          await syncPhoneToFirestore(res.phone).catch((e) => console.warn('Firestore sync failed:', e));
        }
        setFeedbackMsg({ type: 'success', text: `New phone '${formModel}' created and saved to Firebase Firestore!` });
      }

      handleResetPhoneForm();
      setActiveTab('phones');
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save phone' });
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Approve / Reject Phone Listing
  const handleToggleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updatePhoneApproval(id, status);
      setFeedbackMsg({ type: 'success', text: `Listing status updated to ${status}.` });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update approval status.' });
    }
  };

  // Delete Phone
  const handleDeletePhone = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this phone listing?')) return;
    try {
      await api.deleteAdminPhone(id);
      await deletePhoneFromFirestore(id).catch((e) => console.warn('Firestore delete failed:', e));
      setFeedbackMsg({ type: 'success', text: 'Phone listing deleted from server and Firebase!' });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to delete phone.' });
    }
  };

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus, undefined, `Updated by admin to ${newStatus}`);
      setFeedbackMsg({ type: 'success', text: `Booking ${bookingId} updated to '${newStatus}'.` });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to update booking status.' });
    }
  };

  // Verify / Reject Payment
  const handleVerifyPayment = async (claimId: string, action: 'verify' | 'reject' | 'refund') => {
    try {
      await api.verifyPayment(claimId, action, `Processed by admin action: ${action}`);
      setFeedbackMsg({
        type: 'success',
        text: `Payment ${claimId} marked as ${action === 'verify' ? 'VERIFIED (Booking Confirmed)' : action}.`
      });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to process payment claim.' });
    }
  };

  // Upload Custom QR Code Image
  const handleUploadQrImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const comp = await compressImage(file, 800, 0.9);
      setCustomQrImage(comp);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to upload QR code image.' });
    }
  };

  // Save QR Settings
  const handleSaveQrSettings = async () => {
    try {
      setIsSavingQr(true);
      await api.updateQrSettings({ customQrUrl: customQrImage || undefined });
      setFeedbackMsg({ type: 'success', text: 'Merchant QR Settings updated successfully!' });
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'Failed to save QR settings.' });
    } finally {
      setIsSavingQr(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-black tracking-tight text-white">
                  RAZY PAY Admin Dashboard
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Authorized Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ledger Management • Rate Settings • UPI Payment Verification • Security Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Log out of admin session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3 text-xs flex items-center justify-between ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className="font-semibold">{feedbackMsg.text}</span>
            </div>
            <button type="button" onClick={() => setFeedbackMsg(null)} className="cursor-pointer font-bold">
              ×
            </button>
          </div>
        )}

        {/* IF NOT LOGGED IN: SHOW ADMIN LOGIN FORM */}
        {!isAdminLoggedIn ? (
          <div className="p-8 max-w-md mx-auto my-auto w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-900 shadow-sm">
              <Lock className="w-8 h-8 text-indigo-700" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-2xl font-black text-slate-900">
                Admin Authentication
              </h3>
              <p className="text-xs text-slate-500">
                Sign in to manage RAZY PAY financial operations, verify UPI payments, and configure platform settings.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Admin Phone / Email
                </label>
                <input
                  type="text"
                  required
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="Enter administrator phone or email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Admin Secret Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-700 hover:from-indigo-800 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-purple-200" />
                    <span>Access Admin Portal</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* LOGGED IN: MAIN DASHBOARD TABS */
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-60 bg-slate-50 border-r border-slate-200 p-3 space-y-1 shrink-0 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('phones')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                  activeTab === 'phones'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Phone Fleet</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-mono">
                  {phones.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleResetPhoneForm();
                  setActiveTab('add-phone');
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'add-phone'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-purple-600" />
                <span>{editingPhone ? 'Edit Phone' : 'Add New Phone'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                  activeTab === 'bookings'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Bookings</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-mono">
                  {bookings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                  activeTab === 'payments'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>UPI Payments</span>
                </span>
                {payments.filter((p) => p.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500 text-white font-mono animate-pulse">
                    {payments.filter((p) => p.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qr-settings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'qr-settings'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>QR Code Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('navigation')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                  activeTab === 'navigation'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Menu & Navigation</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold">
                  {customNavItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === 'logs'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit Logs</span>
              </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-white">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                        Total Fleet
                      </span>
                      <p className="font-mono-num font-black text-2xl text-indigo-950">
                        {stats?.totalPhones || phones.length}
                      </p>
                      <span className="text-[11px] text-indigo-700">
                        {phones.filter((p) => p.status === 'available').length} Available for rent
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                        Total Bookings
                      </span>
                      <p className="font-mono-num font-black text-2xl text-emerald-950">
                        {stats?.totalBookings || bookings.length}
                      </p>
                      <span className="text-[11px] text-emerald-700">
                        {bookings.filter((b) => b.bookingStatus === 'Confirmed').length} Confirmed orders
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                        Pending Payments
                      </span>
                      <p className="font-mono-num font-black text-2xl text-amber-950">
                        {payments.filter((p) => p.status === 'pending').length}
                      </p>
                      <span className="text-[11px] text-amber-700">Awaiting UTR verification</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">
                        Total Revenue
                      </span>
                      <p className="font-mono-num font-black text-2xl text-purple-950">
                        ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
                      </p>
                      <span className="text-[11px] text-purple-700">Verified UPI payments</span>
                    </div>
                  </div>

                  {/* Pending Payments Alert Banner */}
                  {payments.filter((p) => p.status === 'pending').length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">
                            {payments.filter((p) => p.status === 'pending').length} Payment Claim(s) Waiting for Verification!
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Check customer UTR against your merchant UPI statement and approve.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('payments')}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Review Now &rarr;
                      </button>
                    </div>
                  )}

                  {/* Pending Phone Submissions Alert Banner */}
                  {phones.filter((p) => p.approvalStatus === 'pending').length > 0 && (
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlusCircle className="w-5 h-5 text-purple-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-purple-900">
                            {phones.filter((p) => p.approvalStatus === 'pending').length} User-Submitted Phone(s) Pending Approval!
                          </p>
                          <p className="text-[11px] text-purple-700">
                            Review specifications and approve to list on the storefront.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('phones')}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Review Listings &rarr;
                      </button>
                    </div>
                  )}

                  {/* Configured UPI ID Summary */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
                        Strict Active Payment Rail (NPCI UPI)
                      </span>
                      <p className="font-mono font-bold text-sm text-white">
                        {qrSettings?.upiId || 'wallepayy@naviaxis'}
                      </p>
                      <p className="text-[11px] text-slate-400">Merchant Name: RAZY PAY Global Services</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('qr-settings')}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                    >
                      Configure QR Image
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: PHONE FLEET & PHOTO MANAGER */}
              {activeTab === 'phones' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-display text-base font-black text-slate-900">
                        Phone Fleet & Inventory ({phones.length} Total)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Manage rental inventory, live availability, security deposits & pricing across all iPhones and Android devices.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleResetPhoneForm();
                          setFormBrand('Apple');
                          setFormModel('iPhone ');
                          setActiveTab('add-phone');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <PlusCircle className="w-4 h-4 text-purple-200" />
                        <span>Add iPhone Model</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleResetPhoneForm();
                          setActiveTab('add-phone');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-purple-300" />
                        <span>Add Other Phone</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAdminBrandFilter('All')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          adminBrandFilter === 'All'
                            ? 'bg-indigo-900 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        All Fleet ({phones.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminBrandFilter('Apple')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          adminBrandFilter === 'Apple'
                            ? 'bg-indigo-900 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Apple iPhones ({phones.filter((p) => p.brand === 'Apple').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminBrandFilter('Android')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          adminBrandFilter === 'Android'
                            ? 'bg-indigo-900 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Android Fleet ({phones.filter((p) => p.brand !== 'Apple').length})
                      </button>
                    </div>

                    <div className="relative min-w-[220px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search model, color, spec..."
                        value={adminSearchTerm}
                        onChange={(e) => setAdminSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Phone Listings Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Device</th>
                          <th className="p-3">Condition & Specs</th>
                          <th className="p-3">Daily / Weekly / Monthly</th>
                          <th className="p-3">Deposit</th>
                          <th className="p-3">Availability Status</th>
                          <th className="p-3">Approval</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {phones
                          .filter((phone) => {
                            if (adminBrandFilter === 'Apple' && phone.brand !== 'Apple') return false;
                            if (adminBrandFilter === 'Android' && phone.brand === 'Apple') return false;
                            if (adminSearchTerm.trim()) {
                              const q = adminSearchTerm.toLowerCase().trim();
                              return (
                                phone.model.toLowerCase().includes(q) ||
                                phone.brand.toLowerCase().includes(q) ||
                                phone.storage.toLowerCase().includes(q) ||
                                phone.color.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          })
                          .map((phone) => (
                          <tr key={phone.id} className="hover:bg-slate-50/70">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={phone.primaryImage}
                                  alt={phone.model}
                                  className="w-10 h-10 rounded-lg object-contain bg-slate-100 p-0.5 border border-slate-200"
                                />
                                <div>
                                  <p className="font-bold text-slate-900">{phone.model}</p>
                                  <p className="text-[10px] text-slate-500">{phone.brand} • {phone.color}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="font-semibold text-slate-800">{phone.condition}</span>
                              <p className="text-[10px] text-slate-500">{phone.ram} / {phone.storage}</p>
                            </td>

                            <td className="p-3 font-mono-num font-bold text-slate-800">
                              ₹{phone.dailyPrice} <span className="text-[10px] text-slate-400 font-normal">/ ₹{phone.weeklyPrice} / ₹{phone.monthlyPrice}</span>
                            </td>

                            <td className="p-3 font-mono-num text-slate-700">
                              {phone.securityDeposit && phone.securityDeposit > 0 ? (
                                <span className="font-bold text-amber-700">₹{phone.securityDeposit}</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">₹0</span>
                              )}
                            </td>

                            <td className="p-3">
                              <select
                                value={phone.status}
                                onChange={(e) => handleQuickStatusToggle(phone, e.target.value as any)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                                  phone.status === 'available'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : phone.status === 'rented'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                <option value="available">Available</option>
                                <option value="rented">Reserved</option>
                                <option value="maintenance">Maintenance / Archived</option>
                              </select>
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  phone.approvalStatus === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : phone.approvalStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {phone.approvalStatus}
                              </span>
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {phone.approvalStatus === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleApproval(phone.id, 'approved')}
                                    className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold cursor-pointer hover:bg-emerald-700"
                                    title="Approve Listing"
                                  >
                                    Approve
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleStartEditPhone(phone)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-900 hover:bg-indigo-50 cursor-pointer"
                                  title="Edit Phone & Rates"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePhone(phone.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Delete Phone from Fleet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ADD / EDIT PHONE & PHOTO MANAGER */}
              {activeTab === 'add-phone' && (
                <form onSubmit={handleSavePhone} className="space-y-4 max-w-3xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-display text-base font-black text-slate-900">
                        {editingPhone ? `Edit Phone Details — ${editingPhone.model}` : 'Add New Smartphone to Fleet'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Configure photos, specs, and rental rates.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('phones')}
                      className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Brand & Model */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Brand</label>
                      <select
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      >
                        <option value="Apple">Apple iPhone</option>
                        <option value="Samsung">Samsung</option>
                        <option value="OnePlus">OnePlus</option>
                        <option value="Google">Google Pixel</option>
                        <option value="Other Android">Other Android</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block">Phone Model</label>
                      <input
                        type="text"
                        required
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                        placeholder="e.g. iPhone 16 Pro Max"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">RAM</label>
                      <input
                        type="text"
                        value={formRam}
                        onChange={(e) => setFormRam(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Storage</label>
                      <input
                        type="text"
                        value={formStorage}
                        onChange={(e) => setFormStorage(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Condition</label>
                      <select
                        value={formCondition}
                        onChange={(e) => setFormCondition(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      >
                        <option value="Pristine">Pristine</option>
                        <option value="Like New">Like New</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Color</label>
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Photo Manager (Section 11) */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-purple-600" />
                        <span>Phone Photo Manager</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => photoUploadInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-indigo-900 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Upload Photos
                      </button>
                    </div>

                    <input
                      type="file"
                      multiple
                      ref={photoUploadInputRef}
                      accept="image/*"
                      onChange={handleUploadPhonePhotos}
                      className="hidden"
                    />

                    {formImages.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                        {formImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden group">
                            <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-contain p-1" />
                            <div className="absolute top-1 left-1">
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-600 text-white uppercase">
                                  Primary
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white opacity-80 hover:opacity-100 cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 py-2">
                        No custom photos uploaded yet. Default flagship image will be used.
                      </p>
                    )}
                  </div>

                  {/* Rental Pricing Rates & Security Deposit */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Daily Rate (₹)</label>
                      <input
                        type="number"
                        required
                        value={formDailyPrice}
                        onChange={(e) => setFormDailyPrice(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono-num text-xs font-bold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Weekly Rate (₹)</label>
                      <input
                        type="number"
                        required
                        value={formWeeklyPrice}
                        onChange={(e) => setFormWeeklyPrice(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono-num text-xs font-bold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Monthly Rate (₹)</label>
                      <input
                        type="number"
                        required
                        value={formMonthlyPrice}
                        onChange={(e) => setFormMonthlyPrice(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono-num text-xs font-bold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={formSecurityDeposit}
                        onChange={(e) => setFormSecurityDeposit(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono-num text-xs font-bold bg-white"
                      />
                    </div>
                  </div>

                  {/* Availability Status & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Inventory Availability Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      >
                        <option value="available">Available for Order</option>
                        <option value="rented">Currently Reserved</option>
                        <option value="maintenance">Under Maintenance / Discontinued</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Dispatch Location</label>
                      <input
                        type="text"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Description & Featured */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Description</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Highlight phone conditions, camera capabilities..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={(e) => setFormFeatured(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>Mark as Featured / Popular Rental</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPhone}
                    className="py-3 px-6 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {isSavingPhone ? 'Saving Phone...' : editingPhone ? 'Update Phone Details' : 'Add to Fleet'}
                  </button>
                </form>
              )}

              {/* TAB 4: BOOKING MANAGEMENT (Section 14) */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-display text-base font-black text-slate-900">
                      Rental Bookings Management
                    </h4>
                    <p className="text-xs text-slate-500">
                      Audit all rental orders, dates, and update statuses with audit trail.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Booking Ref</th>
                          <th className="p-3">Customer Details</th>
                          <th className="p-3">Device & Dates</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Booking Status</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-mono font-bold text-slate-900">{b.id}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{b.customerName}</p>
                              <p className="font-mono text-slate-500 text-[11px]">{b.customerPhone}</p>
                              {b.pincode && (
                                <p className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                                  PIN: {b.pincode} {b.postOffice ? `(${b.postOffice})` : ''}
                                </p>
                              )}
                              {b.aadhaarCardUrl && (
                                <button
                                  type="button"
                                  onClick={() => setViewingScreenshot(b.aadhaarCardUrl!)}
                                  className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3 h-3 text-amber-700" />
                                  <span>View Aadhaar ID</span>
                                </button>
                              )}
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{b.phoneModel}</p>
                              <p className="text-[10px] text-slate-500">{b.startDate} &rarr; {b.endDate} ({b.totalDays}d)</p>
                              {b.deliveryAddress && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5" title={b.deliveryAddress}>
                                  {b.deliveryAddress}
                                </p>
                              )}
                            </td>
                            <td className="p-3 font-mono-num font-bold text-slate-900">
                              ₹{b.totalPayable.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Rental Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.bookingStatus === 'Payment Under Verification'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {b.bookingStatus}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="capitalize font-bold text-[11px] text-slate-700">
                                {b.paymentStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <select
                                value={b.bookingStatus}
                                onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                                className="px-2 py-1 rounded-lg border border-slate-300 text-[10px] font-bold bg-white cursor-pointer"
                              >
                                <option value="Booking Requested">Booking Requested</option>
                                <option value="Payment Pending">Payment Pending</option>
                                <option value="Payment Under Verification">Payment Under Verification</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Rental Active">Rental Active</option>
                                <option value="Return Pending">Return Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Disputed">Disputed</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: UPI PAYMENT VERIFICATION (Section 13) */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-display text-base font-black text-slate-900">
                      UPI Payment Verification Table
                    </h4>
                    <p className="text-xs text-slate-500">
                      Verify submitted 12-digit UPI UTR references against your merchant account.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Payment Ref</th>
                          <th className="p-3">Booking Ref</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Submitted UTR</th>
                          <th className="p-3">Claimed Amount</th>
                          <th className="p-3">Proof</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Verification Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/70">
                            <td className="p-3 font-mono font-bold text-slate-900">{p.id}</td>
                            <td className="p-3 font-mono text-indigo-900 font-bold">{p.bookingId}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{p.customerName}</p>
                              <p className="font-mono text-slate-500 text-[11px]">{p.customerPhone}</p>
                            </td>
                            <td className="p-3 font-mono font-black text-slate-900 text-xs bg-slate-50 px-2 py-1 rounded">
                              {p.upiTxnId}
                            </td>
                            <td className="p-3 font-mono-num font-bold text-emerald-700">
                              ₹{p.claimedAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3">
                              {p.screenshotUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingScreenshot(p.screenshotUrl || null)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-pointer hover:bg-indigo-100"
                                >
                                  View Screenshot
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">No image</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  p.status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {p.status === 'pending' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyPayment(p.id, 'verify')}
                                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer shadow-xs"
                                  >
                                    Verify & Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyPayment(p.id, 'reject')}
                                    className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {p.status === 'verified' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(p.id, 'refund')}
                                  className="px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] cursor-pointer"
                                  title="Mark Deposit Refunded upon phone return"
                                >
                                  Refund Deposit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: QR CODE SETTINGS (Section 12) */}
              {activeTab === 'qr-settings' && (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <h4 className="font-display text-base font-black text-slate-900">
                      QR Code & UPI Settings Manager
                    </h4>
                    <p className="text-xs text-slate-500">
                      Manage official payment QR code image. Configured UPI ID is strictly preserved.
                    </p>
                  </div>

                  {/* Configured UPI ID (Immutable as specified) */}
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                      Active Merchant UPI ID (System Fixed)
                    </span>
                    <p className="font-mono text-base font-black text-indigo-950">
                      {qrSettings?.upiId || 'wallepayy@naviaxis'}
                    </p>
                    <p className="text-[11px] text-indigo-700">
                      All dynamic checkout QR codes and payment instructions direct to this merchant account.
                    </p>
                  </div>

                  {/* QR Image Display */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">
                      Currently Active Checkout QR Code
                    </span>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-sm">
                      <img
                        src={customQrImage || dynamicQrUrl}
                        alt="Active QR Code"
                        className="w-52 h-52 object-contain mx-auto"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="file"
                        ref={qrImageUploadRef}
                        accept="image/*"
                        onChange={handleUploadQrImage}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => qrImageUploadRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Custom QR Image</span>
                      </button>

                      {customQrImage && (
                        <button
                          type="button"
                          onClick={() => setCustomQrImage(null)}
                          className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                        >
                          Reset to Dynamic QR
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveQrSettings}
                    disabled={isSavingQr}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {isSavingQr ? 'Saving QR Settings...' : 'Save & Publish QR Settings'}
                  </button>

                  {/* Razorpay Gateway Status & Environment Configuration */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-950 text-white space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-300" />
                        <h5 className="font-bold text-sm text-white">Razorpay Payment Gateway</h5>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-slate-950">
                        Integrated
                      </span>
                    </div>

                    <p className="text-xs text-purple-200 leading-relaxed">
                      Server-side checkout integration is active for UPI, Debit/Credit Cards, and Net Banking. Order creation and signature verification are executed exclusively on the backend server.
                    </p>

                    <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-purple-300">Gateway Mode:</span>
                        <span className="font-mono font-bold text-amber-300">Test Mode (Sandbox Active)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Key Secret Storage:</span>
                        <span className="font-mono text-emerald-400">Backend Env Only (Never In Frontend)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Instant Verification:</span>
                        <span className="font-mono text-white">HMAC SHA256 Webhook/Signature</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/10 text-[11px] text-purple-200">
                      <strong className="text-white block mb-0.5">Switching to Live Mode:</strong>
                      In your hosting environment / Secrets manager, set <code className="text-amber-300 bg-black/40 px-1 rounded">RAZORPAY_KEY_ID</code> and <code className="text-amber-300 bg-black/40 px-1 rounded">RAZORPAY_KEY_SECRET</code> to your live activated Razorpay API keys. The applet automatically switches to Live Mode without code changes.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: MENU & NAVIGATION MANAGER (Automatic Section Management) */}
              {activeTab === 'navigation' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-display text-base font-black text-slate-900 flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                        <span>Menu & Navigation Manager</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Customize menu labels, reorder navigation items, toggle visibility, and assign parent categories.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomNavItems(DEFAULT_NAV_CONFIG);
                          setFeedbackMsg({ type: 'success', text: 'Reset navigation to factory defaults (click Save to publish).' });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                      >
                        Reset Defaults
                      </button>

                      <button
                        type="button"
                        disabled={isSavingNav}
                        onClick={async () => {
                          try {
                            setIsSavingNav(true);
                            await api.updateNavigationConfig(customNavItems);
                            setFeedbackMsg({ type: 'success', text: 'Navigation hierarchy saved and updated successfully!' });
                            if (onRefreshData) onRefreshData();
                          } catch (err: any) {
                            setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to update navigation settings.' });
                          } finally {
                            setIsSavingNav(false);
                          }
                        }}
                        className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        {isSavingNav ? 'Saving Navigation...' : 'Save Navigation Changes'}
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
                    {[
                      { id: 'all', label: `All Sections (${customNavItems.length})` },
                      { id: 'main-nav', label: `Main Navigation (${customNavItems.filter((i) => i.category === 'main-nav').length})` },
                      { id: 'rental-payments', label: `Rental & Payments (${customNavItems.filter((i) => i.category === 'rental-payments').length})` },
                      { id: 'info-support', label: `Information & Support (${customNavItems.filter((i) => i.category === 'info-support').length})` }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNavCategoryFilter(cat.id as any)}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          navCategoryFilter === cat.id
                            ? 'bg-white text-indigo-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Navigation Items List */}
                  <div className="space-y-2.5">
                    {customNavItems
                      .filter((item) => navCategoryFilter === 'all' || item.category === navCategoryFilter)
                      .sort((a, b) => a.order - b.order)
                      .map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            item.visible
                              ? 'bg-white border-slate-200/90 shadow-2xs hover:border-purple-300'
                              : 'bg-slate-50 border-dashed border-slate-300 opacity-60'
                          }`}
                        >
                          {/* Item Identity & Title Edit */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomNavItems((prev) =>
                                      prev.map((i) => (i.id === item.id ? { ...i, label: val } : i))
                                    );
                                  }}
                                  className="font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-purple-600 focus:outline-none bg-transparent px-1 py-0.5 rounded text-xs"
                                  title="Click to rename menu label"
                                />
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.hash}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate max-w-md">
                                {item.description || 'Dedicated website section'}
                              </p>
                            </div>
                          </div>

                          {/* Controls: Parent Category, Order & Visibility */}
                          <div className="flex items-center flex-wrap gap-2 shrink-0">
                            {/* Parent Category Assign */}
                            <select
                              value={item.category}
                              onChange={(e) => {
                                const newCat = e.target.value as any;
                                setCustomNavItems((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, category: newCat } : i))
                                );
                              }}
                              className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                              title="Assign to Category"
                            >
                              <option value="main-nav">Main Navigation</option>
                              <option value="rental-payments">Rental & Payments</option>
                              <option value="info-support">Info & Support</option>
                            </select>

                            {/* Badge input */}
                            <input
                              type="text"
                              placeholder="Badge (opt)"
                              value={item.badge || ''}
                              onChange={(e) => {
                                const b = e.target.value;
                                setCustomNavItems((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, badge: b || undefined } : i))
                                );
                              }}
                              className="w-20 px-2 py-1 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 focus:outline-none"
                            />

                            {/* Reorder Buttons */}
                            <div className="flex items-center gap-0.5 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentIdx = customNavItems.findIndex((i) => i.id === item.id);
                                  if (currentIdx > 0) {
                                    const copy = [...customNavItems];
                                    const temp = copy[currentIdx];
                                    copy[currentIdx] = copy[currentIdx - 1];
                                    copy[currentIdx - 1] = temp;
                                    copy.forEach((it, i) => (it.order = i + 1));
                                    setCustomNavItems(copy);
                                  }
                                }}
                                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                                title="Move Up"
                              >
                                &uarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentIdx = customNavItems.findIndex((i) => i.id === item.id);
                                  if (currentIdx < customNavItems.length - 1) {
                                    const copy = [...customNavItems];
                                    const temp = copy[currentIdx];
                                    copy[currentIdx] = copy[currentIdx + 1];
                                    copy[currentIdx + 1] = temp;
                                    copy.forEach((it, i) => (it.order = i + 1));
                                    setCustomNavItems(copy);
                                  }
                                }}
                                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                                title="Move Down"
                              >
                                &darr;
                              </button>
                            </div>

                            {/* Visibility Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                setCustomNavItems((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, visible: !i.visible } : i))
                                );
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                item.visible
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{item.visible ? 'Visible' : 'Hidden'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 8: AUDIT LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-display text-base font-black text-slate-900">
                      System Audit Trail
                    </h4>
                    <p className="text-xs text-slate-500">
                      Cryptographic record of admin logins, booking status changes, and payment verification actions.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{log.action}</span>
                          <span className="text-slate-600 text-[11px]">{log.details}</span>
                        </div>
                        <div className="text-right shrink-0 pl-3">
                          <span className="font-mono text-[10px] text-slate-400 block">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-[10px] text-indigo-900 font-bold">{log.adminUser}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* Screenshot Modal Viewer */}
        {viewingScreenshot && (
          <div
            onClick={() => setViewingScreenshot(null)}
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="bg-white p-4 rounded-2xl max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900">Payment Screenshot Proof</h4>
                <button
                  type="button"
                  onClick={() => setViewingScreenshot(null)}
                  className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img src={viewingScreenshot} alt="Payment proof" className="w-full max-h-96 object-contain rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
