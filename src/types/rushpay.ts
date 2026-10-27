// RushPay-Inspired Financial Types & Domain Models
// All balances represented in integer paise (₹1 = 100 paise) for exact financial arithmetic

export type UserRole = 'user' | 'merchant' | 'admin' | 'superadmin';
export type AccountStatus = 'pending_verification' | 'active' | 'suspended' | 'locked';
export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  id: string;
  mobile: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  kycStatus: KycStatus;
  referralCode: string;
  referredBy?: string;
  hasPin: boolean;
  failedPinAttempts: number;
  pinLockedUntil?: string;
  upiId?: string;
  upiHolderName?: string;
  bankAccount?: {
    accountNumber: string;
    ifscCode: string;
    bankName?: string;
    holderName?: string;
  };
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
}

export interface WalletBalances {
  // exact amounts in paise (1 INR = 100 paise)
  availablePaise: number;
  inReviewPaise: number;
  escrowPaise: number;
  totalDepositedPaise: number;
  totalWithdrawnPaise: number;
  totalEarnedPaise: number;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
export type OrderType = 'buy' | 'deposit';

export interface BuyOrder {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  orderType: OrderType;
  inrAmountPaise: number;
  rateInrPerUnit: number; // e.g. 1.00 for direct wallet load or configured conversion
  unitsEstimated: number; // units received
  feePaise: number;
  netAmountPaise: number;
  paymentMethod: 'razorpay' | 'upi_qr' | 'bank_transfer' | 'manual_review';
  paymentReference?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: OrderStatus;
  notes?: string;
  adminReason?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PayoutStatus = 'pending' | 'under_review' | 'processing' | 'completed' | 'rejected' | 'cancelled';
export type PayoutMethod = 'upi' | 'bank_neft' | 'imps';

export interface SellWithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  unitsToSell: number;
  rateInrPerUnit: number;
  grossAmountPaise: number;
  feePaise: number;
  netAmountPaise: number;
  payoutMethod: PayoutMethod;
  destinationAccount: {
    upiId?: string;
    accountHolderName: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  status: PayoutStatus;
  reservedPaise: number;
  payoutProviderRef?: string;
  adminReason?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType =
  | 'DEPOSIT_CREDIT'
  | 'BUY_CREDIT'
  | 'SELL_HOLD'
  | 'SELL_COMPLETE'
  | 'SELL_REFUND'
  | 'REFERRAL_REWARD'
  | 'FIRST_DEPOSIT_REWARD'
  | 'FEE_DEBIT'
  | 'ADMIN_ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  userId: string;
  relatedOrderId?: string;
  entryType: LedgerEntryType;
  amountPaise: number; // positive or negative
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface ExchangeRateConfig {
  id: string;
  pair: string; // e.g., 'INR_STABLE', 'USDT_INR', 'PAY_UNIT'
  buyRate: number;
  sellRate: number;
  buyFeePercent: number;
  sellFeePercent: number;
  minBuyInr: number;
  maxBuyInr: number;
  minSellInr: number;
  maxSellInr: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface ReferralRewardRecord {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referredUserMobile: string;
  rewardPaise: number;
  status: 'pending' | 'credited' | 'reversed';
  triggerEvent: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userMobile: string;
  userName: string;
  subject: string;
  category: 'deposit' | 'withdrawal' | 'buy_order' | 'kyc' | 'pin_reset' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: {
    sender: 'user' | 'agent';
    senderName: string;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface RushPayPlatformConfig {
  brandName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  telegramSupportUrl: string;
  minDepositInr: number;
  maxDepositInr: number;
  minWithdrawInr: number;
  maxWithdrawInr: number;
  defaultBuyFeePercent: number;
  defaultSellFeePercent: number;
  referralRewardPaise: number;
  depositUpiId: string;
  merchantName: string;
  isMaintenanceMode: boolean;
}
