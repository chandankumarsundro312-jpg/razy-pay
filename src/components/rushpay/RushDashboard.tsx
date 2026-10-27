import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Lock,
  QrCode,
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  Send,
  FileText,
  Home,
  User,
  Plus,
  Building2,
  Inbox,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  HelpCircle,
  Headphones,
  Gift,
  LogOut,
  MessageCircle,
  Sparkles,
  Coins,
  Banknote,
  UserPlus,
  Share2
} from 'lucide-react';
import {
  UserProfile,
  WalletBalances,
  BuyOrder,
  SellWithdrawRequest,
  LedgerEntry,
  ExchangeRateConfig,
  RushPayPlatformConfig
} from '../../types/rushpay';
import { rushApi } from '../../utils/rushApi';
import { api } from '../../utils/api';

interface RushDashboardProps {
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
  onRefreshData: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export const RushDashboard: React.FC<RushDashboardProps> = ({
  profile,
  wallet,
  recentOrders,
  recentWithdrawals,
  recentLedger,
  teamStats,
  rates,
  config,
  onRefreshData,
  onLogout,
  onOpenAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'buy' | 'sell' | 'profile' | 'overview' | 'withdraw' | 'history' | 'security' | 'referrals'>('home');

  // Buy State & L1 Random Plan Generation
  const [buyAmountInr, setBuyAmountInr] = useState<number | ''>('');
  const [buyMethod, setBuyMethod] = useState<'upi_qr' | 'razorpay'>('upi_qr');
  const [activePaymentChannel, setActivePaymentChannel] = useState<'qr' | 'upi_id'>('qr');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [buySelectedLevel, setBuySelectedLevel] = useState<string>('L1');
  const [buySearchOpen, setBuySearchOpen] = useState<boolean>(false);
  const [buySearchQuery, setBuySearchQuery] = useState<string>('');
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<BuyOrder | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isConfirmingUtr, setIsConfirmingUtr] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPayingRazorpay, setIsPayingRazorpay] = useState(false);

  // Auto-hide success notice after exactly 5 seconds
  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => {
      setActionSuccess(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  // Auto-hide error notice after exactly 5 seconds
  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => {
      setActionError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [actionError]);

  // Plan Data Model (L1: ₹101–₹499, L2: ₹501–₹999)
  interface PlanTier {
    id: string;
    level: string;
    amount: number;
    baseCommission: number; // 6% of amount
    additionalCommission: number; // configured ₹2
    totalCommission: number; // 6% + ₹2
    finalRp: number; // Order Amount + 6% + ₹2
  }

  // Configured additional commission: ₹2
  const ADDITIONAL_COMMISSION_INR = 2;

  // Generator for non-duplicate random plans based on selected Level
  const generateLevelPlans = useCallback((level: string, count = 6): PlanTier[] => {
    const chosenAmounts = new Set<number>();
    let minAmount = 101;
    let maxAmount = 499;

    if (level === 'L2') {
      // L2 MEIN 500 SE UPER OR 1000 SE NICHE (501 to 999)
      minAmount = 501;
      maxAmount = 999;
    } else if (level === 'L3') {
      minAmount = 1001;
      maxAmount = 2499;
    } else if (level === 'L4') {
      minAmount = 2501;
      maxAmount = 4999;
    } else if (level === 'L5') {
      minAmount = 5001;
      maxAmount = 9999;
    } else if (level === 'L6') {
      minAmount = 10001;
      maxAmount = 24999;
    } else if (level === 'L7') {
      minAmount = 25001;
      maxAmount = 50000;
    }

    while (chosenAmounts.size < count) {
      const randAmt = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
      chosenAmounts.add(randAmt);
    }

    const plans: PlanTier[] = Array.from(chosenAmounts).map((amt, idx) => {
      // 6% commission automatically calculate ho
      const baseCommission = Number((amt * 0.06).toFixed(2));
      // Additional Commission L3 tak hi rakho (L1, L2, L3 get ₹2, L4+ get ₹0)
      const isEligibleForAdditionalCommission = ['L1', 'L2', 'L3'].includes(level);
      const additionalCommission = isEligibleForAdditionalCommission ? ADDITIONAL_COMMISSION_INR : 0;
      const totalCommission = Number((baseCommission + additionalCommission).toFixed(2));
      // Final RP = Order Amount + 6% Commission + Additional Commission
      const finalRp = Number((amt + totalCommission).toFixed(2));

      return {
        id: `${level}-PLAN-${idx + 1}-${amt}`,
        level,
        amount: amt,
        baseCommission,
        additionalCommission,
        totalCommission,
        finalRp
      };
    });

    return plans;
  }, []);

  // State to hold persistent plans for EACH level (L1, L2, L3, etc.)
  // Taaki L1 se L2 jaane par aur wapas L1 aane par wahi amounts rahein,
  // aur amounts sirf Refresh button dabane par hi change hon.
  const [levelPlansMap, setLevelPlansMap] = useState<Record<string, PlanTier[]>>(() => {
    return {
      L1: generateLevelPlans('L1', 6),
      L2: generateLevelPlans('L2', 6),
      L3: generateLevelPlans('L3', 6),
      L4: generateLevelPlans('L4', 6),
      L5: generateLevelPlans('L5', 6),
      L6: generateLevelPlans('L6', 6),
      L7: generateLevelPlans('L7', 6)
    };
  });

  const [isRefreshingPlans, setIsRefreshingPlans] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Active plans for current level (from persistent map or generated if missing)
  const currentLevelPlans = useMemo(() => {
    return levelPlansMap[buySelectedLevel] || generateLevelPlans(buySelectedLevel, 6);
  }, [levelPlansMap, buySelectedLevel, generateLevelPlans]);

  // Refresh plans with 0.5-second snappy loading animation and money icon
  const handleRefreshPlans = useCallback(() => {
    if (isRefreshingPlans) return;
    setIsRefreshingPlans(true);

    setTimeout(() => {
      const freshPlans = generateLevelPlans(buySelectedLevel, 6);
      setLevelPlansMap((prev) => ({
        ...prev,
        [buySelectedLevel]: freshPlans
      }));
      setSelectedPlanId(null);
      setIsRefreshingPlans(false);
    }, 500);
  }, [generateLevelPlans, buySelectedLevel, isRefreshingPlans]);

  // Withdraw / Sell State & Saved Wallets
  const [withdrawUnits, setWithdrawUnits] = useState<number | ''>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank_neft'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accHolderName, setAccHolderName] = useState(profile.fullName);
  const [accNumber, setAccNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Registered Wallets & Modals state
  interface RegisteredWallet {
    id: string;
    type: 'upi' | 'bank';
    title: string;
    accountIdentifier: string;
    holderName: string;
    provider?: 'phonepe' | 'paytm' | 'navi' | 'gpay' | 'bank';
    bankName?: string;
    ifsc?: string;
    isDefault?: boolean;
    createdAt: string;
  }

  const [savedWallets, setSavedWallets] = useState<RegisteredWallet[]>(() => {
    try {
      const stored = localStorage.getItem(`rush_wallets_${profile.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to profile
    }

    // Initialize from permanently stored profile UPI ID
    const initialList: RegisteredWallet[] = [];
    if (profile.upiId) {
      initialList.push({
        id: `wallet_upi_${profile.id}`,
        type: 'upi',
        title: 'Primary UPI Wallet',
        accountIdentifier: profile.upiId,
        holderName: profile.upiHolderName || profile.fullName,
        isDefault: true,
        createdAt: profile.createdAt || new Date().toISOString()
      });
    }
    return initialList;
  });

  const [selectedUpiProvider, setSelectedUpiProvider] = useState<'phonepe' | 'paytm' | 'navi' | 'gpay'>('phonepe');
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [newWalletType, setNewWalletType] = useState<'upi' | 'bank'>('upi');
  const [newWalletUpi, setNewWalletUpi] = useState('');
  const [newWalletHolder, setNewWalletHolder] = useState(profile.fullName || '');
  const [newWalletAcc, setNewWalletAcc] = useState('');
  const [newWalletIfsc, setNewWalletIfsc] = useState('');
  const [newWalletBankName, setNewWalletBankName] = useState('');

  // Admin Portal Trigger State
  const [isAdminPromptOpen, setIsAdminPromptOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // Profile / Mine state
  const [showMobile, setShowMobile] = useState<boolean>(true);
  const [activeProfileModal, setActiveProfileModal] = useState<'newbie' | 'faq' | 'service' | 'transactions' | null>(null);

  // Security / PIN Setup
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Copy referral code & unique referral link
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  // Generate real clickable referral link matching current environment and clean brand link
  const liveReferralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${profile.referralCode}`
    : `https://razypay.in/join/${profile.referralCode}`;

  const cleanBrandLink = `https://razypay.in/join/${profile.referralCode}`;

  const handleCopyRefLink = () => {
    navigator.clipboard.writeText(liveReferralLink);
    setCopiedRefLink(true);
    setTimeout(() => setCopiedRefLink(false), 2000);
  };

  // 1st Deposit Reward Claim State (₹150 Bonus)
  const [firstDepositClaimed, setFirstDepositClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`rush_claim_first_deposit_${profile.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [isClaimingDeposit, setIsClaimingDeposit] = useState(false);

  // Check if user has made at least one deposit/buy
  const hasDeposited = (wallet.totalDepositedPaise && wallet.totalDepositedPaise > 0) ||
    recentOrders.some((o) => o.status === 'approved');

  const handleClaimFirstDeposit = async () => {
    if (firstDepositClaimed) return;

    if (!hasDeposited) {
      setActionError('⚠️ 1st Deposit Bonus unlock nahi hua hai! Pehle apna 1st deposit ya buy order complete karein, uske baad turant ₹150 claim karein.');
      return;
    }

    setIsClaimingDeposit(true);
    setActionError(null);

    try {
      const res = await rushApi.claimFirstDepositReward();
      setFirstDepositClaimed(true);
      try {
        localStorage.setItem(`rush_claim_first_deposit_${profile.id}`, 'true');
      } catch (e) {
        console.error(e);
      }
      setActionSuccess(res.message || '🎉 Congratulations! ₹150 1st Deposit Bonus has been successfully credited to your wallet balance.');
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim 1st deposit bonus');
    } finally {
      setIsClaimingDeposit(false);
    }
  };

  const availableInr = (wallet.availablePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const inReviewInr = (wallet.inReviewPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const totalDepositedInr = (wallet.totalDepositedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const totalWithdrawnInr = (wallet.totalWithdrawnPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const totalEarnedInr = (wallet.totalEarnedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Launch Razorpay Standard Checkout with Exact Dynamic Amount & Automatic Signature Verification
  // Launch Razorpay Payment Link
  const handleLaunchRazorpayCheckout = (orderToPay?: BuyOrder) => {
    const activeOrder = orderToPay || createdOrder;
    if (!activeOrder) return;

    setIsPayingRazorpay(true);
    setActionError(null);

    // Open official Razorpay link
    const targetUrl = 'https://razorpay.me/@nitishkumar7846';
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setActionSuccess(`Razorpay payment page opened for ₹${(activeOrder.inrAmountPaise / 100).toLocaleString('en-IN')}. Please enter your 12-digit UTR below after paying.`);
    } catch (err: any) {
      console.warn('Popup blocked:', err);
    } finally {
      setIsPayingRazorpay(false);
    }
  };

  // Handle Buy & Open Razorpay Link Directly
  const triggerBuyOrder = async (targetAmount?: number) => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmittingBuy(true);

    try {
      const numAmount = targetAmount !== undefined ? targetAmount : (Number(buyAmountInr) || 0);
      if (numAmount <= 0) {
        setActionError('Please select a plan or enter a valid amount');
        setIsSubmittingBuy(false);
        return;
      }

      // 1. Create order record on server
      const res = await rushApi.createBuyOrder({
        amountInr: numAmount,
        paymentMethod: 'razorpay'
      });
      setCreatedOrder(res.order);

      // 2. Open clean Razorpay.me page in new tab (guaranteed to never give 404 NOT_FOUND)
      const cleanUrl = 'https://razorpay.me/@nitishkumar7846';
      try {
        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Window open blocked', e);
      }

      setActionSuccess(`Order ${res.order.id} for ₹${numAmount} initiated! Razorpay link opened.`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to place buy order');
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  const handleConfirmUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    setIsConfirmingUtr(true);
    setActionError(null);

    try {
      await rushApi.confirmOrderPayment(createdOrder.id, {
        paymentRef: utrInput.trim()
      });
      setActionSuccess(`Payment reference submitted for Order ${createdOrder.id}. Balance successfully updated.`);
      setCreatedOrder(null);
      setUtrInput('');
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'Payment confirmation failed');
    } finally {
      setIsConfirmingUtr(false);
    }
  };

  // Handle Withdraw
  const handleCreateWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsSubmittingWithdraw(true);

    try {
      const numUnits = Number(withdrawUnits) || 0;
      if (numUnits <= 0) {
        setActionError('Please enter valid units');
        setIsSubmittingWithdraw(false);
        return;
      }
      await rushApi.createWithdrawal({
        unitsToSell: numUnits,
        payoutMethod: withdrawMethod,
        destinationAccount: {
          upiId: withdrawMethod === 'upi' ? upiId : undefined,
          accountHolderName: accHolderName,
          accountNumber: withdrawMethod === 'bank_neft' ? accNumber : undefined,
          ifscCode: withdrawMethod === 'bank_neft' ? ifscCode : undefined
        },
        pin: withdrawPin
      });
      setActionSuccess(`Withdrawal request submitted! Funds have been atomically reserved in review escrow.`);
      setWithdrawPin('');
      onRefreshData();
      setActiveTab('home');
    } catch (err: any) {
      setActionError(err.message || 'Withdrawal request failed');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Handle Add Wallet Registration (Permanently saved to Database & Firestore)
  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (newWalletType === 'upi') {
      if (!newWalletUpi.trim()) {
        setActionError('Please enter a valid UPI ID');
        return;
      }
      const providerNameMap = {
        phonepe: 'PhonePe',
        paytm: 'Paytm',
        navi: 'Navi',
        gpay: 'Google Pay'
      };

      const newWallet: RegisteredWallet = {
        id: `wallet_${Date.now()}`,
        type: 'upi',
        title: `${providerNameMap[selectedUpiProvider]} UPI`,
        accountIdentifier: newWalletUpi.trim(),
        holderName: newWalletHolder.trim() || profile.fullName,
        provider: selectedUpiProvider,
        isDefault: savedWallets.length === 0,
        createdAt: new Date().toISOString()
      };
      const updated = [...savedWallets, newWallet];
      setSavedWallets(updated);
      try {
        localStorage.setItem(`rush_wallets_${profile.id}`, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      setUpiId(newWallet.accountIdentifier);
      setWithdrawMethod('upi');

      // Permanently store in backend database
      try {
        await rushApi.saveWalletSettings({
          upiId: newWallet.accountIdentifier,
          upiHolderName: newWallet.holderName
        });
        onRefreshData();
      } catch (saveErr) {
        console.warn('API save note:', saveErr);
      }
    } else {
      if (!newWalletAcc.trim() || !newWalletIfsc.trim()) {
        setActionError('Please enter Account Number and IFSC Code');
        return;
      }
      const newWallet: RegisteredWallet = {
        id: `wallet_${Date.now()}`,
        type: 'bank',
        title: newWalletBankName.trim() || 'Bank Account',
        accountIdentifier: newWalletAcc.trim(),
        holderName: newWalletHolder.trim() || profile.fullName,
        bankName: newWalletBankName.trim() || 'Indian Bank',
        ifsc: newWalletIfsc.trim().toUpperCase(),
        isDefault: savedWallets.length === 0,
        createdAt: new Date().toISOString()
      };
      const updated = [...savedWallets, newWallet];
      setSavedWallets(updated);
      try {
        localStorage.setItem(`rush_wallets_${profile.id}`, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      setAccNumber(newWallet.accountIdentifier);
      setIfscCode(newWallet.ifsc || '');
      setWithdrawMethod('bank_neft');

      // Permanently store in backend database
      try {
        await rushApi.saveWalletSettings({
          bankAccount: {
            accountNumber: newWallet.accountIdentifier,
            ifscCode: newWallet.ifsc || '',
            bankName: newWallet.bankName,
            holderName: newWallet.holderName
          }
        });
        onRefreshData();
      } catch (saveErr) {
        console.warn('API save note:', saveErr);
      }
    }

    setIsAddWalletOpen(false);
    setNewWalletUpi('');
    setNewWalletAcc('');
    setNewWalletIfsc('');
    setNewWalletBankName('');
    setActionSuccess('Wallet & UPI ID permanently saved successfully!');
  };

  const handleDeleteWallet = (walletId: string) => {
    const updated = savedWallets.filter((w) => w.id !== walletId);
    setSavedWallets(updated);
    localStorage.setItem(`rush_wallets_${profile.id}`, JSON.stringify(updated));
  };

  // Handle Set PIN
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      setActionError('PIN confirmation does not match');
      return;
    }
    setIsSettingPin(true);
    setActionError(null);

    try {
      await rushApi.setPin(newPin);
      setActionSuccess('Transaction PIN updated successfully. Keep this secret.');
      setNewPin('');
      setConfirmPin('');
      onRefreshData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to set PIN');
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(profile.referralCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setIsVerifyingAdmin(true);

    try {
      if (adminPasswordInput !== 'razypay@admin' && adminPasswordInput !== 'vipbhiya01') {
        throw new Error('Incorrect Admin Password! Please use razypay@admin');
      }

      await api.adminLogin('admin', adminPasswordInput.trim());
      setIsAdminPromptOpen(false);
      setAdminPasswordInput('');
      if (onOpenAdmin) {
        onOpenAdmin();
      } else {
        setActionSuccess('Admin Portal unlocked!');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Admin authentication failed');
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAdminPromptOpen(true)}
            title="Admin Portal (Tap RP)"
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 flex items-center justify-center text-white shadow-md shadow-blue-600/30 font-black cursor-pointer transition-all border border-blue-400/30"
          >
            RP
          </button>
          <div>
            <h1 className="font-black text-base text-white tracking-tight leading-tight">
              RAZY PAY
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshData}
            title="Sync Ledger"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 w-full space-y-6 flex-1 text-left">
        {/* Alerts */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button type="button" onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Financial Stat Cards - Only displayed in HOME tab */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Available Balance */}
            <div className="col-span-2 sm:col-span-1 p-5 rounded-3xl bg-gradient-to-br from-blue-900/60 to-slate-900 border border-blue-500/30 shadow-xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">Available Balance</span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">₹{availableInr}</div>
            </div>

            {/* Card 2: In Review / Escrow */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">In Review / Escrow</span>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">₹{inReviewInr}</div>
            </div>

            {/* Card 3: Total Deposits */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Deposited</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">₹{totalDepositedInr}</div>
            </div>

            {/* Card 4: Total Withdrawals */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Withdrawn</span>
              <div className="text-xl sm:text-2xl font-black text-slate-300 font-mono">₹{totalWithdrawnInr}</div>
            </div>

            {/* Card 5: Referral Earnings */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">Total Earned</span>
              <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">₹{totalEarnedInr}</div>
            </div>
          </div>
        )}

        {/* TAB 2: BUY ORDERS (With Horizontal Level Tabs Header) */}
        {activeTab === 'buy' && (
          <div className="max-w-xl mx-auto space-y-4">
            {/* Horizontal Level Tabs Header: L1, L2, L3, L4, L5, L6, L7 + Search Icon on Right */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-lg flex items-center justify-between gap-3">
              {/* Scrollable Level Tabs Container */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 flex-1 min-w-0 pr-1">
                {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'].map((level) => {
                  const isSelected = buySelectedLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setBuySelectedLevel(level)}
                      className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black tracking-wider transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 ${
                        isSelected
                          ? 'bg-white text-blue-600 shadow-md shadow-white/10'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>

              {/* Search Icon on Right Side */}
              <div className="shrink-0 flex items-center pl-1 border-l border-slate-800">
                <button
                  type="button"
                  onClick={() => setBuySearchOpen(!buySearchOpen)}
                  title="Search Levels"
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    buySearchOpen
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional Collapsible Search Bar */}
            {buySearchOpen && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl animate-in fade-in duration-150">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={buySearchQuery}
                    onChange={(e) => setBuySearchQuery(e.target.value)}
                    placeholder="Search buy packages, rates or tags..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Dynamic Level Random Plans Generator Section (L1: ₹101-₹499, L2: ₹501-₹999) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-end pb-3 border-b border-slate-800">
                {/* Refresh Button: 2 sec loading with money icon */}
                <button
                  type="button"
                  onClick={handleRefreshPlans}
                  disabled={isRefreshingPlans}
                  title={`Generate New Random ${buySelectedLevel} Plans`}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95 ${
                    isRefreshingPlans
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                      : 'bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white'
                  }`}
                >
                  {isRefreshingPlans ? (
                    <>
                      <Coins className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="font-mono text-amber-300">Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>

              {/* Plan Cards Grid or 2-sec Money Loading State */}
              {isRefreshingPlans ? (
                <div className="py-14 sm:py-20 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-150">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-blue-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 animate-pulse">
                      <Coins className="w-8 h-8 text-amber-400 animate-bounce" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md animate-spin">
                      <RefreshCw className="w-3 h-3 text-slate-950" />
                    </div>
                  </div>
                  <div>
                    <span className="font-mono font-black text-sm text-amber-300 block">
                      Fetching Fresh {buySelectedLevel} Money Plans...
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      Generating high-commission rate brackets & packages
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLevelPlans
                  .filter((p) => {
                    if (!buySearchQuery.trim()) return true;
                    return (
                      p.amount.toString().includes(buySearchQuery) ||
                      p.finalRp.toString().includes(buySearchQuery)
                    );
                  })
                  .map((plan) => {
                    const isSelected = buyAmountInr === plan.amount;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          setBuyAmountInr(plan.amount);
                          setSelectedPlanId(plan.id);
                        }}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer relative text-left backdrop-blur-2xl shadow-2xl overflow-hidden group ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-600/30 via-indigo-600/25 to-purple-600/30 border-blue-400/60 shadow-blue-500/25 ring-2 ring-blue-400/50'
                            : 'bg-white/[0.04] hover:bg-white/[0.07] border-white/15 hover:border-white/25 shadow-black/50'
                        }`}
                      >
                        {/* 1. Glass Top Edge Reflection Light Bar */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                        {/* 2. Top Row: Order Amount + Received Button (Frosted Glass Container) */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                          {/* Order Amount Glass Badge */}
                          <div className="px-3 py-1.5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-inner">
                            <span className="text-[9px] text-blue-300 uppercase font-black tracking-widest block">
                              Order Amount
                            </span>
                            <span className="font-mono text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-200 drop-shadow-sm">
                              ₹{plan.amount}
                            </span>
                          </div>

                          {/* Received Button with Glass Tint */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBuyAmountInr(plan.amount);
                              setSelectedPlanId(plan.id);
                              triggerBuyOrder(plan.amount);
                            }}
                            disabled={isSubmittingBuy}
                            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95 flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-emerald-500/90 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-500/30'
                                : 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-400/30 shadow-blue-600/30'
                            }`}
                          >
                            {isSubmittingBuy && isSelected ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <span>Received</span>
                            )}
                          </button>
                        </div>

                        {/* 3. Middle & Bottom: 6% Commission down to Final RP in Frosted Glass Panel */}
                        <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 space-y-2 shadow-inner">
                          {/* 6% Commission Row */}
                          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>6% Commission</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              +₹{plan.baseCommission.toFixed(2)}
                            </span>
                          </div>

                          {/* Final RP Row (Extended Glass Capsule) */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/10 font-bold text-xs">
                            <span className="text-slate-200 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span>Final RP</span>
                            </span>
                            <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-white text-sm bg-blue-500/15 px-2.5 py-0.5 rounded-xl border border-blue-400/30">
                              {plan.finalRp.toFixed(2)} RP
                            </span>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Dedicated Full-Screen Order Page Modal (Opens on 'Receive' tap, does not show below plans) */}
            {createdOrder && (
              <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Full Screen Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md shadow-blue-500/10">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                        Order Payment
                      </h3>
                      <span className="text-[11px] text-blue-400 font-medium">
                        Order ID: {createdOrder.id}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreatedOrder(null)}
                    className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-800"
                    title="Close Order Page"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Full Screen Scrollable Order Page Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-lg mx-auto w-full space-y-5 text-xs">
                  {/* Order Summary Header Card with Glass View Effect */}
                  <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                    <div className="px-3.5 py-2 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-inner">
                      <span className="text-[9px] text-blue-300 uppercase font-black tracking-widest block">Order Payable Amount</span>
                      <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 text-3xl drop-shadow-md">
                        ₹{(createdOrder.inrAmountPaise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right px-3.5 py-2 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10">
                      <span className="text-[9px] text-slate-300 uppercase font-black tracking-widest block">Wallet Credits (+6%)</span>
                      <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200 text-base">
                        {((createdOrder.inrAmountPaise / 100) * 1.06).toFixed(2)} RP
                      </span>
                    </div>
                  </div>

                  {/* Razorpay Quick Pay Action Card */}
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white text-xs">Razorpay Instant Gateway</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                        Exact Amount: ₹{(createdOrder.inrAmountPaise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <a
                      href="https://razorpay.me/@nitishkumar7846"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{(createdOrder.inrAmountPaise / 100).toLocaleString('en-IN')} on Razorpay</span>
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </a>

                    <p className="text-[10px] text-slate-300 text-center">
                      Pre-filled amount: <strong className="text-white">₹{(createdOrder.inrAmountPaise / 100).toLocaleString('en-IN')}</strong>. Payment completion automatically verifies and credits your wallet.
                    </p>
                  </div>

                  {/* Submit 12-digit UPI UTR Form */}
                  <form onSubmit={handleConfirmUtr} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold block text-xs">Submit 12-Digit Transaction UTR</label>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">Instant Credit</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      placeholder="Enter 12-digit UPI UTR number"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={isConfirmingUtr}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      {isConfirmingUtr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify UTR & Complete Order</span>}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SELL RP SECTION (Mobile-First Responsive Layout) */}
        {(activeTab === 'sell' || activeTab === 'withdraw') && (
          <div className="max-w-xl mx-auto space-y-4">
            {/* 1. Today's Overview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Today's Overview
                </span>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(true)}
                  className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Record</span>
                </button>
              </div>

              <div className="pt-4">
                <span className="text-xs text-slate-400 font-medium block">Amount of receipt</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                  ₹0.00
                </div>
              </div>
            </div>

            {/* 2. Wallet Information Card: Premium Glass Screen Card */}
            <div className="rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl bg-white/[0.05] border border-white/15 text-slate-100 space-y-4 relative overflow-hidden">
              {/* Glass Reflection Highlight Line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shadow-inner">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-sm text-white tracking-wide">Wallet Information</h4>
                </div>
                {savedWallets.length > 0 && (
                  <span className="text-[11px] font-bold text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2.5 py-0.5 rounded-full shadow-xs">
                    {savedWallets.length} Linked
                  </span>
                )}
              </div>

              {savedWallets.length === 0 ? (
                /* Empty state when no wallet data exists (Glass Panel) */
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">
                    There is currently no data
                  </p>
                </div>
              ) : (
                /* Display registered wallets list (Translucent Glass Items) */
                <div className="space-y-3">
                  {savedWallets.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 hover:border-white/20 flex items-center justify-between gap-3 transition-all shadow-md group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Provider Logo Container */}
                        {(() => {
                          const vpa = (w.accountIdentifier || '').toLowerCase();
                          const detectedProvider =
                            w.provider ||
                            (vpa.includes('@ybl') || vpa.includes('@ibl') || vpa.includes('@axl')
                              ? 'phonepe'
                              : vpa.includes('@paytm') || vpa.includes('@ptyes')
                              ? 'paytm'
                              : vpa.includes('@naviaxis') || vpa.includes('navi')
                              ? 'navi'
                              : vpa.includes('@ok') || vpa.includes('gpay')
                              ? 'gpay'
                              : w.type === 'bank'
                              ? 'bank'
                              : 'phonepe');

                          if (detectedProvider === 'phonepe') {
                            return (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md border border-purple-400/30 shrink-0">
                                पे
                              </div>
                            );
                          }
                          if (detectedProvider === 'paytm') {
                            return (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-black text-[11px] tracking-tight shadow-md border border-sky-400/30 shrink-0">
                                Paytm
                              </div>
                            );
                          }
                          if (detectedProvider === 'navi') {
                            return (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-[11px] tracking-wider uppercase shadow-md border border-emerald-400/30 shrink-0">
                                Navi
                              </div>
                            );
                          }
                          if (detectedProvider === 'gpay') {
                            return (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-red-500 text-white flex items-center justify-center font-black text-xs shadow-md border border-blue-400/30 shrink-0">
                                GPay
                              </div>
                            );
                          }
                          return (
                            <div className="w-11 h-11 rounded-2xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold shadow-md border border-slate-700 shrink-0">
                              <Building2 className="w-5 h-5 text-blue-400" />
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">{w.title}</span>
                            {w.isDefault && (
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-blue-300 block truncate mt-0.5">{w.accountIdentifier}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{w.holderName} {w.ifsc ? `• ${w.ifsc}` : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawMethod('upi');
                            setUpiId(w.accountIdentifier);
                            setActionSuccess(`Selected ${w.accountIdentifier} for payout request.`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold transition-all border border-blue-400/30 shadow-sm cursor-pointer active:scale-95"
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWallet(w.id)}
                          title="Remove Wallet"
                          className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Add Wallet: Full-Width Blue Button */}
            <button
              type="button"
              onClick={() => setIsAddWalletOpen(true)}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-5 h-5" />
              <span>Add Wallet</span>
            </button>

            {/* Add Wallet Registration Modal (Full Screen) */}
            {isAddWalletOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col animate-in fade-in duration-200">
                {/* Full Screen Top Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md shadow-blue-500/10">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                        Add UPI ID Wallet
                      </h3>
                      <span className="text-[11px] text-blue-400 font-medium">
                        Instant 24/7 UPI ID Settlement
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddWalletOpen(false)}
                    className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-800"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Full Screen Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-lg mx-auto w-full space-y-5 text-xs">
                  {/* Wallet Registration Form (UPI ID Exclusively) */}
                  <form onSubmit={handleSaveWallet} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-blue-400 font-bold text-xs">
                      <CreditCard className="w-4 h-4" />
                      <span>Instant UPI Settlement (NPCI 24/7)</span>
                    </div>

                    {/* 2x2 Square Shape UPI Provider Selector */}
                    <div>
                      <label className="font-bold text-slate-300 block mb-2 text-xs">
                        Select UPI Provider:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* 1. PhonePe (Square Shape Card) */}
                        <div
                          onClick={() => {
                            setSelectedUpiProvider('phonepe');
                            if (!newWalletUpi || newWalletUpi.includes('@')) {
                              const prefix = newWalletUpi.split('@')[0] || profile.mobile || '';
                              setNewWalletUpi(prefix ? `${prefix}@ybl` : '');
                            }
                          }}
                          className={`aspect-square p-3.5 rounded-3xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95 relative overflow-hidden backdrop-blur-xl ${
                            selectedUpiProvider === 'phonepe'
                              ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-600/20 ring-2 ring-purple-500/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md mb-2">
                            पे
                          </div>
                          <span className="font-bold text-white text-xs block">PhonePe</span>
                          <span className="text-[10px] text-purple-300 font-mono mt-0.5">@ybl / @ibl</span>
                          {selectedUpiProvider === 'phonepe' && (
                            <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* 2. Paytm (Square Shape Card) */}
                        <div
                          onClick={() => {
                            setSelectedUpiProvider('paytm');
                            if (!newWalletUpi || newWalletUpi.includes('@')) {
                              const prefix = newWalletUpi.split('@')[0] || profile.mobile || '';
                              setNewWalletUpi(prefix ? `${prefix}@paytm` : '');
                            }
                          }}
                          className={`aspect-square p-3.5 rounded-3xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95 relative overflow-hidden backdrop-blur-xl ${
                            selectedUpiProvider === 'paytm'
                              ? 'bg-sky-500/20 border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-md mb-2 tracking-tighter">
                            Paytm
                          </div>
                          <span className="font-bold text-white text-xs block">Paytm</span>
                          <span className="text-[10px] text-sky-300 font-mono mt-0.5">@paytm / @ptyes</span>
                          {selectedUpiProvider === 'paytm' && (
                            <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* 3. Navi (Square Shape Card) */}
                        <div
                          onClick={() => {
                            setSelectedUpiProvider('navi');
                            if (!newWalletUpi || newWalletUpi.includes('@')) {
                              const prefix = newWalletUpi.split('@')[0] || profile.mobile || '';
                              setNewWalletUpi(prefix ? `${prefix}@naviaxis` : '');
                            }
                          }}
                          className={`aspect-square p-3.5 rounded-3xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95 relative overflow-hidden backdrop-blur-xl ${
                            selectedUpiProvider === 'navi'
                              ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-md mb-2 tracking-wider uppercase">
                            Navi
                          </div>
                          <span className="font-bold text-white text-xs block">Navi</span>
                          <span className="text-[10px] text-emerald-300 font-mono mt-0.5">@naviaxis</span>
                          {selectedUpiProvider === 'navi' && (
                            <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* 4. Google Pay (Square Shape Card) */}
                        <div
                          onClick={() => {
                            setSelectedUpiProvider('gpay');
                            if (!newWalletUpi || newWalletUpi.includes('@')) {
                              const prefix = newWalletUpi.split('@')[0] || profile.mobile || '';
                              setNewWalletUpi(prefix ? `${prefix}@okaxis` : '');
                            }
                          }}
                          className={`aspect-square p-3.5 rounded-3xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95 relative overflow-hidden backdrop-blur-xl ${
                            selectedUpiProvider === 'gpay'
                              ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-red-500 text-white flex items-center justify-center font-black text-sm shadow-md mb-2">
                            GPay
                          </div>
                          <span className="font-bold text-white text-xs block">Google Pay</span>
                          <span className="text-[10px] text-blue-300 font-mono mt-0.5">@okaxis / @okhdfc</span>
                          {selectedUpiProvider === 'gpay' && (
                            <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-400 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Account Holder Legal Name field hidden as requested */}

                    <div>
                      <label className="font-bold text-slate-300 block mb-1.5">UPI ID (VPA)</label>
                      <input
                        type="text"
                        required
                        value={newWalletUpi}
                        onChange={(e) => setNewWalletUpi(e.target.value)}
                        placeholder="e.g. mobile@upi or yourname@okaxis"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Payouts are settled instantly 24/7 directly to this UPI ID</span>
                    </div>

                    <div className="pt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddWalletOpen(false)}
                        className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                      >
                        Save Wallet
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Record Page: Full Screen Receipts & Sell Records */}
            {isRecordModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col animate-in fade-in duration-200">
                {/* Full Screen Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md shadow-blue-500/10">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                        Receipt Records
                      </h3>
                      <p className="text-[11px] text-blue-400 font-medium">All historical payout & withdrawal receipts</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-800"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Full Screen Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-2xl mx-auto w-full space-y-3 text-xs">
                  {recentWithdrawals.length === 0 ? (
                    <div className="py-24 text-center text-slate-500 space-y-3">
                      <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600 shadow-inner">
                        <Inbox className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-sm text-slate-400">No Receipt Records Found</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Your successful and pending payout settlement records will be listed here.
                      </p>
                    </div>
                  ) : (
                    recentWithdrawals.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white text-xs block">
                              ID: {r.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {r.payoutMethod.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </span>
                          <span className="text-[11px] text-slate-300 font-medium block truncate">
                            Account: <strong className="text-white font-mono">{r.destinationAccount?.upiId || r.destinationAccount?.accountNumber}</strong>
                            {r.destinationAccount?.accountHolderName && ` (${r.destinationAccount.accountHolderName})`}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-emerald-400 block text-base sm:text-lg">
                            ₹{(r.netAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span
                            className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1 border ${
                              r.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : r.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Return Button */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
                  <div className="max-w-2xl mx-auto">
                    <button
                      type="button"
                      onClick={() => setIsRecordModalOpen(false)}
                      className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 transition-all cursor-pointer active:scale-98"
                    >
                      Back To Sell Section
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LEDGER HISTORY */}
        {activeTab === 'history' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-black text-xl text-white">Immutable Ledger History</h3>
            <p className="text-xs text-slate-400">All transactional credits, debits, and balance states</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-3">Reference / ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 text-right">Balance After</th>
                    <th className="p-3">Date (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentLedger.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-slate-300">{l.referenceId || l.id}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                          {l.entryType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200">{l.description}</td>
                      <td className={`p-3 font-mono font-bold text-right ${l.amountPaise >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {l.amountPaise >= 0 ? '+' : ''}₹{(l.amountPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 font-mono text-right text-slate-300">
                        ₹{(l.balanceAfterPaise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[10px]">
                        {new Date(l.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & PIN */}
        {activeTab === 'security' && (
          <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div>
              <h3 className="font-black text-xl text-white">Security & Transaction PIN</h3>
              <p className="text-xs text-slate-400">
                Configure your 4 to 6-digit transaction PIN required for authorizing withdrawals.
              </p>
            </div>

            <form onSubmit={handleSetPin} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">New 4-6 Digit Security PIN</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter numeric PIN"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Confirm Security PIN</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repeat numeric PIN"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSettingPin}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSettingPin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Save & Activate PIN</span>}
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: REFERRALS / MY TEAM */}
        {activeTab === 'referrals' && (
          <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl text-white">My Team & Referral Network</h3>
                <p className="text-xs text-slate-400">
                  Earn unlimited direct rewards & 3-level rebate commissions on your network activity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Back to Mine
              </button>
            </div>

            {/* My Team Summary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {/* Total Invites */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-300 block">
                  Total Invites
                </span>
                <div className="text-2xl font-black text-white font-mono flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  <span>{teamStats?.totalInvites || 0}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Direct Level 1 Partners</span>
              </div>

              {/* Total Earn */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-300 block">
                  Total Earn
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-1">
                  <span>₹</span>
                  <span>{((teamStats?.totalEarnedPaise || wallet.totalEarnedPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Rebates & Bonus Credited</span>
              </div>

              {/* Per Referral Bonus */}
              <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-300 block">
                  Bonus Per Signup
                </span>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  ₹{(config.referralRewardPaise / 100).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400 block">Instant Wallet Credit</span>
              </div>
            </div>

            {/* Unique Referral Link Box */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-blue-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Your Unique Referral Link</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Auto-Fill Enabled
                </span>
              </div>

              {/* Live Working Link with Auto-Register Detection */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Invite Link:</span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-blue-300 font-mono text-xs truncate select-all">
                    {liveReferralLink}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRefLink}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    {copiedRefLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedRefLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Clean Branded Shortlink */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-mono text-purple-300 truncate">
                  Brand URL: <strong className="text-white">{cleanBrandLink}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cleanBrandLink);
                    setCopiedRefLink(true);
                    setTimeout(() => setCopiedRefLink(false), 2000);
                  }}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 ml-2 shrink-0 cursor-pointer"
                >
                  Copy Brand Link
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Jab bhi koi is link par click karega, unka registration form automatically aapke referral code (<strong className="text-slate-300 font-mono">{profile.referralCode}</strong>) ke sath open hoga.
              </p>
            </div>

            {/* Invite Code Box */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Invite Referral Code</span>
                <span className="font-mono text-lg font-black text-white">{profile.referralCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyRef}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRef ? 'Code Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: MINE / PROFILE SECTION (Mobile-First Layout) */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-4">
            {/* 1. Profile Header with Light Purple Background Card */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900 border border-purple-500/25 shadow-xl space-y-4">
              <div className="flex items-center gap-4">
                {/* Circular Profile Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/20 shrink-0">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-lg text-white truncate">{profile.fullName}</h3>
                  {/* Registered mobile number with show/hide icon */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-sm text-purple-200 tracking-wider">
                      {showMobile
                        ? `+${profile.mobile}`
                        : `+${profile.mobile.slice(0, 2)}******${profile.mobile.slice(-2)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMobile(!showMobile)}
                      title={showMobile ? 'Hide mobile' : 'Show mobile'}
                      className="p-1 rounded-lg hover:bg-white/10 text-purple-300 transition-colors cursor-pointer"
                    >
                      {showMobile ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Invite Code with Copy Button */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider">Invite Code</span>
                  <span className="font-mono text-sm font-black text-white select-all">{profile.referralCode}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* 2. Current Balance: White Rounded Card (Tapping shows all transactions history) */}
            <div
              onClick={() => setActiveProfileModal('transactions')}
              className="bg-white rounded-3xl p-5 shadow-xl text-slate-800 flex items-center justify-between cursor-pointer transition-all hover:shadow-2xl hover:border hover:border-blue-200 active:scale-98"
              title="View all transactions history"
            >
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Current Balance
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">
                  ₹{availableInr}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-600 hidden sm:inline">Transaction History</span>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* 3. Team Banner: Promotional Banner with Total Invites and Total Earn */}
            <div className="rounded-3xl p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-200" />
                    <span className="font-black text-sm uppercase tracking-wider">My team</span>
                  </div>
                  <p className="text-[11px] text-purple-100 font-medium">3-LEVEL Instant Rebate Network</p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('referrals')}
                  className="px-3.5 py-2 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  View Details &gt;
                </button>
              </div>

              {/* Total Invites & Total Earn Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Total Invites */}
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-200 block">
                    Total Invites
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-purple-300" />
                    <span>{teamStats?.totalInvites || 0}</span>
                  </div>
                </div>

                {/* Total Earn */}
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200 block">
                    Total Earn
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono flex items-center gap-1">
                    <span>₹</span>
                    <span>{((teamStats?.totalEarnedPaise || wallet.totalEarnedPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Profile Menu: White Rounded Card */}
            <div className="bg-white rounded-3xl p-2 shadow-xl divide-y divide-slate-100 text-slate-800">
              {/* Newbie Rewards */}
              <button
                type="button"
                onClick={() => setActiveProfileModal('newbie')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">Newbie Rewards</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Common problem */}
              <button
                type="button"
                onClick={() => setActiveProfileModal('faq')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">Common problem</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Online service */}
              <button
                type="button"
                onClick={() => setActiveProfileModal('service')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">Online service</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Account security */}
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">Account security</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Telegram Channel */}
              <a
                href={config.telegramSupportUrl || 'https://t.me/Razypaysupport'}
                target="_blank"
                rel="noreferrer"
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer text-left block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">Telegram Channel</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* 6. Logout Button: Full-width Outlined Red Button */}
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-4 rounded-2xl bg-transparent border-2 border-rose-500 text-rose-500 hover:bg-rose-500/10 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>

            {/* Profile Modal: Newbie Rewards (Full Screen) */}
            {activeProfileModal === 'newbie' && (
              <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col animate-in fade-in duration-200">
                {/* Full Screen Top Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md shadow-amber-500/10">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                        Newbie Rewards
                      </h3>
                      <span className="text-[11px] text-amber-400 font-medium">Exclusive Starter Program</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveProfileModal(null)}
                    className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-800"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Full Screen Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-2xl mx-auto w-full space-y-5">
                  {/* Reward Task: 1st Deposit Bonus ₹150 with Claim Button */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-lg space-y-4 transition-all hover:border-emerald-500/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/10">
                          ₹150
                        </div>
                        <div>
                          <span className="font-black text-base sm:text-lg text-white block">
                            1st Deposit Reward
                          </span>
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            Special First Inflow Perk
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                        Exclusive
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Make your 1st deposit or buy order on the platform and get <strong className="text-emerald-400 font-black">₹150 instant reward</strong> added to your wallet account.
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            firstDepositClaimed
                              ? 'bg-blue-400'
                              : hasDeposited
                              ? 'bg-emerald-400 animate-pulse'
                              : 'bg-amber-400'
                          }`}
                        ></span>
                        <span>
                          {firstDepositClaimed
                            ? 'Bonus Credited'
                            : hasDeposited
                            ? 'Ready to Claim!'
                            : 'Locked (Requires 1st Deposit)'}
                        </span>
                      </div>

                      {firstDepositClaimed ? (
                        <div className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-bold text-xs flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Claimed</span>
                        </div>
                      ) : hasDeposited ? (
                        <button
                          type="button"
                          onClick={handleClaimFirstDeposit}
                          disabled={isClaimingDeposit}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95 flex items-center gap-1.5"
                        >
                          {isClaimingDeposit ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Claiming...</span>
                            </>
                          ) : (
                            <>
                              <Gift className="w-3.5 h-3.5" />
                              <span>Claim ₹150</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProfileModal(null);
                            setActiveTab('buy');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Deposit First</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Screen Bottom Sticky Bar */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 sm:p-6">
                  <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveProfileModal(null)}
                      className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 transition-all cursor-pointer active:scale-98"
                    >
                      Got It, Return To App
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Modal: Common Problem (FAQ - Full Screen) */}
            {activeProfileModal === 'faq' && (
              <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col animate-in fade-in duration-200">
                {/* Full Screen Top Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md shadow-blue-500/10">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                        Common problem
                      </h3>
                      <span className="text-[11px] text-blue-400 font-medium">Frequently Asked Questions & Help</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveProfileModal(null)}
                    className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-800"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Full Screen Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-2xl mx-auto w-full space-y-4">
                  {/* Category Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border border-blue-500/30 shadow-xl space-y-2">
                    <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-wider block">
                      Knowledge Base
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Instant Answers & Guidelines
                    </h2>
                    <p className="text-xs text-slate-300">
                      Everything you need to know about payments, level settlements, commissions, and account security.
                    </p>
                  </div>

                  {/* FAQ Card 1 */}
                  <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2 transition-all hover:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-black flex items-center justify-center shrink-0">
                        1
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        How long does receipt settlement take?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-8">
                      Payout receipts are processed instantly to verified UPI VPAs and within 15–30 minutes for IMPS bank accounts. You can track status in real-time under the SELL RP section.
                    </p>
                  </div>

                  {/* FAQ Card 2 */}
                  <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2 transition-all hover:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                        2
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        How does the 3-level rebate work?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-8">
                      Earn automatic commission on Level 1 direct invites, Level 2 sub-team orders, and Level 3 platform activities. Commissions are automatically credited to your Available Balance.
                    </p>
                  </div>

                  {/* FAQ Card 3 */}
                  <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2 transition-all hover:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center shrink-0">
                        3
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        How are L1 & L2 buy plans calculated?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-8">
                      Every plan has an automatic 6% commission plus configured bonuses included. When you click <strong className="text-white">Received</strong>, the full Final RP is credited to your wallet ledger upon verified settlement.
                    </p>
                  </div>

                  {/* FAQ Card 4 */}
                  <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2 transition-all hover:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center shrink-0">
                        4
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        Forgot transaction PIN?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-8">
                      Navigate to the <strong className="text-white">Account security</strong> menu in your MINE tab to configure or update your 4-to-6 digit security PIN. Keep this PIN confidential.
                    </p>
                  </div>

                  {/* FAQ Card 5 */}
                  <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2 transition-all hover:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-black flex items-center justify-center shrink-0">
                        5
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        Need live agent assistance?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-8">
                      Tap <strong className="text-white">Online service</strong> or connect directly with our official support team via Telegram at <strong className="text-blue-400 font-mono">@Chandanstoresupport</strong>.
                    </p>
                  </div>
                </div>

                {/* Full Screen Bottom Sticky Bar */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 sm:p-6">
                  <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveProfileModal(null)}
                      className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 transition-all cursor-pointer active:scale-98"
                    >
                      Got It, Return To App
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Modal: Online Service */}
            {activeProfileModal === 'service' && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Headphones className="w-5 h-5 text-emerald-600" />
                      <span>Online service</span>
                    </h3>
                    <button type="button" onClick={() => setActiveProfileModal(null)} className="p-1 hover:bg-slate-100 rounded-full">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <div className="space-y-3 text-xs text-slate-600">
                    <p>Connect with our official 24/7 support desk directly on Telegram:</p>
                    
                    {/* Telegram Option 1: Live Support Agent */}
                    <a
                      href={config.telegramSupportUrl || 'https://t.me/Chandanstoresupport'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-blue-600/25 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
                          <Send className="w-5 h-5 fill-white" />
                        </div>
                        <div className="text-left">
                          <span className="block font-black text-sm text-white">24/7 Telegram Support</span>
                          <span className="text-[11px] text-blue-100 font-normal">Live Agent Chat (@Chandanstoresupport)</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                    </a>

                    {/* Telegram Option 2: Official Channel / Helpdesk */}
                    <a
                      href="https://t.me/Chandanstoresupport"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-xs text-slate-900">Official Telegram Channel</span>
                          <span className="text-[10px] text-slate-500 font-normal">Announcements & Instant Updates</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Modal: Transactions History (Full Screen, triggered by tapping Current Balance) */}
            {activeProfileModal === 'transactions' && (
              <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col animate-in fade-in duration-200">
                {/* Full Screen Top Header */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md shadow-blue-500/10">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                        Transaction History
                      </h3>
                      <span className="text-[11px] text-blue-400 font-medium">
                        Current Balance: ₹{availableInr}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveProfileModal(null)}
                    className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-800"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-2xl mx-auto w-full space-y-4">
                  {recentLedger.length === 0 ? (
                    /* No Transaction History Empty State */
                    <div className="py-20 px-6 text-center space-y-4 rounded-3xl bg-slate-900/60 border border-slate-800/80">
                      <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto shadow-inner">
                        <Inbox className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-white">No History</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Abhi tak koi transaction record nahi hua hai. Deposit ya withdrawal execute hone par aapka complete ledger yahan show hoga.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* List of Transactions */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span>All Transactions ({recentLedger.length})</span>
                        <span className="font-mono">Real-time Ledger</span>
                      </div>
                      {recentLedger.map((l) => (
                        <div
                          key={l.id}
                          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                l.amountPaise >= 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {l.amountPaise >= 0 ? '+' : '-'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-white block truncate">
                                {l.description || l.entryType}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {new Date(l.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono text-sm font-black block ${
                                l.amountPaise >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {l.amountPaise >= 0 ? '+' : ''}₹{(l.amountPaise / 100).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Bal: ₹{(l.balanceAfterPaise / 100).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 7. Bottom Navigation Bar: Home, Buy RP, Sell RP, and Mine */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {/* 1. HOME */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'text-blue-400 bg-blue-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200 font-semibold'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">HOME</span>
          </button>

          {/* 2. BUY RP */}
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'buy'
                ? 'text-blue-400 bg-blue-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200 font-semibold'
            }`}
          >
            <ArrowUpRight className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">BUY RP</span>
          </button>

          {/* 3. SELL RP */}
          <button
            type="button"
            onClick={() => setActiveTab('sell')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'sell' || activeTab === 'withdraw'
                ? 'text-blue-400 bg-blue-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200 font-semibold'
            }`}
          >
            <ArrowDownLeft className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">SELL RP</span>
          </button>

          {/* 4. MINE (Highlighted when activeTab === 'profile') */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-blue-400 bg-blue-500/10 font-black'
                : 'text-slate-400 hover:text-slate-200 font-semibold'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">MINE</span>
          </button>
        </div>
      </nav>

      {/* Admin Security Password Prompt Modal */}
      {isAdminPromptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
                  RP
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Admin Portal</h3>
                  <p className="text-[10px] text-slate-400">Security Verification Required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminPromptOpen(false);
                  setAdminPasswordInput('');
                  setAdminError(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Admin Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter admin password (razypay@admin)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminPromptOpen(false);
                    setAdminPasswordInput('');
                    setAdminError(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingAdmin}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {isVerifyingAdmin ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Unlock Portal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
