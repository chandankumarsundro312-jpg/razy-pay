import {
  PhoneListing,
  RentalBooking,
  PaymentClaim,
  QrSettings,
  WebsiteSettings,
  AdminOverviewStats,
  AdminAuditLog
} from '../types';

const ADMIN_TOKEN_KEY = 'chandan_store_admin_token';
const ADMIN_USER_KEY = 'chandan_store_admin_info';

export const api = {
  // Admin Token Management
  getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setAdminToken(token: string, persist: boolean = true) {
    if (persist) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  },

  clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
  },

  getAdminUser(): { name: string; phone: string; email: string; role: string } | null {
    try {
      const raw = localStorage.getItem(ADMIN_USER_KEY) || sessionStorage.getItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setAdminUser(user: { name: string; phone: string; email: string; role: string }, persist: boolean = true) {
    const data = JSON.stringify(user);
    if (persist) {
      localStorage.setItem(ADMIN_USER_KEY, data);
    } else {
      sessionStorage.setItem(ADMIN_USER_KEY, data);
    }
  },

  // Helper for requests
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    const adminToken = this.getAdminToken();
    if (adminToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data as T;
  },

  // ==========================================================================
  // PUBLIC CLIENT APIS (NO CUSTOMER LOGIN)
  // ==========================================================================

  // Get Approved Phone Listings
  async getPhones(params?: {
    brand?: string;
    condition?: string;
    search?: string;
    sort?: string;
    featured?: boolean;
  }): Promise<{ phones: PhoneListing[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'All') query.set('brand', params.brand);
    if (params?.condition && params.condition !== 'All') query.set('condition', params.condition);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.featured) query.set('featured', 'true');

    const url = `/api/phones${query.toString() ? `?${query.toString()}` : ''}`;
    return this.request<{ phones: PhoneListing[]; total: number }>(url);
  },

  // Get Single Phone Details
  async getPhone(id: string): Promise<{ phone: PhoneListing }> {
    return this.request<{ phone: PhoneListing }>(`/api/phones/${id}`);
  },

  // Submit Listing ("List Your Phone" - Public Submission)
  async submitPhoneListing(payload: any): Promise<{
    success: boolean;
    referenceNumber: string;
    message: string;
    listing: PhoneListing;
  }> {
    return this.request('/api/phones/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Create Rental Booking
  async createBooking(payload: {
    phoneId: string;
    customerName: string;
    customerPhone: string;
    startDate: string;
    endDate: string;
    fulfillmentType: 'pickup' | 'delivery';
    deliveryAddress?: string;
    pincode?: string;
    postOffice?: string;
    district?: string;
    state?: string;
    aadhaarCardUrl: string; // Mandatory Aadhaar Card Image
    notes?: string;
    acceptedTerms: boolean;
    paymentMethod?: 'online' | 'cod';
  }): Promise<{
    success: boolean;
    booking: RentalBooking;
    qrSettings: QrSettings;
    upiId: string;
    message: string;
  }> {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // My Booking Lookup (No Login: Booking Ref + Customer Phone)
  async lookupBooking(bookingId: string, customerPhone: string): Promise<{
    booking: RentalBooking;
    phone?: PhoneListing;
    paymentClaim?: PaymentClaim;
    qrSettings: QrSettings;
  }> {
    return this.request('/api/bookings/lookup', {
      method: 'POST',
      body: JSON.stringify({ bookingId, customerPhone })
    });
  },

  // Lookup all orders & payment claims for a customer phone
  async getMyOrders(customerPhone: string): Promise<{
    bookings: RentalBooking[];
    payments: PaymentClaim[];
  }> {
    return this.request('/api/bookings/my-orders', {
      method: 'POST',
      body: JSON.stringify({ customerPhone })
    });
  },

  // Submit Payment Details (UTR / Screenshot)
  async submitPaymentClaim(payload: {
    bookingId: string;
    upiTxnId: string;
    claimedAmount: number;
    paymentTimestamp?: string;
    screenshotUrl?: string;
  }): Promise<{
    success: boolean;
    paymentReference: string;
    message: string;
    paymentClaim: PaymentClaim;
    booking: RentalBooking;
  }> {
    return this.request('/api/payments/claim', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Get Public QR & Store Settings
  async getQrSettings(): Promise<{
    qrSettings: QrSettings;
    settings: WebsiteSettings;
  }> {
    return this.request('/api/qr-settings');
  },

  // ==========================================================================
  // RAZORPAY PAYMENT GATEWAY APIS
  // ==========================================================================

  async getRazorpayConfig(): Promise<{
    keyId: string;
    merchantName: string;
    isLive: boolean;
  }> {
    return this.request('/api/razorpay/config');
  },

  async createRazorpayOrder(payload: {
    bookingId?: string;
    amount: number;
    customerPhone?: string;
    customerName?: string;
  }): Promise<{
    success: boolean;
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    merchantName: string;
    description: string;
    prefill: {
      name: string;
      contact: string;
      email: string;
    };
  }> {
    return this.request('/api/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async verifyRazorpayPayment(payload: {
    razorpay_order_id?: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    bookingId?: string;
    amount: number;
  }): Promise<{
    success: boolean;
    message: string;
    paymentReference: string;
    paymentId: string;
    booking?: RentalBooking | null;
  }> {
    return this.request('/api/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // ==========================================================================
  // ADMIN DASHBOARD APIS
  // ==========================================================================

  async adminLogin(credential: string, password: string): Promise<{
    success: boolean;
    token: string;
    admin: { name: string; phone: string; email: string; role: string };
  }> {
    const res = await this.request<{
      success: boolean;
      token: string;
      admin: { name: string; phone: string; email: string; role: string };
    }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ credential, password })
    });

    if (res.token) {
      this.setAdminToken(res.token);
      this.setAdminUser(res.admin);
    }
    return res;
  },

  async adminLogout(): Promise<{ success: boolean }> {
    try {
      await this.request('/api/admin/logout', { method: 'POST' });
    } finally {
      this.clearAdminToken();
    }
    return { success: true };
  },

  async getAdminOverview(): Promise<{
    stats: AdminOverviewStats;
    recentBookings: RentalBooking[];
    pendingPaymentsList: PaymentClaim[];
    recentAuditLogs: AdminAuditLog[];
  }> {
    return this.request('/api/admin/overview');
  },

  async getAdminPhones(): Promise<{ phones: PhoneListing[] }> {
    return this.request('/api/admin/phones');
  },

  async addAdminPhone(payload: any): Promise<{ success: boolean; phone: PhoneListing }> {
    return this.request('/api/admin/phones', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateAdminPhone(id: string, payload: any): Promise<{ success: boolean; phone: PhoneListing }> {
    return this.request(`/api/admin/phones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async updatePhoneApproval(id: string, approvalStatus: 'approved' | 'pending' | 'rejected'): Promise<{
    success: boolean;
    phone: PhoneListing;
  }> {
    return this.request(`/api/admin/phones/${id}/approval`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus })
    });
  },

  async deleteAdminPhone(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/admin/phones/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminBookings(): Promise<{ bookings: RentalBooking[] }> {
    return this.request('/api/admin/bookings');
  },

  async updateBookingStatus(
    id: string,
    bookingStatus?: string,
    paymentStatus?: string,
    adminNotes?: string
  ): Promise<{ success: boolean; booking: RentalBooking }> {
    return this.request(`/api/admin/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ bookingStatus, paymentStatus, adminNotes })
    });
  },

  async getAdminPayments(): Promise<{ payments: PaymentClaim[] }> {
    return this.request('/api/admin/payments');
  },

  async verifyPayment(
    id: string,
    action: 'verify' | 'reject' | 'refund',
    adminNotes?: string
  ): Promise<{ success: boolean; payment: PaymentClaim; booking?: RentalBooking }> {
    return this.request(`/api/admin/payments/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNotes })
    });
  },

  async updateQrSettings(payload: { customQrUrl?: string; merchantName?: string }): Promise<{
    success: boolean;
    qrSettings: QrSettings;
  }> {
    return this.request('/api/admin/qr-settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getSettings(): Promise<{ settings: WebsiteSettings }> {
    return this.request('/api/settings');
  },

  async updateWebsiteSettings(payload: Partial<WebsiteSettings>): Promise<{
    success: boolean;
    settings: WebsiteSettings;
  }> {
    return this.request('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateNavigationConfig(navigationConfig: any[]): Promise<{
    success: boolean;
    navigationConfig: any[];
    settings: WebsiteSettings;
  }> {
    return this.request('/api/admin/navigation', {
      method: 'PUT',
      body: JSON.stringify({ navigationConfig })
    });
  },

  async getAdminAuditLogs(): Promise<{ auditLogs: AdminAuditLog[] }> {
    return this.request('/api/admin/audit-logs');
  }
};
