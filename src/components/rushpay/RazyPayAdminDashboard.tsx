import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Settings,
  Bell,
  BarChart3,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Plus,
  Send,
  Eye,
  Lock,
  Unlock,
  CreditCard,
  Building,
  HelpCircle,
  MessageSquare,
  Activity,
  X,
  Sliders,
  DollarSign,
  Layers,
  ArrowRight,
  Check,
  Copy,
  Download,
  AlertCircle
} from 'lucide-react';
import { rushApi } from '../../utils/rushApi';
import { api } from '../../utils/api';
import {
  UserProfile,
  WalletBalances,
  BuyOrder,
  SellWithdrawRequest,
  RushPayPlatformConfig,
  ExchangeRateConfig,
  AdminDashboardOverviewData,
  AdminAuditLog,
  AdminAccount,
  NotificationRecord,
  SupportTicket
} from '../../types/rushpay';

interface RazyPayAdminDashboardProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

type AdminTab =
  | 'overview'
  | 'users'
  | 'buy_rp'
  | 'sell_rp'
  | 'wallets'
  | 'payments'
  | 'settings'
  | 'notifications'
  | 'reports'
  | 'staff'
  | 'tickets'
  | 'logs';

export function RazyPayAdminDashboard({ onClose, onRefreshData }: RazyPayAdminDashboardProps) {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`${label} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Live Token
  const adminToken = useMemo(() => {
    return api.getAdminToken() || 'razypay_admin_master_token';
  }, []);

  // Primary Data Stores
  const [overviewData, setOverviewData] = useState<AdminDashboardOverviewData | null>(null);
  const [usersList, setUsersList] = useState<{ profile: UserProfile; wallet: WalletBalances; recentOrdersCount: number; recentWithdrawalsCount: number }[]>([]);
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);
  const [sellOrders, setSellOrders] = useState<SellWithdrawRequest[]>([]);
  const [platformConfig, setPlatformConfig] = useState<RushPayPlatformConfig | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateConfig | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<AdminAccount[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Chart Timeframe Selection
  const [chartTimeframe, setChartTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Search & Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'blocked'>('all');
  const [buyOrderSearch, setBuyOrderSearch] = useState('');
  const [buyOrderStatusFilter, setBuyOrderStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');
  const [sellOrderSearch, setSellOrderSearch] = useState('');
  const [sellOrderStatusFilter, setSellOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all');
  const [logFilterCategory, setLogFilterCategory] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');

  // Modals & Action States
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<{ profile: UserProfile; wallet: WalletBalances } | null>(null);
  const [adjustWalletModal, setAdjustWalletModal] = useState<{ userId: string; userName: string; currentPaise: number } | null>(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState<string>('');
  const [walletAdjustDirection, setWalletAdjustDirection] = useState<'add' | 'deduct'>('add');
  const [walletAdjustReason, setWalletAdjustReason] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Buy Order Details Modal (Screenshot Preview)
  const [selectedOrderProof, setSelectedOrderProof] = useState<BuyOrder | null>(null);
  const [customApprovalUtr, setCustomApprovalUtr] = useState<string>('');

  // Ticket Reply Modal
  const [activeTicketForReply, setActiveTicketForReply] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // New Notification Modal
  const [isNewNotifModalOpen, setIsNewNotifModalOpen] = useState(false);
  const [notifTargetType, setNotifTargetType] = useState<'all' | 'user'>('all');
  const [notifTargetUserId, setNotifTargetUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'announcement' | 'transaction' | 'payment' | 'security'>('announcement');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // New Admin Staff Modal
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'superadmin' | 'manager' | 'support'>('manager');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  // UTR Checker tool in Payments Tab
  const [verifyUtrInput, setVerifyUtrInput] = useState('');
  const [utrVerifyResult, setUtrVerifyResult] = useState<{ isValidFormat: boolean; isDuplicate: boolean; message: string; matchedOrderId?: string } | null>(null);
  const [isCheckingUtr, setIsCheckingUtr] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<RushPayPlatformConfig>>({});
  const [ratesForm, setRatesForm] = useState<Partial<ExchangeRateConfig>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Primary Fetch Function
  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Dashboard Overview
      const dashRes = await rushApi.getAdminDashboard(adminToken).catch(() => null);
      if (dashRes?.data) setOverviewData(dashRes.data);

      // 2. Users
      const usersRes = await rushApi.getAllUsers(adminToken).catch(() => null);
      if (usersRes?.users) setUsersList(usersRes.users);

      // 3. Buy Orders
      const buyRes = await rushApi.getAllBuyOrders(adminToken).catch(() => null);
      if (buyRes?.orders) setBuyOrders(buyRes.orders);

      // 4. Sell Orders
      const sellRes = await rushApi.getAllSellOrders(adminToken).catch(() => null);
      if (sellRes?.withdrawals) setSellOrders(sellRes.withdrawals);

      // 5. Website Settings & Rates
      const settingsRes = await rushApi.getWebsiteSettings(adminToken).catch(() => null);
      if (settingsRes?.config) {
        setPlatformConfig(settingsRes.config);
        setSettingsForm(settingsRes.config);
      }
      if (settingsRes?.rates) {
        setExchangeRates(settingsRes.rates);
        setRatesForm(settingsRes.rates);
      }

      // 6. Notifications
      const notifRes = await rushApi.getNotifications(adminToken).catch(() => null);
      if (notifRes?.notifications) setNotifications(notifRes.notifications);

      // 7. Staff
      const staffRes = await rushApi.getStaff(adminToken).catch(() => null);
      if (staffRes?.staff) setStaffAccounts(staffRes.staff);

      // 8. Support Tickets
      const ticketsRes = await rushApi.getSupportTickets(adminToken).catch(() => null);
      if (ticketsRes?.tickets) setSupportTickets(ticketsRes.tickets);

      // 9. Audit Logs
      const logsRes = await rushApi.getAuditLogs(adminToken).catch(() => null);
      if (logsRes?.logs) setAuditLogs(logsRes.logs);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      showToast('Some admin modules failed to load. Retrying...', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- ACTIONS ---

  // 1. User Status Toggle
  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'blocked') => {
    try {
      await rushApi.updateUserStatus(adminToken, userId, newStatus, `Admin marked status as ${newStatus}`);
      showToast(`User status updated to ${newStatus}`);
      fetchAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  // 2. Wallet Freeze / Unfreeze
  const handleToggleFreezeWallet = async (userId: string, currentlySuspended: boolean) => {
    try {
      await rushApi.freezeWallet(adminToken, userId, !currentlySuspended, currentlySuspended ? 'Admin unfreezed wallet' : 'Admin froze wallet');
      showToast(currentlySuspended ? 'Wallet unfreezed successfully' : 'Wallet frozen and secured');
      fetchAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle wallet lock', 'error');
    }
  };

  // 3. Manual Wallet Adjustment
  const handleWalletAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustWalletModal) return;
    const units = parseFloat(walletAdjustAmount);
    if (isNaN(units) || units <= 0) {
      showToast('Please enter a valid positive RP amount', 'error');
      return;
    }
    if (!walletAdjustReason.trim()) {
      showToast('Adjustment reason is required for compliance audit logs', 'error');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const deltaPaise = Math.round(units * 100) * (walletAdjustDirection === 'add' ? 1 : -1);
      await rushApi.adjustUserWallet(adminToken, adjustWalletModal.userId, deltaPaise, walletAdjustReason.trim());
      showToast(`Wallet adjusted: ${walletAdjustDirection === 'add' ? '+' : '-'}${units} RP successfully!`);
      setAdjustWalletModal(null);
      setWalletAdjustAmount('');
      setWalletAdjustReason('');
      fetchAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Wallet adjustment failed', 'error');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // 4. Buy RP Order: Approve
  const handleApproveBuyOrder = async (orderId: string, utr?: string) => {
    try {
      await rushApi.approveBuyOrder(adminToken, orderId, utr);
      showToast(`Order ${orderId} approved! RP balance auto-credited to user wallet.`);
      setSelectedOrderProof(null);
      setCustomApprovalUtr('');
      fetchAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve buy order', 'error');
    }
  };

  // 5. Buy RP Order: Reject
  const handleRejectBuyOrder = async (orderId: string, reason: string = 'Payment verification failed') => {
    try {
      await rushApi.rejectBuyOrder(adminToken, orderId, reason);
      showToast(`Order ${orderId} marked as rejected.`);
      setSelectedOrderProof(null);
      fetchAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject buy order', 'error');
    }
  };

  // 6. Sell RP Order: Process / Complete / Reject
  const handleProcessSellOrder = async (withdrawalId: string, status: 'processing' | 'completed' | 'rejected', reason?: string) => {
    try {
      await rushApi.processSellOrder(adminToken, withdrawalId, status, reason, `NPCI_TXN_${Date.now()}`);
      showToast(`Sell request ${withdrawalId} status set to: ${status}`);
      fetchAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to process sell request', 'error');
    }
  };

  // 7. Verify UTR Live
  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyUtrInput.trim()) return;
    setIsCheckingUtr(true);
    try {
      const res = await rushApi.verifyUtr(adminToken, verifyUtrInput.trim());
      setUtrVerifyResult(res);
    } catch (err: any) {
      showToast(err.message || 'UTR verification failed', 'error');
    } finally {
      setIsCheckingUtr(false);
    }
  };

  // 8. Save Website & Rate Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await rushApi.updateWebsiteSettings(adminToken, {
        config: settingsForm,
        rates: ratesForm
      });
      showToast('Platform settings & RP exchange rates saved successfully!');
      fetchAllData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 9. Send Notification
  const handleSendNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    setIsSendingNotif(true);
    try {
      await rushApi.sendNotification(adminToken, {
        targetType: notifTargetType,
        targetUserId: notifTargetType === 'user' ? notifTargetUserId : undefined,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType
      });
      showToast('Notification published successfully!');
      setIsNewNotifModalOpen(false);
      setNotifTitle('');
      setNotifMessage('');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to broadcast notification', 'error');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // 10. Create Staff Account
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUsername.trim() || !newStaffFullName.trim() || !newStaffEmail.trim()) {
      showToast('All fields are required', 'error');
      return;
    }
    setIsCreatingStaff(true);
    try {
      await rushApi.createStaff(adminToken, {
        username: newStaffUsername.trim(),
        fullName: newStaffFullName.trim(),
        email: newStaffEmail.trim(),
        role: newStaffRole
      });
      showToast(`Admin staff "${newStaffUsername}" created successfully!`);
      setIsNewStaffModalOpen(false);
      setNewStaffUsername('');
      setNewStaffFullName('');
      setNewStaffEmail('');
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create staff account', 'error');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  // 11. Staff Status Toggle
  const handleToggleStaffStatus = async (staffId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await rushApi.updateStaffStatus(adminToken, staffId, nextStatus as any);
      showToast(`Staff account ${nextStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update staff status', 'error');
    }
  };

  // 12. Support Ticket: Reply
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketForReply || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      await rushApi.replyTicket(adminToken, activeTicketForReply.id, replyMessage.trim());
      showToast('Reply dispatched to user successfully!');
      setReplyMessage('');
      setActiveTicketForReply(null);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // 13. Support Ticket: Status Toggle
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await rushApi.updateTicketStatus(adminToken, ticketId, newStatus);
      showToast(`Ticket status updated to ${newStatus}`);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update ticket status', 'error');
    }
  };

  // --- CSV EXPORT HELPERS ---
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded ${filename}`, 'success');
  };

  const exportUsersCSV = () => {
    const headers = ['User ID', 'Full Name', 'Mobile', 'Email', 'Account Status', 'KYC Status', 'Available RP', 'Total Deposited INR', 'Total Withdrawn INR', 'Created At'];
    const rows = usersList.map((u) => [
      u.profile.id,
      `"${u.profile.fullName}"`,
      u.profile.mobile,
      u.profile.email,
      u.profile.accountStatus,
      u.profile.kycStatus,
      (u.wallet.availablePaise / 100).toFixed(2),
      (u.wallet.totalDepositedPaise / 100).toFixed(2),
      (u.wallet.totalWithdrawnPaise / 100).toFixed(2),
      u.profile.createdAt
    ]);
    downloadCSV(`razypay-users-${new Date().toISOString().slice(0, 10)}.csv`, [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'));
  };

  const exportBuyOrdersCSV = () => {
    const headers = ['Order ID', 'User ID', 'User Name', 'RP Units', 'Amount INR', 'Payment Mode', 'UTR Number', 'Status', 'Created At'];
    const rows = buyOrders.map((o) => [
      o.id,
      o.userId,
      `"${o.userName || 'N/A'}"`,
      o.payUnits ?? o.unitsEstimated ?? Math.round(o.inrAmountPaise / 100),
      (o.inrAmountPaise / 100).toFixed(2),
      o.paymentMethod,
      o.utrNumber || o.paymentReference || 'N/A',
      o.status,
      o.createdAt
    ]);
    downloadCSV(`razypay-buy-orders-${new Date().toISOString().slice(0, 10)}.csv`, [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'));
  };

  const exportPayoutsCSV = () => {
    const headers = ['Payout ID', 'User ID', 'User Name', 'RP Units', 'Payout INR', 'Target UPI', 'Bank Account', 'Status', 'Created At'];
    const rows = sellOrders.map((w) => {
      const upi = w.destinationUpiId || w.destinationAccount?.upiId || 'N/A';
      const acct = w.bankAccountNumber || w.destinationAccount?.accountNumber;
      const ifsc = w.bankIfsc || w.destinationAccount?.ifscCode || '';
      return [
        w.id,
        w.userId,
        `"${w.userName || 'N/A'}"`,
        w.payUnits ?? w.unitsToSell ?? 0,
        ((w.payoutPaise ?? w.netAmountPaise ?? 0) / 100).toFixed(2),
        upi,
        acct ? `"${acct} (${ifsc})"` : 'N/A',
        w.status,
        w.createdAt
      ];
    });
    downloadCSV(`razypay-payouts-${new Date().toISOString().slice(0, 10)}.csv`, [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'));
  };

  // --- FILTERED DATA SETS ---
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = userSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.profile.fullName.toLowerCase().includes(q) ||
        u.profile.email.toLowerCase().includes(q) ||
        u.profile.mobile.includes(q) ||
        u.profile.id.toLowerCase().includes(q);

      const matchStatus = userStatusFilter === 'all' || u.profile.accountStatus === userStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [usersList, userSearchQuery, userStatusFilter]);

  const filteredBuyOrders = useMemo(() => {
    return buyOrders.filter((o) => {
      const q = buyOrderSearch.toLowerCase().trim();
      const utr = o.utrNumber || o.paymentReference || '';
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.userName && o.userName.toLowerCase().includes(q)) ||
        o.userId.toLowerCase().includes(q) ||
        utr.toLowerCase().includes(q);

      const matchStatus = buyOrderStatusFilter === 'all'
        ? true
        : buyOrderStatusFilter === 'pending'
        ? (o.status === 'pending' || o.status === 'under_review')
        : o.status === buyOrderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [buyOrders, buyOrderSearch, buyOrderStatusFilter]);

  const filteredSellOrders = useMemo(() => {
    return sellOrders.filter((w) => {
      const q = sellOrderSearch.toLowerCase().trim();
      const dest = w.destinationUpiId || w.destinationAccount?.upiId || w.bankAccountNumber || w.destinationAccount?.accountNumber || '';
      const matchSearch =
        !q ||
        w.id.toLowerCase().includes(q) ||
        (w.userName && w.userName.toLowerCase().includes(q)) ||
        w.userId.toLowerCase().includes(q) ||
        dest.toLowerCase().includes(q);

      const matchStatus = sellOrderStatusFilter === 'all' || w.status === sellOrderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [sellOrders, sellOrderSearch, sellOrderStatusFilter]);


  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = logSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.adminName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.targetName && log.targetName.toLowerCase().includes(q));

      const matchCat = logFilterCategory === 'all' || log.category === logFilterCategory;
      return matchSearch && matchCat;
    });
  }, [auditLogs, logSearch, logFilterCategory]);

  return (
    <div className="fixed inset-0 z-50 flex bg-[#030712] text-slate-100 font-sans overflow-hidden">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-md animate-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 border-blue-500/50 text-blue-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <p className="text-sm font-medium">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* =====================================================================
          1. FIXED SIDEBAR NAVIGATION (Desktop & Drawer Mobile)
         ===================================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 md:w-72 bg-[#080d1a]/95 backdrop-blur-2xl border-r border-blue-500/20 flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-blue-500/15 bg-gradient-to-r from-blue-950/40 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-wider text-white">RAZY PAY</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight">V3.0 Financial Engine</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-blue-900/50">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">Core Monitoring</div>
          <button
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('users');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0" />
              <span>User Management</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {usersList.length}
            </span>
          </button>

          <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">Order Flow</div>
          <button
            onClick={() => {
              setActiveTab('buy_rp');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'buy_rp'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Buy RP Requests</span>
            </div>
            {buyOrders.filter((o) => o.status === 'pending').length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-black">
                {buyOrders.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('sell_rp');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'sell_rp'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Sell RP & Payouts</span>
            </div>
            {sellOrders.filter((w) => w.status === 'pending' || w.status === 'processing').length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">
                {sellOrders.filter((w) => w.status === 'pending' || w.status === 'processing').length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('wallets');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'wallets'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Wallet Management</span>
          </button>

          <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">Rails & Config</div>
          <button
            onClick={() => {
              setActiveTab('payments');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Payment Rail & UPI</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Website Settings</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('notifications');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reports');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Reports & Analytics</span>
          </button>

          <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">Administration</div>
          <button
            onClick={() => {
              setActiveTab('staff');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'staff'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Admin Staff & RBAC</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tickets');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'tickets'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Support Complaints</span>
            </div>
            {supportTickets.filter((t) => t.status === 'open').length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-400 text-black">
                {supportTickets.filter((t) => t.status === 'open').length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Audit Activity Logs</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-blue-500/15 bg-[#060a14]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">NPCI Instant Rail</p>
                <p className="text-[10px] font-mono text-emerald-400">razypy@ptyes</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard('razypy@ptyes', 'UPI VPA')}
              title="Copy VPA"
              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          2. MAIN CONTENT AREA WITH FIXED TOP NAVIGATION BAR
         ===================================================================== */}
      <div className="flex-1 flex flex-col md:ml-72 bg-[#030712] min-w-0 h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-18 px-4 sm:px-6 border-b border-blue-500/15 bg-[#080d1a]/80 backdrop-blur-xl flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white"
            >
              <Sliders className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white capitalize flex items-center gap-2">
                {activeTab.replace('_', ' ')}
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="hidden sm:inline-block text-xs font-normal text-slate-400">
                  Razy Pay Autonomous Operations
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live IST Clock */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs font-mono text-blue-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentTime} IST</span>
            </div>

            {/* Manual Sync / Refresh Button */}
            <button
              onClick={fetchAllData}
              disabled={isRefreshing}
              title="Refresh All Database Records"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Admin Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 text-xs text-blue-200">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-semibold hidden sm:inline">razypay@admin</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                SuperAdmin
              </span>
            </div>

            {/* Exit Portal / Close Button */}
            <button
              onClick={onClose}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close Portal</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* =================================================================
              TAB 1: DASHBOARD OVERVIEW (ALL 10 METRICS + INTERACTIVE CHARTS)
             ================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Title with Quick Export */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    Platform Financial Overview
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Live Production
                    </span>
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Real-time consolidated statistics, high-velocity RP token metrics, and NPCI clearance states.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportUsersCSV}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Export Users CSV</span>
                  </button>
                  <button
                    onClick={exportBuyOrdersCSV}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Orders CSV</span>
                  </button>
                </div>
              </div>

              {/* 10 Key Operational KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* 1. Total Registered Users */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-blue-500/20 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Users</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                      {overviewData ? overviewData.totalRegisteredUsers : usersList.length}
                    </div>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      <span>100% Verified DB</span>
                    </p>
                  </div>
                </div>

                {/* 2. Total Active Users */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-emerald-500/20 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Active Users</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                      {overviewData
                        ? overviewData.totalActiveUsers
                        : usersList.filter((u) => u.profile.accountStatus === 'active').length}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Operational Accounts
                    </p>
                  </div>
                </div>

                {/* 3. Total Wallet Balance */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-indigo-500/20 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total User Wallets</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-indigo-300 font-mono tracking-tight">
                      ₹
                      {overviewData
                        ? (overviewData.totalWalletBalancePaise / 100).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })
                        : '0.00'}
                    </div>
                    <p className="text-[11px] text-indigo-400/80 mt-1 font-mono">
                      {overviewData ? (overviewData.totalWalletBalancePaise / 100).toFixed(0) : 0} RP Backed
                    </p>
                  </div>
                </div>

                {/* 4. Total RP Sold */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-cyan-500/20 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total RP Sold</span>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-cyan-300 font-mono tracking-tight">
                      {overviewData ? overviewData.totalRpSoldUnits.toLocaleString() : '0'} RP
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">Deposits Fulfilled</p>
                  </div>
                </div>

                {/* 5. Total RP Purchased */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-purple-500/20 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total RP Purchased</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">
                      {overviewData ? overviewData.totalRpPurchasedUnits.toLocaleString() : '0'} RP
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">Payouts Completed</p>
                  </div>
                </div>

                {/* 6. Total Transactions */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-slate-700/50 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Transactions</span>
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                      {overviewData ? overviewData.totalTransactions : 0}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Immutable Ledger Count</p>
                  </div>
                </div>

                {/* 7. Pending Transactions */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-amber-500/30 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Pending Actions</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                      {overviewData ? overviewData.pendingTransactions : 0}
                    </div>
                    <p className="text-[11px] text-amber-300/80 mt-1 font-medium">Requires Admin Review</p>
                  </div>
                </div>

                {/* 8. Today's Revenue */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-emerald-500/30 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Today’s Revenue</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                      ₹
                      {overviewData
                        ? (overviewData.todayRevenuePaise / 100).toLocaleString('en-IN', {
                            minimumFractionDigits: 2
                          })
                        : '0.00'}
                    </div>
                    <p className="text-[11px] text-emerald-400/80 mt-1 font-medium">Gross Cash Inflow</p>
                  </div>
                </div>

                {/* 9. Total Profit */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-blue-500/30 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Net Platform Profit</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-blue-400 font-mono tracking-tight">
                      ₹
                      {overviewData
                        ? (overviewData.totalProfitPaise / 100).toLocaleString('en-IN', {
                            minimumFractionDigits: 2
                          })
                        : '0.00'}
                    </div>
                    <p className="text-[11px] text-blue-400/80 mt-1 font-medium">From Spread & Commission</p>
                  </div>
                </div>

                {/* 10. Suspended Accounts */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 border border-rose-500/30 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Suspended / Frozen</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <UserX className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                      {overviewData ? overviewData.suspendedAccounts : 0}
                    </div>
                    <p className="text-[11px] text-rose-300/80 mt-1 font-medium">Compliance Restrained</p>
                  </div>
                </div>
              </div>

              {/* Interactive Charts Section (Daily, Weekly, Monthly) */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b1120]/95 to-[#080d1a]/95 border border-blue-500/20 shadow-2xl backdrop-blur-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      Transaction Volume & Revenue Dynamics
                    </h3>
                    <p className="text-xs text-slate-400">
                      Multi-tier velocity breakdown comparing gross revenue (INR) and RP token exchange flows.
                    </p>
                  </div>

                  {/* Timeframe Toggle Buttons */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
                    <button
                      onClick={() => setChartTimeframe('daily')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chartTimeframe === 'daily'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Daily (7 Days)
                    </button>
                    <button
                      onClick={() => setChartTimeframe('weekly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chartTimeframe === 'weekly'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Weekly (4 Wks)
                    </button>
                    <button
                      onClick={() => setChartTimeframe('monthly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        chartTimeframe === 'monthly'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Monthly (6 Mos)
                    </button>
                  </div>
                </div>

                {/* SVG Visual Chart */}
                <div className="pt-6">
                  {overviewData && overviewData.charts ? (
                    <div>
                      {/* Bar Visualization */}
                      <div className="grid grid-cols-7 sm:grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6 pb-2 px-2">
                        {overviewData.charts[chartTimeframe].map((pt, idx) => {
                          const maxRev = Math.max(
                            ...overviewData.charts[chartTimeframe].map((p) => p.revenueInr),
                            1
                          );
                          const heightPct = Math.max(12, Math.round((pt.revenueInr / maxRev) * 100));

                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-28 bg-slate-900 border border-blue-500/40 rounded-xl px-2.5 py-1.5 text-[11px] shadow-2xl pointer-events-none z-10 font-mono text-center">
                                <p className="text-white font-bold">₹{pt.revenueInr.toLocaleString()}</p>
                                <p className="text-cyan-400">{pt.buyVolumeRp} RP Buy</p>
                                <p className="text-indigo-400">{pt.sellVolumeRp} RP Sold</p>
                              </div>

                              {/* Bar Pillar */}
                              <div className="w-full max-w-[48px] bg-slate-800/60 rounded-t-xl overflow-hidden flex flex-col justify-end p-0.5 group-hover:bg-slate-700/60 transition-colors">
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400 shadow-lg shadow-blue-500/20 group-hover:brightness-125 transition-all"
                                />
                              </div>

                              {/* Axis Label */}
                              <span className="text-[11px] font-medium text-slate-400 text-center truncate max-w-full">
                                {pt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-600 to-cyan-400" />
                            <span>Revenue Volume (INR)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-cyan-400" />
                            <span>RP Bought Flow</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-indigo-500" />
                            <span>RP Redeemed Flow</span>
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Auto-calibrated from active financial ledger
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-slate-500 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
                      Loading transactional chart data...
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions & Recent Pending Triggers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Buy Orders awaiting approval */}
                <div className="p-5 rounded-3xl bg-[#090e1c] border border-blue-500/20">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      Recent Buy RP Requests ({buyOrders.filter((o) => o.status === 'pending').length} Pending)
                    </h4>
                    <button
                      onClick={() => setActiveTab('buy_rp')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 divide-y divide-slate-800/60">
                    {buyOrders.slice(0, 4).map((order) => (
                      <div key={order.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{order.id}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                order.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : order.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {order.userName || order.userId} • UTR: {order.utrNumber || order.paymentReference || 'Awaiting'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-emerald-400">
                            +{order.payUnits ?? order.unitsEstimated ?? Math.round(order.inrAmountPaise / 100)} RP (₹{(order.inrAmountPaise / 100).toFixed(2)})
                          </p>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => setSelectedOrderProof(order)}
                              className="mt-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px]"
                            >
                              Review & Credit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Payout Requests awaiting execution */}
                <div className="p-5 rounded-3xl bg-[#090e1c] border border-blue-500/20">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-blue-400" />
                      Recent Sell / Payout Requests ({sellOrders.filter((w) => w.status === 'pending').length} Pending)
                    </h4>
                    <button
                      onClick={() => setActiveTab('sell_rp')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 divide-y divide-slate-800/60">
                    {sellOrders.slice(0, 4).map((w) => (
                      <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{w.id}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                w.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : w.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : w.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {w.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {w.userName} • {w.destinationUpiId || w.destinationAccount?.upiId || w.bankAccountNumber || w.destinationAccount?.accountNumber || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-indigo-300">
                            {w.payUnits ?? w.unitsToSell ?? 0} RP → ₹{((w.payoutPaise ?? w.netAmountPaise ?? 0) / 100).toFixed(2)}
                          </p>
                          {w.status === 'pending' && (
                            <button
                              onClick={() => handleProcessSellOrder(w.id, 'completed')}
                              className="mt-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px]"
                            >
                              Approve Payout
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: USER MANAGEMENT (SEARCH, STATUS, FREEZE, ADJUST WALLET)
             ================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">User Management</h2>
                  <p className="text-xs text-slate-400">
                    Audit profiles, freeze balances, modify KYC states, or manually adjust RP tokens with required reason logs.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportUsersCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Filters & Search Controls */}
              <div className="p-4 rounded-2xl bg-[#090e1c] border border-blue-500/20 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by Name, Email, Mobile or User ID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Status:</span>
                  <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    {(['all', 'active', 'suspended', 'blocked'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setUserStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                          userStatusFilter === st
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Users Data Table */}
              <div className="rounded-2xl bg-[#090e1c] border border-blue-500/20 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e162b] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">User Details</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4">Wallet Balance</th>
                        <th className="py-3 px-4">KYC State</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No users found matching query.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isFrozen = u.profile.accountStatus === 'suspended';
                          return (
                            <tr key={u.profile.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-white text-sm">{u.profile.fullName}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {u.profile.mobile} • {u.profile.email}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{u.profile.id}</div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    u.profile.accountStatus === 'active'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : u.profile.accountStatus === 'suspended'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {u.profile.accountStatus === 'active' ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  {u.profile.accountStatus.toUpperCase()}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-white text-sm">
                                  ₹{(u.wallet.availablePaise / 100).toFixed(2)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Dep: ₹{(u.wallet.totalDepositedPaise / 100).toFixed(0)} • W/D: ₹
                                  {(u.wallet.totalWithdrawnPaise / 100).toFixed(0)}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {u.profile.kycStatus.toUpperCase()}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                                {new Date(u.profile.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View Profile */}
                                  <button
                                    onClick={() => setSelectedUserForDetail(u)}
                                    title="View Full Profile"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Adjust Balance */}
                                  <button
                                    onClick={() =>
                                      setAdjustWalletModal({
                                        userId: u.profile.id,
                                        userName: u.profile.fullName,
                                        currentPaise: u.wallet.availablePaise
                                      })
                                    }
                                    title="Manually Adjust RP Wallet"
                                    className="p-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/30"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Freeze / Unfreeze Account */}
                                  <button
                                    onClick={() => handleToggleFreezeWallet(u.profile.id, isFrozen)}
                                    title={isFrozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
                                    className={`p-1.5 rounded-lg border ${
                                      isFrozen
                                        ? 'bg-amber-600/30 border-amber-500/40 text-amber-300 hover:bg-amber-600/50'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400'
                                    }`}
                                  >
                                    {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: BUY RP MANAGEMENT (APPROVE, AUTO-CREDIT, REJECT)
             ================================================================= */}
          {activeTab === 'buy_rp' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Buy RP Orders</h2>
                  <p className="text-xs text-slate-400">
                    Review user deposits, inspect payment proofs & UTR numbers, and trigger atomic wallet balance credits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportBuyOrdersCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Orders CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 rounded-2xl bg-[#090e1c] border border-blue-500/20 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buyOrderSearch}
                    onChange={(e) => setBuyOrderSearch(e.target.value)}
                    placeholder="Search by Order ID, User, or UTR..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Filter:</span>
                  <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setBuyOrderStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                          buyOrderStatusFilter === st
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Buy Orders Table */}
              <div className="rounded-2xl bg-[#090e1c] border border-blue-500/20 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e162b] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Order ID & Date</th>
                        <th className="py-3 px-4">User Details</th>
                        <th className="py-3 px-4">RP & INR Amount</th>
                        <th className="py-3 px-4">Payment UTR / Ref</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Verification Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredBuyOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No Buy RP orders found.
                          </td>
                        </tr>
                      ) : (
                        filteredBuyOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-white text-sm">{order.id}</span>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {new Date(order.createdAt).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-200">{order.userName || 'Customer'}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{order.userId}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-emerald-400 text-sm">
                                +{order.payUnits ?? order.unitsEstimated ?? Math.round(order.inrAmountPaise / 100)} RP
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ₹{(order.inrAmountPaise / 100).toFixed(2)} via {order.paymentMethod}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              {(order.utrNumber || order.paymentReference) ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-bold">
                                    {order.utrNumber || order.paymentReference}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(order.utrNumber || order.paymentReference!, 'UTR')}
                                    className="text-slate-500 hover:text-slate-300"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Not submitted</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  order.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : order.status === 'under_review' || order.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {order.status === 'approved' ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : order.status === 'under_review' || order.status === 'pending' ? (
                                  <Clock className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {order.status === 'under_review' ? 'UNDER REVIEW' : order.status.toUpperCase()}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedOrderProof(order)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3 text-blue-400" />
                                  <span>Details</span>
                                </button>

                                {(order.status === 'pending' || order.status === 'under_review') && (
                                  <>
                                    <button
                                      onClick={() => handleApproveBuyOrder(order.id, order.utrNumber || order.paymentReference)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectBuyOrder(order.id, 'UTR verification failed')}
                                      className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: SELL RP MANAGEMENT (PAYOUT DISPATCH & APPROVALS)
             ================================================================= */}
          {activeTab === 'sell_rp' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Sell RP & Payouts</h2>
                  <p className="text-xs text-slate-400">
                    Process user payout requests via IMPS/NEFT bank settlement or verified UPI routing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportPayoutsCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Payouts CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 rounded-2xl bg-[#090e1c] border border-blue-500/20 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sellOrderSearch}
                    onChange={(e) => setSellOrderSearch(e.target.value)}
                    placeholder="Search by Payout ID, User, or Bank/UPI..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Status:</span>
                  <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSellOrderStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                          sellOrderStatusFilter === st
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sell Orders Table */}
              <div className="rounded-2xl bg-[#090e1c] border border-blue-500/20 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e162b] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Payout ID & Date</th>
                        <th className="py-3 px-4">User Details</th>
                        <th className="py-3 px-4">RP & Payout Amount</th>
                        <th className="py-3 px-4">Disbursement Destination</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredSellOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No Sell RP requests found.
                          </td>
                        </tr>
                      ) : (
                        filteredSellOrders.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-white text-sm">{w.id}</span>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {new Date(w.createdAt).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-200">{w.userName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{w.userMobile}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-sm">{w.payUnits ?? w.unitsToSell ?? 0} RP</div>
                              <div className="text-[11px] text-emerald-400 font-mono font-bold">
                                ₹{(((w.payoutPaise ?? w.netAmountPaise ?? 0)) / 100).toFixed(2)} Net Payout
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {(w.payoutType === 'upi' || w.destinationUpiId || w.destinationAccount?.upiId) ? (
                                <div>
                                  <span className="font-bold text-cyan-300">UPI: {w.destinationUpiId || w.destinationAccount?.upiId}</span>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-200">A/C: {w.bankAccountNumber || w.destinationAccount?.accountNumber}</span>
                                  <div className="text-slate-400">
                                    IFSC: {w.bankIfsc || w.destinationAccount?.ifscCode} ({w.bankAccountName || w.destinationAccount?.accountHolderName})
                                  </div>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  w.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : w.status === 'processing'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : w.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {w.status === 'completed' ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                {w.status.toUpperCase()}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {w.status === 'pending' && (
                                  <button
                                    onClick={() => handleProcessSellOrder(w.id, 'processing')}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs"
                                  >
                                    Queue Dispatch
                                  </button>
                                )}

                                {(w.status === 'pending' || w.status === 'processing') && (
                                  <>
                                    <button
                                      onClick={() => handleProcessSellOrder(w.id, 'completed')}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Disburse</span>
                                    </button>
                                    <button
                                      onClick={() => handleProcessSellOrder(w.id, 'rejected', 'Bank account invalid')}
                                      className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 5: WALLET MANAGEMENT (BREAKDOWNS, AUTHORIZATIONS, AUDIT LOGS)
             ================================================================= */}
          {activeTab === 'wallets' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Wallet Management</h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive multi-ledger balances (Available, In-Review, Escrow, Deposited, Withdrawn) with strict admin authorization.
                  </p>
                </div>
              </div>

              {/* Wallets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersList.map((u) => {
                  const isSuspended = u.profile.accountStatus === 'suspended';
                  return (
                    <div
                      key={u.profile.id}
                      className="p-5 rounded-3xl bg-gradient-to-b from-[#0e162b] to-[#0a1020] border border-blue-500/20 shadow-xl relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">{u.profile.fullName}</h4>
                          <p className="text-xs text-slate-400 font-mono">{u.profile.mobile}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuspended ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {isSuspended ? 'FROZEN' : 'ACTIVE'}
                        </span>
                      </div>

                      {/* Balances Grid */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Available RP</span>
                          <span className="text-emerald-400 font-bold text-base">
                            {(u.wallet.availablePaise / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block">In Review</span>
                          <span className="text-amber-400 font-bold text-base">
                            {(u.wallet.inReviewPaise / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Total Inflow</span>
                          <span className="text-slate-300 font-semibold">
                            ₹{(u.wallet.totalDepositedPaise / 100).toFixed(0)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase block">Total Outflow</span>
                          <span className="text-slate-300 font-semibold">
                            ₹{(u.wallet.totalWithdrawnPaise / 100).toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() =>
                            setAdjustWalletModal({
                              userId: u.profile.id,
                              userName: u.profile.fullName,
                              currentPaise: u.wallet.availablePaise
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Adjust Balance</span>
                        </button>

                        <button
                          onClick={() => handleToggleFreezeWallet(u.profile.id, isSuspended)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
                            isSuspended
                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{isSuspended ? 'Unfreeze' : 'Freeze'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 6: PAYMENT MANAGEMENT (UPI CONFIG, UTR VALIDATION TOOL)
             ================================================================= */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Payment Rails & UPI Configuration</h2>
                <p className="text-xs text-slate-400">
                  Configure official merchant VPA handles, monitor automated payment verifications, and prevent replay attacks.
                </p>
              </div>

              {/* Active Rail Info Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ACTIVE NPCI UPI ENGINE
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Zero Failure Fallback</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-2 font-mono tracking-tight">
                    {platformConfig?.depositUpiId || 'razypy@ptyes'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Merchant Name: <span className="text-slate-200 font-semibold">{platformConfig?.merchantName || 'Razy Pay Global Services'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => copyToClipboard(platformConfig?.depositUpiId || 'razypy@ptyes', 'Merchant UPI ID')}
                    className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Official VPA</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Live UTR Verification & Duplicate Detection Tool */}
                <div className="p-6 rounded-3xl bg-[#090e1c] border border-blue-500/20">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Live UTR & Reference Validator
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Check whether a 12-digit UPI UTR or bank reference is compliant and has not been claimed previously.
                  </p>

                  <form onSubmit={handleVerifyUtr} className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Enter UPI Transaction Reference (UTR):
                      </label>
                      <input
                        type="text"
                        value={verifyUtrInput}
                        onChange={(e) => setVerifyUtrInput(e.target.value)}
                        placeholder="e.g. 502918239012"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCheckingUtr || !verifyUtrInput.trim()}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs transition-all disabled:opacity-50"
                    >
                      {isCheckingUtr ? 'Verifying with Database...' : 'Validate UTR Invariant'}
                    </button>
                  </form>

                  {utrVerifyResult && (
                    <div
                      className={`mt-4 p-4 rounded-xl border text-xs ${
                        utrVerifyResult.isDuplicate
                          ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                          : utrVerifyResult.isValidFormat
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                          : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {utrVerifyResult.isDuplicate ? (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        ) : utrVerifyResult.isValidFormat ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span>{utrVerifyResult.message}</span>
                      </div>
                      {utrVerifyResult.matchedOrderId && (
                        <p className="mt-1 font-mono text-[11px] opacity-80">
                          Matched Approved Order: {utrVerifyResult.matchedOrderId}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Gateway Settings Update Form */}
                <div className="p-6 rounded-3xl bg-[#090e1c] border border-blue-500/20">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-400" />
                    UPI Routing Configuration
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Updates will be immediately deployed to live user deposit modals.
                  </p>

                  <form onSubmit={handleSaveSettings} className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Active Settlement UPI ID:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.depositUpiId || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, depositUpiId: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Merchant Display Name:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.merchantName || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, merchantName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Buy Fee %</label>
                        <input
                          type="number"
                          step="0.01"
                          value={settingsForm.defaultBuyFeePercent ?? 0.5}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, defaultBuyFeePercent: parseFloat(e.target.value) })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Sell Fee %</label>
                        <input
                          type="number"
                          step="0.01"
                          value={settingsForm.defaultSellFeePercent ?? 0.75}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, defaultSellFeePercent: parseFloat(e.target.value) })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                    >
                      {isSavingSettings ? 'Deploying to Rails...' : 'Deploy Payment Gateway Settings'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 7: WEBSITE SETTINGS (LOGO, RATES, LIMITS, MAINTENANCE, LEGAL)
             ================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Website & Protocol Settings</h2>
                <p className="text-xs text-slate-400">
                  Global system variables, token exchange pricing, maintenance toggles, and legal compliance contracts.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. General Branding & Maintenance */}
                <div className="p-6 rounded-3xl bg-[#090e1c] border border-blue-500/20 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    Branding & Operational State
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Website Brand Name</label>
                      <input
                        type="text"
                        value={settingsForm.brandName || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Logo URL (Optional)</label>
                      <input
                        type="text"
                        value={settingsForm.logoUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Homepage Banner Slogan</label>
                    <input
                      type="text"
                      value={settingsForm.homepageBanner || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, homepageBanner: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Announcement Bar Text</label>
                    <input
                      type="text"
                      value={settingsForm.announcementBar || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, announcementBar: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  {/* Maintenance Mode Toggle */}
                  <div className="pt-2 flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-white">Maintenance Mode</p>
                      <p className="text-xs text-slate-400">
                        When enabled, customers will see a scheduled maintenance screen. Admin operations remain active.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.isMaintenanceMode)}
                        onChange={(e) => setSettingsForm({ ...settingsForm, isMaintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                </div>

                {/* 2. RP Rates & Trade Limits */}
                <div className="p-6 rounded-3xl bg-[#090e1c] border border-blue-500/20 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Exchange Pricing & Minimum/Maximum Limits
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">RP Buy Rate (INR)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={ratesForm.buyRate ?? 1.0}
                        onChange={(e) => setRatesForm({ ...ratesForm, buyRate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">RP Sell Rate (INR)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={ratesForm.sellRate ?? 0.995}
                        onChange={(e) => setRatesForm({ ...ratesForm, sellRate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-blue-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Min Buy INR</label>
                      <input
                        type="number"
                        value={settingsForm.minDepositInr ?? 100}
                        onChange={(e) => setSettingsForm({ ...settingsForm, minDepositInr: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Max Buy INR</label>
                      <input
                        type="number"
                        value={settingsForm.maxDepositInr ?? 500000}
                        onChange={(e) => setSettingsForm({ ...settingsForm, maxDepositInr: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Min Sell INR</label>
                      <input
                        type="number"
                        value={settingsForm.minWithdrawInr ?? 500}
                        onChange={(e) => setSettingsForm({ ...settingsForm, minWithdrawInr: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Max Sell INR</label>
                      <input
                        type="number"
                        value={settingsForm.maxWithdrawInr ?? 200000}
                        onChange={(e) => setSettingsForm({ ...settingsForm, maxWithdrawInr: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Contact Address & Registered Office
                      </label>
                      <input
                        type="text"
                        value={settingsForm.contactAddress || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactAddress: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Legal Terms & Privacy Policy */}
                <div className="p-6 rounded-3xl bg-[#090e1c] border border-blue-500/20 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    Legal Policies & Compliance Content
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Terms & Conditions</label>
                      <textarea
                        rows={4}
                        value={settingsForm.termsAndConditions || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, termsAndConditions: e.target.value })}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Privacy Policy</label>
                      <textarea
                        rows={4}
                        value={settingsForm.privacyPolicy || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, privacyPolicy: e.target.value })}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit All Settings */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {isSavingSettings ? 'Saving Global Settings...' : 'Save & Publish All Website Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =================================================================
              TAB 8: NOTIFICATIONS (BROADCAST OR DIRECT TO USER)
             ================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Push Notifications & Broadcasts</h2>
                  <p className="text-xs text-slate-400">
                    Publish instant transaction notifications, service updates, security advisories, or targeted user messages.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewNotifModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>Send New Notification</span>
                </button>
              </div>

              {/* Notifications History List */}
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-[#090e1c] rounded-2xl border border-blue-500/20">
                    No notifications sent yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-5 rounded-2xl bg-[#090e1c] border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              notif.type === 'security'
                                ? 'bg-rose-500/20 text-rose-400'
                                : notif.type === 'payment'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : notif.type === 'transaction'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-indigo-500/20 text-indigo-400'
                            }`}
                          >
                            {notif.type}
                          </span>
                          <span className="font-bold text-white text-sm">{notif.title}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                        <div className="text-[11px] text-slate-500 font-mono pt-1">
                          Target: {notif.targetType === 'all' ? 'All Registered Users' : `User ${notif.targetUserId}`} • Dispatched by {notif.createdBy}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(notif.createdAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 9: REPORTS & ANALYTICS (SUMMARY CARDS & CSV EXPORTS)
             ================================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Financial Reports & Data Exports</h2>
                  <p className="text-xs text-slate-400">
                    Export raw financial data tables in CSV format for banking reconciliations and tax reporting.
                  </p>
                </div>
              </div>

              {/* Download Center Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#090e1c] border border-blue-500/20 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm mt-3">Users Ledger</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Complete registry of {usersList.length} user accounts, mobile numbers, KYC status and current balances.
                    </p>
                  </div>
                  <button
                    onClick={exportUsersCSV}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Users CSV
                  </button>
                </div>

                <div className="p-5 rounded-3xl bg-[#090e1c] border border-blue-500/20 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm mt-3">Buy Orders Report</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Full historical deposit records ({buyOrders.length} orders) including approved/rejected UTR numbers.
                    </p>
                  </div>
                  <button
                    onClick={exportBuyOrdersCSV}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Orders CSV
                  </button>
                </div>

                <div className="p-5 rounded-3xl bg-[#090e1c] border border-blue-500/20 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm mt-3">Sell / Payouts Report</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      All withdrawal claims ({sellOrders.length} records) with destination bank accounts and UPI VPA mappings.
                    </p>
                  </div>
                  <button
                    onClick={exportPayoutsCSV}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Payouts CSV
                  </button>
                </div>

                <div className="p-5 rounded-3xl bg-[#090e1c] border border-blue-500/20 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm mt-3">Audit Logs Report</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Immutable tracking of all {auditLogs.length} admin actions, wallet adjustments and setting modifications.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const headers = ['Timestamp', 'Admin', 'Category', 'Action', 'Target ID', 'Target Name', 'Details'];
                      const rows = auditLogs.map((l) => [
                        l.timestamp,
                        l.adminName,
                        l.category,
                        `"${l.action}"`,
                        l.targetId || 'N/A',
                        `"${l.targetName || 'N/A'}"`,
                        `"${l.details.replace(/"/g, '""')}"`
                      ]);
                      downloadCSV(
                        `razypay-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
                        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
                      );
                    }}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Logs CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 10: ADMIN MANAGEMENT & STAFF RBAC
             ================================================================= */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Admin Staff & Role-Based Access (RBAC)</h2>
                  <p className="text-xs text-slate-400">
                    Manage system administrators, grant granular operational privileges, and review individual access levels.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewStaffModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Admin</span>
                </button>
              </div>

              {/* Staff Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {staffAccounts.map((staff) => (
                  <div
                    key={staff.id}
                    className="p-5 rounded-3xl bg-[#090e1c] border border-blue-500/20 shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            staff.role === 'superadmin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : staff.role === 'manager'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {staff.role}
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            staff.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {staff.status.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-base mt-2.5">{staff.fullName}</h4>
                      <p className="text-xs font-mono text-slate-400">@{staff.username}</p>
                      <p className="text-xs text-slate-400 mt-1">{staff.email}</p>

                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Assigned Scopes:</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {staff.permissions.map((p, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      {staff.username !== 'superadmin' && (
                        <button
                          onClick={() => handleToggleStaffStatus(staff.id, staff.status)}
                          className={`w-full py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                            staff.status === 'active'
                              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          {staff.status === 'active' ? 'Suspend Staff Access' : 'Activate Staff Account'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 11: SUPPORT COMPLAINTS & TICKETS
             ================================================================= */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Customer Support & Dispute Desk</h2>
                <p className="text-xs text-slate-400">
                  Real-time ticket messages, deposit investigations, and instant agent messaging.
                </p>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                {supportTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-[#090e1c] rounded-2xl border border-blue-500/20">
                    No active support complaints registered.
                  </div>
                ) : (
                  supportTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-[#090e1c] border border-blue-500/20 flex flex-col space-y-3 hover:border-blue-500/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{t.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              t.status === 'open'
                                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                : t.status === 'in_progress'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-slate-300">{t.userName}</span>
                          <span className="text-xs text-slate-500 font-mono">({t.userMobile})</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleUpdateTicketStatus(t.id, st)}
                              className={`px-2 py-0.5 rounded text-[10px] capitalize font-medium ${
                                t.status === st ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {st.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subject & Messages */}
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{t.subject}</h4>
                        <div className="mt-2 space-y-2 pl-3 border-l-2 border-blue-500/40">
                          {t.messages.map((m, mIdx) => (
                            <div key={mIdx} className="text-xs">
                              <span className="font-bold text-blue-400">
                                {m.sender === 'agent' ? '🛡️ Agent (You)' : `👤 ${m.senderName}`}:
                              </span>{' '}
                              <span className="text-slate-300">{m.message}</span>
                              <span className="text-[10px] text-slate-500 ml-2 font-mono">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reply Button Trigger */}
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => setActiveTicketForReply(t)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Reply</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 12: AUDIT ACTIVITY LOGS (IMMUTABLE FORENSIC RECORDS)
             ================================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Audit & Forensic Activity Logs</h2>
                  <p className="text-xs text-slate-400">
                    Immutable, cryptographically logged administrator operations, wallet credits, order adjustments, and policy updates.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 rounded-2xl bg-[#090e1c] border border-blue-500/20 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs by action, admin or details..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Category:</span>
                  <select
                    value={logFilterCategory}
                    onChange={(e) => setLogFilterCategory(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="wallets">Wallets</option>
                    <option value="users">Users</option>
                    <option value="buy_rp">Buy RP</option>
                    <option value="sell_rp">Sell RP</option>
                    <option value="settings">Settings</option>
                    <option value="notifications">Notifications</option>
                    <option value="staff">Staff RBAC</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="rounded-2xl bg-[#090e1c] border border-blue-500/20 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e162b] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Timestamp (IST)</th>
                        <th className="py-3 px-4">Admin Actor</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Action Summary</th>
                        <th className="py-3 px-4">Target Entity</th>
                        <th className="py-3 px-4">Audit Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                            No audit logs found.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp).toLocaleString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-blue-400">{log.adminName}</span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                                {log.category}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-white font-sans font-medium">{log.action}</td>

                            <td className="py-3 px-4 text-slate-300 font-sans text-xs">
                              {log.targetName || log.targetId || '-'}
                            </td>

                            <td className="py-3 px-4 text-slate-400 font-sans text-[11px] max-w-xs truncate">
                              {log.details}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          MODAL 1: USER DETAILS MODAL
         ===================================================================== */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-[#090e1c] border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedUserForDetail.profile.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedUserForDetail.profile.id}</p>
              </div>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Mobile</span>
                <span className="font-mono font-bold text-white text-sm">{selectedUserForDetail.profile.mobile}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Email</span>
                <span className="font-mono text-white text-xs truncate block">{selectedUserForDetail.profile.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Available Balance</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ₹{(selectedUserForDetail.wallet.availablePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Referral Code</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{selectedUserForDetail.profile.referralCode}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setAdjustWalletModal({
                    userId: selectedUserForDetail.profile.id,
                    userName: selectedUserForDetail.profile.fullName,
                    currentPaise: selectedUserForDetail.wallet.availablePaise
                  });
                  setSelectedUserForDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
              >
                Adjust Wallet
              </button>
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: MANUAL WALLET ADJUSTMENT MODAL (WITH AUDIT COMPLIANCE)
         ===================================================================== */}
      {adjustWalletModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#090e1c] border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  Manual Wallet Adjustment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  User: <span className="text-slate-200 font-bold">{adjustWalletModal.userName}</span>
                </p>
              </div>
              <button
                onClick={() => setAdjustWalletModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWalletAdjustmentSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Current Available RP:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(adjustWalletModal.currentPaise / 100).toFixed(2)} RP
                </span>
              </div>

              {/* Add vs Deduct Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setWalletAdjustDirection('add')}
                  className={`py-2 rounded-lg font-bold transition-colors ${
                    walletAdjustDirection === 'add'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + Add RP (Credit)
                </button>
                <button
                  type="button"
                  onClick={() => setWalletAdjustDirection('deduct')}
                  className={`py-2 rounded-lg font-bold transition-colors ${
                    walletAdjustDirection === 'deduct'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  - Deduct RP (Debit)
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  RP Quantity to {walletAdjustDirection === 'add' ? 'Credit' : 'Deduct'}:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={walletAdjustAmount}
                  onChange={(e) => setWalletAdjustAmount(e.target.value)}
                  placeholder="e.g. 500"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mandatory Audit Adjustment Reason:
                </label>
                <textarea
                  rows={2}
                  value={walletAdjustReason}
                  onChange={(e) => setWalletAdjustReason(e.target.value)}
                  placeholder="e.g. Manual deposit compensation approved by director"
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustWalletModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all ${
                    walletAdjustDirection === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {isSubmittingAdjust ? 'Processing...' : 'Authorize Balance Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: BUY ORDER PROOF & APPROVAL MODAL
         ===================================================================== */}
      {selectedOrderProof && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#090e1c] border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  Buy Order Review & Clearance
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedOrderProof.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrderProof(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">User</span>
                  <span className="font-bold text-white text-sm">{selectedOrderProof.userName || 'Customer'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">RP Creditable</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    +{selectedOrderProof.payUnits ?? selectedOrderProof.unitsEstimated ?? Math.round(selectedOrderProof.inrAmountPaise / 100)} RP (₹{(selectedOrderProof.inrAmountPaise / 100).toFixed(2)})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Submitted UTR Reference</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-white text-sm">
                    {selectedOrderProof.utrNumber || selectedOrderProof.paymentReference || 'No UTR attached'}
                  </span>
                  {(selectedOrderProof.utrNumber || selectedOrderProof.paymentReference) && (
                    <button
                      onClick={() => copyToClipboard(selectedOrderProof.utrNumber || selectedOrderProof.paymentReference!, 'UTR')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 text-[11px]"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Proof Screenshot Display */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1.5">Payment Screenshot Proof:</span>
                {selectedOrderProof.paymentProofUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-h-56 flex items-center justify-center">
                    <img
                      src={selectedOrderProof.paymentProofUrl}
                      alt="Payment screenshot proof"
                      className="max-h-56 object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    No screenshot uploaded. Verified via official banking rail.
                  </div>
                )}
              </div>
            </div>

            {selectedOrderProof.status === 'pending' && (
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => handleRejectBuyOrder(selectedOrderProof.id, 'UTR verification failed')}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold"
                >
                  Reject Order
                </button>
                <button
                  onClick={() => handleApproveBuyOrder(selectedOrderProof.id, selectedOrderProof.utrNumber || selectedOrderProof.paymentReference)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Approve & Credit Balance
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: NEW NOTIFICATION BROADCAST MODAL
         ===================================================================== */}
      {isNewNotifModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#090e1c] border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                Publish System Notification
              </h3>
              <button
                onClick={() => setIsNewNotifModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendNotificationSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setNotifTargetType('all')}
                  className={`py-1.5 rounded-lg font-bold transition-colors ${
                    notifTargetType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Broadcast to All
                </button>
                <button
                  type="button"
                  onClick={() => setNotifTargetType('user')}
                  className={`py-1.5 rounded-lg font-bold transition-colors ${
                    notifTargetType === 'user' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Specific User
                </button>
              </div>

              {notifTargetType === 'user' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Target User ID:</label>
                  <input
                    type="text"
                    value={notifTargetUserId}
                    onChange={(e) => setNotifTargetUserId(e.target.value)}
                    placeholder="e.g. usr_rush_demo_001"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Type:</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="announcement">Announcement</option>
                  <option value="transaction">Transaction Alert</option>
                  <option value="payment">Payment Alert</option>
                  <option value="security">Security Advisory</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notification Title:</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. Scheduled Network Upgrade"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notification Message:</label>
                <textarea
                  rows={3}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Enter detailed message text..."
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewNotifModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30"
                >
                  {isSendingNotif ? 'Broadcasting...' : 'Publish Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: NEW ADMIN STAFF MODAL
         ===================================================================== */}
      {isNewStaffModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#090e1c] border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                Register New Administrator
              </h3>
              <button
                onClick={() => setIsNewStaffModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Username:</label>
                <input
                  type="text"
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  placeholder="e.g. ops_rahul"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Legal Name:</label>
                <input
                  type="text"
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Official Email:</label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="rahul@razypay.network"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Role:</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="manager">Manager (Orders, Users, Wallets, Reports)</option>
                  <option value="support">Support Staff (Tickets & Complaints)</option>
                  <option value="superadmin">Super Admin (Unrestricted System Access)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30"
                >
                  {isCreatingStaff ? 'Provisioning...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 6: SUPPORT TICKET REPLY MODAL
         ===================================================================== */}
      {activeTicketForReply && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#090e1c] border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Reply to Customer Ticket
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ticket #{activeTicketForReply.id} • {activeTicketForReply.userName}
                </p>
              </div>
              <button
                onClick={() => setActiveTicketForReply(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTicketReply} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <p className="font-bold text-white mb-1">Subject: {activeTicketForReply.subject}</p>
                <p className="text-slate-400 italic">
                  "{activeTicketForReply.messages[activeTicketForReply.messages.length - 1]?.message}"
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Agent Response Message:</label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your official resolution message..."
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTicketForReply(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30"
                >
                  {isSendingReply ? 'Sending...' : 'Dispatch Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
