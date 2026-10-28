import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PhoneListing,
  RentalBooking,
  PaymentClaim,
  QrSettings,
  CartItem
} from './types';
import { api } from './utils/api';
import { Navbar } from './components/Navbar';
import { SidebarNavigation } from './components/SidebarNavigation';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { BottomNavigation } from './components/BottomNavigation';
import { CartModal } from './components/CartModal';
import { Hero } from './components/Hero';
import { PhoneCard } from './components/PhoneCard';
import { PhoneDetailsModal } from './components/PhoneDetailsModal';
import { RentalBookingModal } from './components/RentalBookingModal';
import { ListPhoneModal } from './components/ListPhoneModal';
import { MyBookingModal } from './components/MyBookingModal';
import { MyPaymentsModal } from './components/MyPaymentsModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { SubmitPaymentModal } from './components/SubmitPaymentModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { HowItWorksSection } from './components/HowItWorksSection';
import { BenefitsSection } from './components/BenefitsSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { LegalModal, LegalTabType } from './components/LegalModal';
import { UpiQrPaymentModal } from './components/UpiQrPaymentModal';
import { AboutModal } from './components/AboutModal';
import { USER_NAV_GROUPS, ADMIN_NAV_GROUPS, NavItem, buildUserNavGroups } from './config/navigation';
import { IPHONE_GENERATION_FILTERS, COMPREHENSIVE_PHONE_FLEET } from './data/phoneFleet';
import {
  fetchPhonesFromFirestore,
  syncUserToFirestore,
  syncOrderToFirestore,
  syncWithdrawalToFirestore,
  syncLedgerToFirestore
} from './lib/firestoreService';
import { saveUserToSupabase } from './lib/supabase';
import { RushLanding } from './components/rushpay/RushLanding';
import { RushDashboard } from './components/rushpay/RushDashboard';
import { RushAuthModal } from './components/rushpay/RushAuthModal';
import { rushApi } from './utils/rushApi';
import { UserProfile, WalletBalances, BuyOrder, SellWithdrawRequest, LedgerEntry, ExchangeRateConfig, RushPayPlatformConfig } from './types/rushpay';
import {
  Smartphone,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  Layers,
  X
} from 'lucide-react';

export function App() {
  const [phones, setPhones] = useState<PhoneListing[]>([]);
  const [qrSettings, setQrSettings] = useState<QrSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Navigation & Responsive Drawer State
  const [activeSection, setActiveSection] = useState<string>('home');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [durationRateMode, setDurationRateMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Modals state
  const [selectedPhoneForDetails, setSelectedPhoneForDetails] = useState<PhoneListing | null>(null);
  const [selectedPhoneForBooking, setSelectedPhoneForBooking] = useState<PhoneListing | null>(null);
  const [bookingDays, setBookingDays] = useState<number>(1); // Default 1 day @ 150/d
  const [isListPhoneOpen, setIsListPhoneOpen] = useState<boolean>(false);
  const [isMyBookingOpen, setIsMyBookingOpen] = useState<boolean>(false);
  const [myBookingInitialMode, setMyBookingInitialMode] = useState<'lookup' | 'extension'>('lookup');
  const [isMyPaymentsOpen, setIsMyPaymentsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSubmitPaymentOpen, setIsSubmitPaymentOpen] = useState<boolean>(false);
  const [submitPaymentMode, setSubmitPaymentMode] = useState<'payment' | 'screenshot'>('payment');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<RentalBooking | null>(null);
  const [isUpiQrOpen, setIsUpiQrOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<
    'overview' | 'phones' | 'add-phone' | 'bookings' | 'payments' | 'qr-settings' | 'navigation' | 'logs'
  >('overview');
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [legalTab, setLegalTab] = useState<LegalTabType>('terms');

  // ========================================================================
  // RUSHPAY FINANCIAL PLATFORM STATE (Primary & Exclusive Experience)
  // ========================================================================
  const [currentAppView, setCurrentAppView] = useState<'rushpay'>('rushpay');
  const [rushAuthOpen, setRushAuthOpen] = useState<boolean>(false);
  const [rushAuthMode, setRushAuthMode] = useState<'login' | 'register'>('login');
  const [rushUser, setRushUser] = useState<UserProfile | null>(() => rushApi.getStoredUser());
  const [rushDashboardData, setRushDashboardData] = useState<{
    profile: UserProfile;
    wallet: WalletBalances;
    recentOrders: BuyOrder[];
    recentWithdrawals: SellWithdrawRequest[];
    recentLedger: LedgerEntry[];
    teamStats?: {
      totalInvites: number;
      totalEarnedPaise: number;
      referrals: any[];
    };
    rates: ExchangeRateConfig;
    config: RushPayPlatformConfig;
  } | null>(null);

  const [rushPublicInfo, setRushPublicInfo] = useState<{
    rates: ExchangeRateConfig;
    config: RushPayPlatformConfig;
  }>({
    rates: {
      id: 'INR_STABLE_V1',
      pair: 'INR / PAY UNIT',
      buyRate: 1.0,
      sellRate: 0.995,
      buyFeePercent: 0.5,
      sellFeePercent: 0.75,
      minBuyInr: 100,
      maxBuyInr: 500000,
      minSellInr: 500,
      maxSellInr: 200000,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System Auto-Engine'
    },
    config: {
      brandName: 'RAZY PAY',
      tagline: 'High-Performance Financial Operating System & Verified INR Settlement',
      supportEmail: 'support@razypay.network',
      supportPhone: '+91 9572918366',
      telegramSupportUrl: 'https://t.me/Razypay07',
      minDepositInr: 100,
      maxDepositInr: 500000,
      minWithdrawInr: 500,
      maxWithdrawInr: 200000,
      defaultBuyFeePercent: 0.5,
      defaultSellFeePercent: 0.75,
      referralRewardPaise: 10000,
      depositUpiId: 'razypey@ptyes',
      merchantName: 'Razy Pay Global Services',
      isMaintenanceMode: false
    }
  });

  const loadRushData = useCallback(async () => {
    try {
      const publicInfo = await rushApi.getPublicInfo();
      setRushPublicInfo(publicInfo);

      if (rushApi.getToken()) {
        try {
          const d = await rushApi.getDashboardData();
          setRushDashboardData(d);
          setRushUser(d.profile);

          // Permanently sync User, Wallet, Orders, and Ledger to Cloud Firestore & Supabase Backend
          try {
            syncUserToFirestore({ profile: d.profile, wallet: d.wallet });
            saveUserToSupabase({
              id: d.profile.id,
              mobile: d.profile.mobile,
              email: d.profile.email,
              fullName: d.profile.fullName,
              referralCode: d.profile.referralCode,
              role: d.profile.role,
              accountStatus: d.profile.accountStatus,
              kycStatus: d.profile.kycStatus,
              createdAt: d.profile.createdAt
            }).catch((err) => console.warn('[Supabase Sync Note]:', err));

            if (Array.isArray(d.recentOrders)) {
              d.recentOrders.forEach((o) => syncOrderToFirestore(o));
            }
            if (Array.isArray(d.recentWithdrawals)) {
              d.recentWithdrawals.forEach((w) => syncWithdrawalToFirestore(w));
            }
            if (Array.isArray(d.recentLedger)) {
              d.recentLedger.forEach((l) => syncLedgerToFirestore(l));
            }
          } catch (syncErr) {
            console.warn('Background sync note:', syncErr);
          }
        } catch (tokenErr: any) {
          console.warn('Dashboard fetch warning:', tokenErr);
          // Only clear session if explicitly rejected with 401 Unauthorized from server
          if (tokenErr?.message?.includes('Session expired') || tokenErr?.message?.includes('Authentication required')) {
            rushApi.clearSession();
            setRushUser(null);
            setRushDashboardData(null);
          } else {
            // Keep stored user to maintain session across refreshes and momentary network timeouts
            const cachedUser = rushApi.getStoredUser();
            if (cachedUser) {
              setRushUser(cachedUser);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load rushpay public data:', e);
    }
  }, []);

  useEffect(() => {
    loadRushData();

    // Detect referral code from link (supports ?ref=, ?join=, ?r= or /join/CODE)
    try {
      const url = new URL(window.location.href);
      let refCode = url.searchParams.get('ref') || url.searchParams.get('join') || url.searchParams.get('r');
      if (!refCode && url.pathname.includes('/join/')) {
        const parts = url.pathname.split('/join/');
        if (parts[1]) refCode = parts[1].replace(/[^a-zA-Z0-9-_]/g, '');
      }

      if (refCode) {
        localStorage.setItem('rush_pending_ref', refCode.trim().toUpperCase());
        // If user is not logged in, trigger registration modal with code
        if (!rushApi.getToken()) {
          setRushAuthMode('register');
          setRushAuthOpen(true);
        }
      }
    } catch {
      // ignore
    }
  }, [loadRushData]);

  // Shopping Cart state with localStorage persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cs_shopping_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const saveCartToStorage = (items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem('cs_shopping_cart', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToCart = (phone: PhoneListing, color?: string, storage?: string) => {
    const existingIndex = cartItems.findIndex((item) => item.phone.id === phone.id);
    let nextCart: CartItem[];
    if (existingIndex > -1) {
      nextCart = cartItems.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      nextCart = [
        ...cartItems,
        {
          phone,
          selectedColor: color || phone.color,
          selectedStorage: storage || phone.storage,
          quantity: 1,
          addedAt: new Date().toISOString()
        }
      ];
    }
    saveCartToStorage(nextCart);
    showToast(`🛒 ${phone.model} added to your cart!`);
  };

  const handleUpdateCartQuantity = (phoneId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(phoneId);
      return;
    }
    const nextCart = cartItems.map((item) =>
      item.phone.id === phoneId ? { ...item, quantity } : item
    );
    saveCartToStorage(nextCart);
  };

  const handleRemoveFromCart = (phoneId: string) => {
    const nextCart = cartItems.filter((item) => item.phone.id !== phoneId);
    saveCartToStorage(nextCart);
    showToast('Item removed from cart');
  };

  const handleClearCart = () => {
    saveCartToStorage([]);
    showToast('Cart cleared');
  };

  // Dynamic Navigation Groups from Settings or Defaults
  const [userNavGroups, setUserNavGroups] = useState(USER_NAV_GROUPS);

  // Admin session state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => !!api.getAdminToken());

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial store data
  const loadStoreData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load server phones and Firestore saved phones safely with local fallback
      const [phonesRes, qrRes, settingsRes, firestorePhones] = await Promise.all([
        api.getPhones().catch((err) => {
          console.warn('Backend phone API offline or starting, using local phone fleet fallback:', err);
          return { phones: COMPREHENSIVE_PHONE_FLEET, total: COMPREHENSIVE_PHONE_FLEET.length };
        }),
        api.getQrSettings().catch(() => ({ qrSettings: null })),
        api.getSettings().catch(() => ({ settings: {} as any })),
        fetchPhonesFromFirestore().catch(() => [])
      ]);

      // Combine phones: Server-authoritative updated fleet with exact prices and color variants
      const phoneMap = new Map<string, PhoneListing>();
      // First populate with default fleet
      (COMPREHENSIVE_PHONE_FLEET || []).forEach((p) => phoneMap.set(p.id, p));
      // First populate with custom user-uploaded phones from Firestore if any
      (firestorePhones || []).forEach((p) => {
        if (p.approvalStatus === 'approved') {
          phoneMap.set(p.id, p);
        }
      });
      // Always override official store fleet with latest server prices and variants if returned
      (phonesRes?.phones || []).forEach((p) => {
        phoneMap.set(p.id, p);
      });

      const mergedPhones = Array.from(phoneMap.values());
      setPhones(mergedPhones);
      if (qrRes?.qrSettings) {
        setQrSettings(qrRes.qrSettings);
      }
      if (settingsRes?.settings?.navigationConfig && settingsRes.settings.navigationConfig.length > 0) {
        setUserNavGroups(buildUserNavGroups(settingsRes.settings.navigationConfig));
      }
    } catch (err) {
      console.warn('Store catalog fallback engaged:', err);
      setPhones(COMPREHENSIVE_PHONE_FLEET);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Keep admin token state in sync & listen for order tracker open
  useEffect(() => {
    const checkToken = () => {
      setIsAdminLoggedIn(!!api.getAdminToken());
    };
    const handleOpenOrderTracker = (e: any) => {
      setMyBookingInitialMode('lookup');
      setIsMyBookingOpen(true);
    };

    window.addEventListener('storage', checkToken);
    window.addEventListener('open_order_tracker', handleOpenOrderTracker);
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('open_order_tracker', handleOpenOrderTracker);
    };
  }, []);

  // Helper to find a NavItem across all groups
  const findNavItemById = (id: string): NavItem | undefined => {
    for (const group of userNavGroups) {
      const match = group.items.find((item) => item.id === id);
      if (match) return match;
    }
    for (const group of ADMIN_NAV_GROUPS) {
      const match = group.items.find((item) => item.id === id);
      if (match) return match;
    }
    return undefined;
  };

  // Smooth scroll to in-page section
  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Close all open modals helper
  const closeAllModals = () => {
    setSelectedPhoneForDetails(null);
    setSelectedPhoneForBooking(null);
    setIsListPhoneOpen(false);
    setIsMyBookingOpen(false);
    setIsMyPaymentsOpen(false);
    setIsProfileOpen(false);
    setIsSubmitPaymentOpen(false);
    setIsAdminOpen(false);
    setIsLegalOpen(false);
    setIsUpiQrOpen(false);
    setIsAboutOpen(false);
    setIsCartOpen(false);
  };

  // Primary Navigation Dispatcher (handles sections, modals, admin tabs, URL history)
  const handleNavigateItem = (item: NavItem) => {
    // 1. Admin navigation
    if (item.type === 'admin') {
      const tabName = (item.hash.replace('#admin/', '').replace('#admin', '') || 'overview') as any;

      closeAllModals();
      setAdminInitialTab(tabName);
      setIsAdminOpen(true);
      setActiveSection(item.id);
      window.history.pushState(null, '', item.hash);
      return;
    }

    // 2. Filter-based navigation items
    if (item.type === 'filter') {
      closeAllModals();
      setActiveSection(item.id);
      window.history.pushState(null, '', item.hash);

      switch (item.id) {
        case 'iphones':
          setSelectedBrand('Apple');
          setSelectedGeneration('all');
          setAvailabilityFilter('all');
          scrollToSection('explore');
          break;
        case 'samsung':
          setSelectedBrand('Samsung');
          setSelectedGeneration('all');
          setAvailabilityFilter('all');
          scrollToSection('explore');
          break;
        case 'oneplus':
          setSelectedBrand('OnePlus');
          setSelectedGeneration('all');
          setAvailabilityFilter('all');
          scrollToSection('explore');
          break;
        case 'pixel':
          setSelectedBrand('Google');
          setSelectedGeneration('all');
          setAvailabilityFilter('all');
          scrollToSection('explore');
          break;
        case 'other-android':
          setSelectedBrand('Other Android');
          setSelectedGeneration('all');
          setAvailabilityFilter('all');
          scrollToSection('explore');
          break;
        case 'browse-available':
          setAvailabilityFilter('available');
          setSelectedBrand('All');
          scrollToSection('explore');
          break;
        case 'daily-plans':
          setDurationRateMode('daily');
          scrollToSection('explore');
          break;
        case 'weekly-plans':
          setDurationRateMode('weekly');
          scrollToSection('explore');
          break;
        case 'monthly-plans':
          setDurationRateMode('monthly');
          scrollToSection('explore');
          break;
        default:
          scrollToSection('explore');
          break;
      }
      return;
    }

    // 3. Dedicated Modal workflows
    if (item.type === 'modal') {
      closeAllModals();
      setActiveSection(item.id);
      window.history.pushState(null, '', item.hash);

      switch (item.id) {
        case 'my-booking':
          setMyBookingInitialMode('lookup');
          setIsMyBookingOpen(true);
          break;
        case 'rental-extension':
          setMyBookingInitialMode('extension');
          setIsMyBookingOpen(true);
          break;
        case 'my-payments':
        case 'payment-status':
          setIsMyPaymentsOpen(true);
          break;
        case 'submit-payment':
          setSubmitPaymentMode('payment');
          setSelectedBookingForPayment(null);
          setIsSubmitPaymentOpen(true);
          break;
        case 'screenshot-upload':
          setSubmitPaymentMode('screenshot');
          setSelectedBookingForPayment(null);
          setIsSubmitPaymentOpen(true);
          break;
        case 'upi-qr-payment':
          setIsUpiQrOpen(true);
          break;
        case 'about':
          setIsAboutOpen(true);
          break;
        case 'security-deposit-info':
          setLegalTab('deposit');
          setIsLegalOpen(true);
          break;
        case 'payment-instructions':
          setIsUpiQrOpen(true);
          break;
        case 'return-policy':
          setLegalTab('return');
          setIsLegalOpen(true);
          break;
        case 'terms':
          setLegalTab('terms');
          setIsLegalOpen(true);
          break;
        case 'rental-agreement':
          setLegalTab('rental');
          setIsLegalOpen(true);
          break;
        case 'pricing-policy':
          setLegalTab('pricing');
          setIsLegalOpen(true);
          break;
        case 'damage-policy':
          setLegalTab('damage');
          setIsLegalOpen(true);
          break;
        case 'privacy':
          setLegalTab('privacy');
          setIsLegalOpen(true);
          break;
        case 'profile':
          setIsProfileOpen(true);
          break;
        case 'cart':
          setIsCartOpen(true);
          break;
        case 'list-phone':
          setIsListPhoneOpen(true);
          break;
        case 'legal':
          setLegalTab('pricing');
          setIsLegalOpen(true);
          break;
        default:
          break;
      }
      return;
    }

    // 4. In-page Section navigation
    closeAllModals();

    setActiveSection(item.id);
    window.history.pushState(null, '', item.hash);

    if (item.id === 'search') {
      scrollToSection('explore');
    } else if (item.id === 'rental-benefits') {
      scrollToSection('benefits');
    } else if (
      item.id === 'contact-info' ||
      item.id === 'phone-whatsapp-support' ||
      item.id === 'support-email' ||
      item.id === 'store-location' ||
      item.id === 'operating-hours' ||
      item.id === 'inquiry'
    ) {
      scrollToSection(item.id);
    } else {
      scrollToSection(item.id);
    }
  };

  const handleNavigateItemById = (id: string) => {
    const item = findNavItemById(id);
    if (item) {
      handleNavigateItem(item);
    } else {
      scrollToSection(id);
      setActiveSection(id);
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    closeAllModals();
    setActiveSection(sectionId);
    window.history.pushState(null, '', `#${sectionId}`);
    scrollToSection(sectionId);
  };

  const handleAdminLogout = () => {
    api.clearAdminToken();
    setIsAdminLoggedIn(false);
    setIsAdminOpen(false);
    showToast('Admin session locked.');
    setActiveSection('home');
    window.history.pushState(null, '', '#home');
  };

  // URL Hash synchronization on load and on popstate/hashchange
  useEffect(() => {
    const handleUrlHash = () => {
      const hash = window.location.hash || '#home';

      // Admin routes
      if (hash.startsWith('#admin')) {
        const parts = hash.split('/');
        const tab = (parts[1] || 'overview') as any;
        closeAllModals();
        setAdminInitialTab(tab);
        setIsAdminOpen(true);
        setActiveSection(parts[1] ? `admin-${parts[1]}` : 'admin-overview');
        return;
      }

      // Modals
      switch (hash) {
        case '#my-booking':
          closeAllModals();
          setMyBookingInitialMode('lookup');
          setIsMyBookingOpen(true);
          setActiveSection('my-booking');
          return;
        case '#rental-extension':
          closeAllModals();
          setMyBookingInitialMode('extension');
          setIsMyBookingOpen(true);
          setActiveSection('rental-extension');
          return;
        case '#my-payments':
        case '#payment-status':
          closeAllModals();
          setIsMyPaymentsOpen(true);
          setActiveSection('my-payments');
          return;
        case '#submit-payment':
          closeAllModals();
          setSubmitPaymentMode('payment');
          setIsSubmitPaymentOpen(true);
          setActiveSection('submit-payment');
          return;
        case '#screenshot-upload':
          closeAllModals();
          setSubmitPaymentMode('screenshot');
          setIsSubmitPaymentOpen(true);
          setActiveSection('screenshot-upload');
          return;
        case '#upi-qr-payment':
        case '#payment-instructions':
          closeAllModals();
          setIsUpiQrOpen(true);
          setActiveSection('upi-qr-payment');
          return;
        case '#about':
          closeAllModals();
          setIsAboutOpen(true);
          setActiveSection('about');
          return;
        case '#profile':
          closeAllModals();
          setIsProfileOpen(true);
          setActiveSection('profile');
          return;
        case '#cart':
          closeAllModals();
          setIsCartOpen(true);
          setActiveSection('cart');
          return;
        case '#list-phone':
          closeAllModals();
          setIsListPhoneOpen(true);
          setActiveSection('list-phone');
          return;
        case '#terms':
        case '#legal/terms':
          closeAllModals();
          setLegalTab('terms');
          setIsLegalOpen(true);
          setActiveSection('terms');
          return;
        case '#rental-agreement':
        case '#legal/rental':
          closeAllModals();
          setLegalTab('rental');
          setIsLegalOpen(true);
          setActiveSection('rental-agreement');
          return;
        case '#pricing-policy':
        case '#legal/pricing':
          closeAllModals();
          setLegalTab('pricing');
          setIsLegalOpen(true);
          setActiveSection('pricing-policy');
          return;
        case '#damage-policy':
        case '#legal/damage':
          closeAllModals();
          setLegalTab('damage');
          setIsLegalOpen(true);
          setActiveSection('damage-policy');
          return;
        case '#privacy':
        case '#legal/privacy':
          closeAllModals();
          setLegalTab('privacy');
          setIsLegalOpen(true);
          setActiveSection('privacy');
          return;
        case '#security-deposit-info':
          closeAllModals();
          setLegalTab('deposit');
          setIsLegalOpen(true);
          setActiveSection('security-deposit-info');
          return;
        case '#return-policy':
          closeAllModals();
          setLegalTab('return');
          setIsLegalOpen(true);
          setActiveSection('return-policy');
          return;
        case '#legal':
          closeAllModals();
          setLegalTab('pricing');
          setIsLegalOpen(true);
          setActiveSection('legal');
          return;
        default:
          if (hash.startsWith('#order-')) {
            return;
          }
          break;
      }

      // Filter routes
      if (hash === '#browse-available') {
        closeAllModals();
        setAvailabilityFilter('available');
        setSelectedBrand('All');
        setActiveSection('browse-available');
        scrollToSection('explore');
        return;
      }
      if (hash === '#daily-plans') {
        closeAllModals();
        setDurationRateMode('daily');
        setActiveSection('daily-plans');
        scrollToSection('explore');
        return;
      }
      if (hash === '#weekly-plans') {
        closeAllModals();
        setDurationRateMode('weekly');
        setActiveSection('weekly-plans');
        scrollToSection('explore');
        return;
      }
      if (hash === '#monthly-plans') {
        closeAllModals();
        setDurationRateMode('monthly');
        setActiveSection('monthly-plans');
        scrollToSection('explore');
        return;
      }
      if (hash === '#samsung') {
        closeAllModals();
        setSelectedBrand('Samsung');
        setActiveSection('samsung');
        scrollToSection('explore');
        return;
      }
      if (hash === '#oneplus') {
        closeAllModals();
        setSelectedBrand('OnePlus');
        setActiveSection('oneplus');
        scrollToSection('explore');
        return;
      }
      if (hash === '#pixel') {
        closeAllModals();
        setSelectedBrand('Google');
        setActiveSection('pixel');
        scrollToSection('explore');
        return;
      }
      if (hash === '#other-android') {
        closeAllModals();
        setSelectedBrand('Other Android');
        setActiveSection('other-android');
        scrollToSection('explore');
        return;
      }

      // Landing page sections
      const cleanSection = hash.replace('#', '');
      if (cleanSection === 'iphones') {
        closeAllModals();
        setSelectedBrand('Apple');
        setSelectedGeneration('all');
        setActiveSection('iphones');
        scrollToSection('iphones');
        return;
      }
      if (cleanSection === 'search') {
        closeAllModals();
        setActiveSection('search');
        scrollToSection('explore');
        return;
      }
      if (cleanSection === 'rental-benefits') {
        closeAllModals();
        setActiveSection('rental-benefits');
        scrollToSection('benefits');
        return;
      }
      if (
        cleanSection === 'contact-info' ||
        cleanSection === 'phone-whatsapp-support' ||
        cleanSection === 'support-email' ||
        cleanSection === 'store-location' ||
        cleanSection === 'operating-hours' ||
        cleanSection === 'inquiry'
      ) {
        closeAllModals();
        setActiveSection(cleanSection);
        scrollToSection(cleanSection);
        return;
      }

      const validSections = ['home', 'featured', 'explore', 'how-it-works', 'benefits', 'faq', 'contact'];
      if (validSections.includes(cleanSection)) {
        closeAllModals();
        setActiveSection(cleanSection);
        scrollToSection(cleanSection);
      }
    };

    // Run on initial load
    handleUrlHash();

    window.addEventListener('hashchange', handleUrlHash);
    window.addEventListener('popstate', handleUrlHash);
    return () => {
      window.removeEventListener('hashchange', handleUrlHash);
      window.removeEventListener('popstate', handleUrlHash);
    };
  }, []);

  // Scrollspy: Observe visible sections on page scroll when modals are closed
  useEffect(() => {
    const isAnyModalOpen =
      isListPhoneOpen ||
      isMyBookingOpen ||
      isMyPaymentsOpen ||
      isProfileOpen ||
      isSubmitPaymentOpen ||
      isAdminOpen ||
      isLegalOpen ||
      !!selectedPhoneForDetails ||
      !!selectedPhoneForBooking;

    if (isAnyModalOpen) return;

    const sections = ['home', 'featured', 'explore', 'how-it-works', 'benefits', 'faq', 'contact'];
    const elements = sections
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Sort by intersection ratio or position
          const topVisible = visible.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          if (topVisible.target.id) {
            setActiveSection(topVisible.target.id);
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -50% 0px',
        threshold: [0.1, 0.3, 0.6]
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [
    isListPhoneOpen,
    isMyBookingOpen,
    isMyPaymentsOpen,
    isProfileOpen,
    isSubmitPaymentOpen,
    isAdminOpen,
    isLegalOpen,
    selectedPhoneForDetails,
    selectedPhoneForBooking
  ]);

  // Handle closing modal and reverting URL hash safely
  const handleModalClose = () => {
    closeAllModals();
    const currentHash = window.location.hash;
    if (
      currentHash === '#my-booking' ||
      currentHash === '#my-payments' ||
      currentHash === '#submit-payment' ||
      currentHash === '#screenshot-upload' ||
      currentHash === '#profile' ||
      currentHash === '#list-phone' ||
      currentHash.startsWith('#admin') ||
      currentHash.startsWith('#legal')
    ) {
      window.history.replaceState(null, '', '#explore');
      setActiveSection('explore');
    }
  };

  // Active section title for Navbar breadcrumb
  // Active section title for Navbar breadcrumb
  const getActiveSectionTitle = (): string => {
    const item = findNavItemById(activeSection);
    if (item) return item.label;
    if (activeSection === 'iphones') return 'Apple iPhones Fleet';
    if (activeSection === 'featured') return 'Featured Flagships';
    if (activeSection === 'explore') return 'Product Listings & Catalog';
    if (activeSection === 'home') return 'Home & Highlights';
    return 'Storefront';
  };

  // Filtered phone list
  const filteredPhones = phones.filter((p) => {
    // 1. Brand Filter
    if (selectedBrand !== 'All' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }

    // 2. iPhone Generation Filter
    if (selectedGeneration !== 'all') {
      const model = p.model.toLowerCase();
      if (selectedGeneration === '17' && !model.includes('17')) return false;
      if (selectedGeneration === '16' && !model.includes('16')) return false;
      if (selectedGeneration === '15' && !model.includes('15')) return false;
      if (selectedGeneration === '14' && !model.includes('14')) return false;
      if (selectedGeneration === '13' && !model.includes('13')) return false;
      if (selectedGeneration === '12' && !model.includes('12')) return false;
      if (selectedGeneration === '11' && !model.includes('11')) return false;
      if (selectedGeneration === 'x' && !model.includes('xs') && !model.includes('xr') && !model.includes('iphone x')) return false;
      if (selectedGeneration === '8' && !model.includes('iphone 8') && !model.includes('se')) return false;
    }

    // 3. Condition Filter
    if (conditionFilter !== 'All' && p.condition.toLowerCase() !== conditionFilter.toLowerCase()) {
      return false;
    }

    // 4. Storage Filter
    if (storageFilter !== 'all' && !p.storage.toLowerCase().includes(storageFilter.toLowerCase())) {
      return false;
    }

    // 5. Availability Filter
    if (availabilityFilter !== 'all') {
      if (availabilityFilter === 'available' && p.status !== 'available') return false;
      if (availabilityFilter === 'rented' && p.status !== 'rented') return false;
      if (availabilityFilter === 'maintenance' && p.status !== 'maintenance') return false;
    }

    // 6. Price Range Filter (evaluated on daily price)
    if (priceRangeFilter !== 'all') {
      const price = durationRateMode === 'weekly' ? p.weeklyPrice : durationRateMode === 'monthly' ? p.monthlyPrice : p.dailyPrice;
      if (priceRangeFilter === 'under-150' && price >= 150) return false;
      if (priceRangeFilter === '150-250' && (price < 150 || price > 250)) return false;
      if (priceRangeFilter === '250-400' && (price < 250 || price > 400)) return false;
      if (priceRangeFilter === 'above-400' && price <= 400) return false;
    }

    // 7. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        p.model.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.ram.toLowerCase().includes(q) ||
        p.storage.toLowerCase().includes(q) ||
        (p.specifications?.processor || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort by selected criteria & duration plan mode
  const sortedPhones = [...filteredPhones].sort((a, b) => {
    const priceA = durationRateMode === 'weekly' ? a.weeklyPrice : durationRateMode === 'monthly' ? a.monthlyPrice : a.dailyPrice;
    const priceB = durationRateMode === 'weekly' ? b.weeklyPrice : durationRateMode === 'monthly' ? b.monthlyPrice : b.dailyPrice;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const featuredPhones = phones.filter((p) => p.featured && p.approvalStatus === 'approved');

  // ========================================================================
  // VIEW SWITCH: RUSHPAY FINANCIAL PLATFORM (EXCLUSIVE APPLICATION VIEW)
  // ========================================================================
  if (currentAppView === 'rushpay') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Dashboard or Landing based on session */}
        {rushUser && rushDashboardData ? (
          <RushDashboard
            profile={rushDashboardData.profile}
            wallet={rushDashboardData.wallet}
            recentOrders={rushDashboardData.recentOrders}
            recentWithdrawals={rushDashboardData.recentWithdrawals}
            recentLedger={rushDashboardData.recentLedger}
            rates={rushDashboardData.rates}
            config={rushDashboardData.config}
            teamStats={rushDashboardData.teamStats}
            onRefreshData={loadRushData}
            onOpenAdmin={() => {
              setIsAdminLoggedIn(true);
              setIsAdminOpen(true);
            }}
            onLogout={async () => {
              await rushApi.logout();
              setRushUser(null);
              setRushDashboardData(null);
              showToast('Logged out of RAZY PAY');
            }}
          />
        ) : (
          <RushLanding
            rates={rushPublicInfo.rates}
            config={rushPublicInfo.config}
            isLoggedIn={!!rushUser}
            onOpenLogin={() => {
              setRushAuthMode('login');
              setRushAuthOpen(true);
            }}
            onOpenRegister={() => {
              setRushAuthMode('register');
              setRushAuthOpen(true);
            }}
            onOpenDashboard={loadRushData}
          />
        )}

        {/* Auth Modal */}
        {rushAuthOpen && (
          <RushAuthModal
            mode={rushAuthMode}
            onClose={() => setRushAuthOpen(false)}
            onSwitchMode={(m) => setRushAuthMode(m)}
            onSuccess={(user) => {
              setRushAuthOpen(false);
              setRushUser(user);
              loadRushData();
              showToast(`Welcome to RAZY PAY, ${user.fullName}!`);
            }}
          />
        )}

        {/* Secure Admin Dashboard Modal (Protected Server-Side) */}
        {isAdminOpen && (
          <AdminDashboardModal
            initialTab={adminInitialTab}
            onClose={handleModalClose}
            onRefreshData={loadStoreData}
            onTabChange={(tab) => {
              setAdminInitialTab(tab);
              window.history.replaceState(null, '', `#admin/${tab}`);
              setActiveSection(`admin-${tab}`);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row text-slate-900 selection:bg-purple-200 selection:text-purple-950 font-sans">
      {/* 1. Desktop Sidebar Navigation */}
      <SidebarNavigation
        activeSection={activeSection}
        onNavigate={handleNavigateItem}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        onOpenRushPay={() => setCurrentAppView('rushpay')}
        phoneCount={phones.length}
        navGroups={userNavGroups}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toast Notification Banner */}
        {toast && (
          <div className="fixed top-20 right-4 z-50 p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toast}</span>
          </div>
        )}

        {/* Top Navbar Header */}
        <Navbar
          onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
          activeSectionTitle={getActiveSectionTitle()}
          onNavigate={(sectionId) => handleNavigateSection(sectionId)}
          onOpenListPhone={() => handleNavigateItemById('list-phone')}
          onOpenMyBooking={() => handleNavigateItemById('my-booking')}
          onOpenMyPayments={() => handleNavigateItemById('my-payments')}
          onOpenAdmin={() => handleNavigateItemById('admin-overview')}
          onOpenRushPay={() => setCurrentAppView('rushpay')}
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
          isAdminLoggedIn={isAdminLoggedIn}
          phoneCount={phones.length}
        />

        {/* Page Content */}
        <main className="flex-1">
          {/* Section: Home & Hero */}
          <Hero
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedBrand={selectedBrand}
            onBrandSelect={setSelectedBrand}
            onExploreClick={() => handleNavigateSection('explore')}
            onListPhoneClick={() => handleNavigateItemById('list-phone')}
          />

          {/* Section: Featured Phones */}
          {featuredPhones.length > 0 && (
            <section id="featured" className="py-12 sm:py-16 bg-white border-b border-slate-200/60">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-black uppercase tracking-wider">
                      Featured Flagships
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
                      Most Popular Refurbished Phones This Week
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPhones.slice(0, 3).map((phone) => (
                    <PhoneCard
                      key={phone.id}
                      phone={phone}
                      onViewDetails={(p) => setSelectedPhoneForDetails(p)}
                      onRentNow={(p) => {
                        setSelectedPhoneForBooking(p);
                        setBookingDays(1);
                      }}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Dedicated Section Anchor for #iphones */}
          <div id="iphones" className="scroll-mt-20" />

          {/* Section: Explore Product Listings & Catalog */}
          <section id="explore" className="py-8 sm:py-12 bg-slate-50 border-b border-slate-200/60 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
              {/* Phones Grid */}
              {isLoading ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Loading approved phone fleet...</p>
                </div>
              ) : sortedPhones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedPhones.map((phone) => (
                    <PhoneCard
                      key={phone.id}
                      phone={phone}
                      onViewDetails={(p) => setSelectedPhoneForDetails(p)}
                      onRentNow={(p) => {
                        setSelectedPhoneForBooking(p);
                        setBookingDays(1);
                      }}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3 max-w-md mx-auto">
                  <Smartphone className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-900">No Smartphones Found</h4>
                  <p className="text-xs text-slate-500">
                    No phone listings matched your filter criteria. Try adjusting generation, price, or storage filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('All');
                      setSelectedGeneration('all');
                      setConditionFilter('All');
                      setPriceRangeFilter('all');
                      setStorageFilter('all');
                      setAvailabilityFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-900 text-white font-bold text-xs cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Section: Contact & Footer (extra bottom padding on mobile for bottom navigation bar) */}
        <div className="pb-20 lg:pb-0">
          <ContactSection
            onOpenLegal={(tab) => {
              setLegalTab(tab);
              setIsLegalOpen(true);
              setActiveSection('legal');
              window.history.pushState(null, '', '#legal');
            }}
            onOpenMyBooking={() => handleNavigateItemById('my-booking')}
            onOpenListPhone={() => handleNavigateItemById('list-phone')}
          />
        </div>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (replaces top 3-line hamburger) */}
      <BottomNavigation
        activeSection={activeSection}
        onNavigateItem={handleNavigateItem}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* 4. Full Navigation Drawer (opened from 'All Menus' tab in bottom navigation) */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeSection={activeSection}
        onNavigate={handleNavigateItem}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        phoneCount={phones.length}
        navGroups={userNavGroups}
      />

      {/* 4. MODALS (Every section has its dedicated modal connected) */}

      {/* Phone Details Modal */}
      {selectedPhoneForDetails && (
        <PhoneDetailsModal
          phone={selectedPhoneForDetails}
          onClose={() => setSelectedPhoneForDetails(null)}
          onProceedToBook={(phone, days) => {
            setSelectedPhoneForDetails(null);
            setSelectedPhoneForBooking(phone);
            setBookingDays(days || 1);
          }}
          onAddToCart={(phone, color, storage) => {
            handleAddToCart(phone, color, storage);
          }}
        />
      )}

      {/* Rental Booking & Dynamic QR Payment Modal */}
      {selectedPhoneForBooking && (
        <RentalBookingModal
          phone={selectedPhoneForBooking}
          initialDays={bookingDays}
          qrSettings={qrSettings || undefined}
          onClose={() => setSelectedPhoneForBooking(null)}
          onBookingSuccess={(booking) => {
            showToast(`Booking ${booking.id} created! QR payment rail active.`);
            loadStoreData();
          }}
        />
      )}

      {/* List a Phone Modal (Monetize) */}
      {isListPhoneOpen && (
        <ListPhoneModal
          onClose={handleModalClose}
          onSuccess={(listing) => {
            showToast(`Listing ${listing.model} submitted for admin review!`);
            loadStoreData();
          }}
        />
      )}

      {/* Track My Booking Modal */}
      {isMyBookingOpen && (
        <MyBookingModal
          initialMode={myBookingInitialMode}
          onClose={handleModalClose}
          onOpenSubmitPayment={(b) => {
            setSelectedBookingForPayment(b);
            setSubmitPaymentMode('payment');
            setIsSubmitPaymentOpen(true);
          }}
        />
      )}

      {/* My Payments Modal */}
      {isMyPaymentsOpen && (
        <MyPaymentsModal
          onClose={handleModalClose}
          onOpenSubmitPayment={(bId) => {
            setSubmitPaymentMode('payment');
            setIsSubmitPaymentOpen(true);
          }}
          onOpenScreenshotUpload={(bId) => {
            setSubmitPaymentMode('screenshot');
            setIsSubmitPaymentOpen(true);
          }}
          onOpenBookingLookup={(bId) => {
            setIsMyBookingOpen(true);
          }}
        />
      )}

      {/* Customer Profile Modal */}
      {isProfileOpen && (
        <CustomerProfileModal
          onClose={handleModalClose}
          onOpenMyBookings={() => {
            setIsMyBookingOpen(true);
          }}
          onOpenMyPayments={() => {
            setIsMyPaymentsOpen(true);
          }}
          onOpenExplore={() => {
            handleNavigateSection('explore');
          }}
          onOpenListPhone={() => {
            setIsListPhoneOpen(true);
          }}
        />
      )}

      {/* Submit Payment & Screenshot Upload Modal */}
      {isSubmitPaymentOpen && (
        <SubmitPaymentModal
          initialBooking={selectedBookingForPayment}
          initialMode={submitPaymentMode}
          onClose={handleModalClose}
          onSuccess={(claim) => {
            showToast(`Payment ${claim.id} submitted for verification!`);
            loadStoreData();
          }}
        />
      )}

      {/* Dedicated UPI QR Payment Modal */}
      {isUpiQrOpen && (
        <UpiQrPaymentModal
          qrSettings={qrSettings}
          onClose={handleModalClose}
          onOpenSubmitPayment={(mode) => {
            setIsUpiQrOpen(false);
            setSubmitPaymentMode(mode);
            setIsSubmitPaymentOpen(true);
          }}
        />
      )}

      {/* Dedicated About Chandan Store Modal */}
      {isAboutOpen && (
        <AboutModal
          onClose={handleModalClose}
          onExplorePhones={() => {
            setIsAboutOpen(false);
            handleNavigateSection('explore');
          }}
        />
      )}

      {/* Secure Admin Dashboard Modal (Protected Server-Side) */}
      {isAdminOpen && (
        <AdminDashboardModal
          initialTab={adminInitialTab}
          onClose={handleModalClose}
          onRefreshData={loadStoreData}
          onTabChange={(tab) => {
            setAdminInitialTab(tab);
            window.history.replaceState(null, '', `#admin/${tab}`);
            setActiveSection(`admin-${tab}`);
          }}
        />
      )}

      {/* Legal & Policies Modal */}
      {isLegalOpen && (
        <LegalModal
          initialTab={legalTab}
          onClose={handleModalClose}
        />
      )}

      {/* Shopping Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={handleModalClose}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckoutItem={(phone) => {
          setIsCartOpen(false);
          setSelectedPhoneForBooking(phone);
          setBookingDays(1);
          window.history.pushState(null, '', `#order-${phone.id}`);
        }}
      />
    </div>
  );
}

export default App;
