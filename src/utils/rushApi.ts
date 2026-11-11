// RushPay Client API Service
import {
  UserProfile,
  WalletBalances,
  BuyOrder,
  SellWithdrawRequest,
  LedgerEntry,
  ExchangeRateConfig,
  RushPayPlatformConfig
} from '../types/rushpay';

const STORAGE_KEY = 'rps_token';
const USER_KEY = 'rps_user';

export const rushApi = {
  getToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setSession(token: string, user: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error(e);
    }
  },

  getStoredUser(): UserProfile | null {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(path, {
      ...options,
      headers
    });

    let data: any = {};
    let rawText = '';
    try {
      rawText = await response.text();
      data = JSON.parse(rawText);
    } catch {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid on server - auto purge local session
        this.clearSession();
      }

      // Check all possible error shapes
      const errorMsg =
        data.error ||
        data.message ||
        data.msg ||
        (response.status === 404
          ? 'API endpoint not reachable. Please verify server routing.'
          : response.status === 500
          ? (data.error || 'Server error processing registration. Please try again.')
          : `Request failed with status ${response.status}`);

      throw new Error(errorMsg);
    }
    return data;
  },

  // Auth
  async register(params: {
    mobile: string;
    fullName?: string;
    email?: string;
    password: string;
    referralCode?: string;
  }) {
    const res = await this.request<{
      success: boolean;
      user: UserProfile;
      token: string;
      message: string;
    }>('/api/rush/auth/register', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    this.setSession(res.token, res.user);
    return res;
  },

  async login(mobile: string, password: string, referralCode?: string) {
    const res = await this.request<{
      success: boolean;
      user: UserProfile;
      token: string;
      isNewUser?: boolean;
    }>('/api/rush/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mobile, password, referralCode })
    });
    this.setSession(res.token, res.user);
    return res;
  },

  async logout() {
    try {
      await this.request('/api/rush/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignored: If session already expired on server, local clean up still completes
      console.warn('Logout network notification finished or session already purged:', e);
    } finally {
      this.clearSession();
    }
  },

  // Dashboard & Wallet
  async getDashboardData(): Promise<{
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
  }> {
    const res = await this.request<{
      success: boolean;
      data: {
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
      };
    }>('/api/rush/user/dashboard');
    return res.data;
  },

  // PIN
  async setPin(pin: string) {
    return this.request<{ success: boolean; message: string }>('/api/rush/user/pin', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
  },

  // Save Settlement Wallet / UPI ID Permanently
  async saveWalletSettings(params: {
    upiId?: string;
    upiHolderName?: string;
    bankAccount?: {
      accountNumber: string;
      ifscCode: string;
      bankName?: string;
      holderName?: string;
    };
  }): Promise<{ success: boolean; message: string; profile: UserProfile }> {
    return this.request('/api/rush/user/wallet-settings', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Buy Orders
  async createBuyOrder(params: {
    amountInr: number;
    paymentMethod: 'razorpay' | 'upi_qr' | 'bank_transfer' | 'manual_review';
    notes?: string;
  }): Promise<{ success: boolean; order: BuyOrder; message: string }> {
    return this.request('/api/rush/orders/buy', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async confirmOrderPayment(
    orderId: string,
    params: { paymentRef: string; gatewayPaymentId?: string }
  ): Promise<{ success: boolean; order: BuyOrder; message: string }> {
    return this.request(`/api/rush/orders/${orderId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Withdrawals
  async createWithdrawal(params: {
    unitsToSell: number;
    payoutMethod: 'upi' | 'bank_neft' | 'imps';
    destinationAccount: {
      upiId?: string;
      accountHolderName: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    };
    pin: string;
  }): Promise<{ success: boolean; withdrawal: SellWithdrawRequest; message: string }> {
    return this.request('/api/rush/withdrawals/create', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Claim 1st Deposit Bonus (₹150)
  async claimFirstDepositReward(): Promise<{ success: boolean; message: string; rewardPaise: number; newBalancePaise: number }> {
    return this.request('/api/rush/user/claim-first-deposit', {
      method: 'POST'
    });
  },
  async getPublicInfo(): Promise<{
    rates: ExchangeRateConfig;
    config: RushPayPlatformConfig;
  }> {
    try {
      const res = await this.request<{
        success: boolean;
        rates: ExchangeRateConfig;
        config: RushPayPlatformConfig;
      }>('/api/rush/public/info');
      return { rates: res.rates, config: res.config };
    } catch (err) {
      console.warn('Network issue or server booting, using resilient fallback for Razy Pay public info:', err);
      return {
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
          updatedBy: 'System Resilient Engine'
        },
        config: {
          brandName: 'RAZY PAY',
          tagline: 'High-Performance Financial Operating System & Verified INR Settlement',
          supportEmail: 'support@razypay.network',
          supportPhone: '+91 9572918366',
          telegramSupportUrl: 'https://t.me/Razypaysupport',
          minDepositInr: 100,
          maxDepositInr: 500000,
          minWithdrawInr: 500,
          maxWithdrawInr: 200000,
          defaultBuyFeePercent: 0.5,
          defaultSellFeePercent: 0.75,
          referralRewardPaise: 10000,
          depositUpiId: 'razypy@ptyes',
          merchantName: 'Razy Pay Global Services',
          isMaintenanceMode: false
        }
      };
    }
  },

  // --- COMPREHENSIVE RAZY PAY ADMIN CLIENT APIS ---
  async adminRequest<T>(path: string, adminToken: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      ...((options.headers as Record<string, string>) || {})
    };

    const res = await fetch(path, {
      ...options,
      headers
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  },

  async getAdminDashboard(adminToken: string) {
    return this.adminRequest<{ success: boolean; data: any }>('/api/rush/admin/dashboard', adminToken);
  },

  async getAdminOverview(adminToken: string) {
    return this.adminRequest<any>('/api/rush/admin/overview', adminToken);
  },

  async getAllUsers(adminToken: string) {
    return this.adminRequest<{ success: boolean; users: any[] }>('/api/rush/admin/users', adminToken);
  },

  async updateUserStatus(adminToken: string, userId: string, status: 'active' | 'suspended' | 'blocked', reason?: string) {
    return this.adminRequest<{ success: boolean; profile: any }>(`/api/rush/admin/users/${userId}/status`, adminToken, {
      method: 'PUT',
      body: JSON.stringify({ status, reason })
    });
  },

  async adjustUserWallet(adminToken: string, userId: string, deltaPaise: number, reason: string) {
    return this.adminRequest<{ success: boolean; wallet: any; transactionId: string }>(`/api/rush/admin/users/${userId}/adjust-wallet`, adminToken, {
      method: 'POST',
      body: JSON.stringify({ deltaPaise, reason })
    });
  },

  async getAllBuyOrders(adminToken: string) {
    return this.adminRequest<{ success: boolean; orders: BuyOrder[] }>('/api/rush/admin/buy-orders', adminToken);
  },

  async approveBuyOrder(adminToken: string, orderId: string, utr?: string) {
    return this.adminRequest<{ success: boolean; order: BuyOrder }>(`/api/rush/admin/buy-orders/${orderId}/approve`, adminToken, {
      method: 'POST',
      body: JSON.stringify({ utr })
    });
  },

  async rejectBuyOrder(adminToken: string, orderId: string, reason: string) {
    return this.adminRequest<{ success: boolean; order: BuyOrder }>(`/api/rush/admin/buy-orders/${orderId}/reject`, adminToken, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async getAllSellOrders(adminToken: string) {
    return this.adminRequest<{ success: boolean; withdrawals: SellWithdrawRequest[] }>('/api/rush/admin/sell-orders', adminToken);
  },

  async processSellOrder(adminToken: string, withdrawalId: string, status: 'processing' | 'completed' | 'rejected', reason?: string, providerRef?: string) {
    return this.adminRequest<{ success: boolean; withdrawal: SellWithdrawRequest }>(`/api/rush/admin/sell-orders/${withdrawalId}/process`, adminToken, {
      method: 'POST',
      body: JSON.stringify({ status, reason, providerRef })
    });
  },

  async getAllWallets(adminToken: string) {
    return this.adminRequest<{ success: boolean; wallets: any[] }>('/api/rush/admin/wallets', adminToken);
  },

  async freezeWallet(adminToken: string, userId: string, isFrozen: boolean, reason?: string) {
    return this.adminRequest<{ success: boolean; isFrozen: boolean }>(`/api/rush/admin/wallets/${userId}/freeze`, adminToken, {
      method: 'POST',
      body: JSON.stringify({ isFrozen, reason })
    });
  },

  async getPaymentSettings(adminToken: string) {
    return this.adminRequest<{ success: boolean; config: RushPayPlatformConfig; recentBuyOrders: BuyOrder[]; recentWithdrawals: SellWithdrawRequest[]; settlementUpi: string; merchantName: string }>('/api/rush/admin/payments', adminToken);
  },

  async updatePaymentSettings(adminToken: string, data: Partial<RushPayPlatformConfig>) {
    return this.adminRequest<{ success: boolean; config: RushPayPlatformConfig }>('/api/rush/admin/payments/settings', adminToken, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async verifyUtr(adminToken: string, utr: string) {
    return this.adminRequest<{ success: boolean; utr: string; isValidFormat: boolean; isDuplicate: boolean; matchedOrderId?: string; message: string }>('/api/rush/admin/payments/verify-utr', adminToken, {
      method: 'POST',
      body: JSON.stringify({ utr })
    });
  },

  async getWebsiteSettings(adminToken: string) {
    return this.adminRequest<{ success: boolean; config: RushPayPlatformConfig; rates: ExchangeRateConfig }>('/api/rush/admin/settings', adminToken);
  },

  async updateWebsiteSettings(adminToken: string, data: { config?: Partial<RushPayPlatformConfig>; rates?: Partial<ExchangeRateConfig> }) {
    return this.adminRequest<{ success: boolean; message: string; config?: RushPayPlatformConfig; rates?: ExchangeRateConfig }>('/api/rush/admin/settings', adminToken, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async getNotifications(adminToken: string) {
    return this.adminRequest<{ success: boolean; notifications: any[] }>('/api/rush/admin/notifications', adminToken);
  },

  async sendNotification(adminToken: string, data: { targetType: 'all' | 'user'; targetUserId?: string; targetUserName?: string; title: string; message: string; type?: string }) {
    return this.adminRequest<{ success: boolean; notification: any }>('/api/rush/admin/notifications', adminToken, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getReports(adminToken: string) {
    return this.adminRequest<{ success: boolean; reports: any }>('/api/rush/admin/reports', adminToken);
  },

  async getStaff(adminToken: string) {
    return this.adminRequest<{ success: boolean; staff: any[] }>('/api/rush/admin/staff', adminToken);
  },

  async createStaff(adminToken: string, data: { username: string; fullName: string; email: string; role: string; permissions?: string[] }) {
    return this.adminRequest<{ success: boolean; account: any }>('/api/rush/admin/staff', adminToken, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateStaffStatus(adminToken: string, staffId: string, status: 'active' | 'suspended') {
    return this.adminRequest<{ success: boolean; account: any }>(`/api/rush/admin/staff/${staffId}/status`, adminToken, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async getSupportTickets(adminToken: string) {
    return this.adminRequest<{ success: boolean; tickets: any[] }>('/api/rush/admin/tickets', adminToken);
  },

  async replyTicket(adminToken: string, ticketId: string, message: string) {
    return this.adminRequest<{ success: boolean; ticket: any }>(`/api/rush/admin/tickets/${ticketId}/reply`, adminToken, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  async updateTicketStatus(adminToken: string, ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    return this.adminRequest<{ success: boolean; ticket: any }>(`/api/rush/admin/tickets/${ticketId}/status`, adminToken, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async getAuditLogs(adminToken: string) {
    return this.adminRequest<{ success: boolean; logs: any[] }>('/api/rush/admin/logs', adminToken);
  },

  async reviewWithdrawal(
    adminToken: string,
    id: string,
    action: 'approve' | 'reject',
    reason?: string
  ) {
    return this.processSellOrder(adminToken, id, action === 'approve' ? 'completed' : 'rejected', reason);
  },

  async updateRates(adminToken: string, rates: Partial<ExchangeRateConfig>) {
    return this.updateWebsiteSettings(adminToken, { rates });
  }
};

