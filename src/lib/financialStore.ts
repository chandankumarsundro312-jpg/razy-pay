import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  UserProfile,
  WalletBalances,
  BuyOrder,
  SellWithdrawRequest,
  LedgerEntry,
  ExchangeRateConfig,
  ReferralRewardRecord,
  SupportTicket,
  RushPayPlatformConfig
} from '../types/rushpay';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rushpay-financial-db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredUser {
  profile: UserProfile;
  passwordHash: string;
  pinHash?: string;
  pinSalt?: string;
  salt: string;
  wallet: WalletBalances;
}

export interface RushPayDatabase {
  users: Record<string, StoredUser>; // keyed by userId
  mobileIndex: Record<string, string>; // mobile -> userId
  referralCodeIndex: Record<string, string>; // refCode -> userId
  orders: BuyOrder[];
  withdrawals: SellWithdrawRequest[];
  ledger: LedgerEntry[];
  rates: ExchangeRateConfig;
  referrals: ReferralRewardRecord[];
  tickets: SupportTicket[];
  config: RushPayPlatformConfig;
  sessions: Record<string, { userId: string; createdAt: string; expiresAt: string }>;
  otps: Record<string, { codeHash: string; expiresAt: number; attempts: number }>;
}

const DEFAULT_CONFIG: RushPayPlatformConfig = {
  brandName: 'RAZY PAY',
  tagline: 'High-Performance Financial Operating System & Verified INR Settlement',
  supportEmail: 'support@razypay.network',
  supportPhone: '+91 9572918366',
  telegramSupportUrl: 'https://t.me/Chandanstoresupport',
  minDepositInr: 100,
  maxDepositInr: 500000,
  minWithdrawInr: 500,
  maxWithdrawInr: 200000,
  defaultBuyFeePercent: 0.5,
  defaultSellFeePercent: 0.75,
  referralRewardPaise: 10000, // ₹100
  depositUpiId: 'razypey@ptyes',
  merchantName: 'Razy Pay Global Services',
  isMaintenanceMode: false
};

const DEFAULT_RATES: ExchangeRateConfig = {
  id: 'INR_STABLE_V1',
  pair: 'INR / PAY UNIT',
  buyRate: 1.00,
  sellRate: 0.995,
  buyFeePercent: 0.5,
  sellFeePercent: 0.75,
  minBuyInr: 100,
  maxBuyInr: 500000,
  minSellInr: 500,
  maxSellInr: 200000,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System Auto-Engine'
};

function hashSecret(secret: string, salt: string): string {
  return crypto.pbkdf2Sync(secret, salt, 10000, 64, 'sha512').toString('hex');
}

export class FinancialStore {
  private db: RushPayDatabase;

  constructor() {
    this.db = this.load();
    this.seedDefaults();
  }

  private load(): RushPayDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading rushpay db, initializing fresh:', e);
    }
    return {
      users: {},
      mobileIndex: {},
      referralCodeIndex: {},
      orders: [],
      withdrawals: [],
      ledger: [],
      rates: DEFAULT_RATES,
      referrals: [],
      tickets: [],
      config: DEFAULT_CONFIG,
      sessions: {},
      otps: {}
    };
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save rushpay db:', err);
    }
  }

  private seedDefaults() {
    // Seed default rate & config if missing
    if (!this.db.rates) this.db.rates = DEFAULT_RATES;
    if (!this.db.config) this.db.config = DEFAULT_CONFIG;

    // Seed Demo/Admin user if empty
    const demoMobile = '9876543210';
    if (!this.db.mobileIndex[demoMobile]) {
      const salt = crypto.randomBytes(16).toString('hex');
      const pinSalt = crypto.randomBytes(16).toString('hex');
      const userId = 'usr_rush_demo_001';
      const user: StoredUser = {
        profile: {
          id: userId,
          mobile: demoMobile,
          email: 'demo@rushpay.network',
          fullName: 'Vikram Malhotra',
          role: 'user',
          accountStatus: 'active',
          kycStatus: 'verified',
          referralCode: 'RP-VIKRAM88',
          hasPin: true,
          failedPinAttempts: 0,
          createdAt: new Date().toISOString(),
          twoFactorEnabled: false
        },
        passwordHash: hashSecret('Demo@1234', salt),
        pinHash: hashSecret('123456', pinSalt),
        pinSalt,
        salt,
        wallet: {
          availablePaise: 5000, // ₹50.00 standard fixed starting balance
          inReviewPaise: 0,
          escrowPaise: 0,
          totalDepositedPaise: 0,
          totalWithdrawnPaise: 0,
          totalEarnedPaise: 0,
          updatedAt: new Date().toISOString()
        }
      };

      this.db.users[userId] = user;
      this.db.mobileIndex[demoMobile] = userId;
      this.db.referralCodeIndex['RP-VIKRAM88'] = userId;
      this.save();
    }

    // Synchronize active config without overwriting or resetting user wallets/records
    if (this.db.config) {
      this.db.config.depositUpiId = 'razypey@ptyes';
    }
    this.save();
  }

  // --- AUTHENTICATION & USERS ---
  public registerUser(params: {
    mobile: string;
    email: string;
    fullName: string;
    password: string;
    referralCode?: string;
  }): { user: UserProfile; token: string } {
    const cleanMobile = params.mobile.trim().replace(/\D/g, '');
    if (this.db.mobileIndex[cleanMobile]) {
      throw new Error('An account with this mobile number already exists');
    }

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashSecret(params.password, salt);
    const userReferralCode = `RP-${cleanMobile.slice(-4)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Validate referral code if provided
    let referredBy: string | undefined = undefined;
    if (params.referralCode) {
      const referrerId = this.db.referralCodeIndex[params.referralCode.trim().toUpperCase()];
      if (referrerId && referrerId !== userId) {
        referredBy = referrerId;
      }
    }

    const profile: UserProfile = {
      id: userId,
      mobile: cleanMobile,
      email: params.email.trim().toLowerCase(),
      fullName: params.fullName.trim(),
      role: 'user',
      accountStatus: 'active',
      kycStatus: 'pending',
      referralCode: userReferralCode,
      referredBy,
      hasPin: false,
      failedPinAttempts: 0,
      createdAt: new Date().toISOString(),
      twoFactorEnabled: false
    };

    const wallet: WalletBalances = {
      availablePaise: 5000, // ₹50.00 standard fixed balance
      inReviewPaise: 0,
      escrowPaise: 0,
      totalDepositedPaise: 0,
      totalWithdrawnPaise: 0,
      totalEarnedPaise: 5000,
      updatedAt: new Date().toISOString()
    };

    this.db.users[userId] = {
      profile,
      passwordHash,
      salt,
      wallet
    };

    this.db.mobileIndex[cleanMobile] = userId;
    this.db.referralCodeIndex[userReferralCode] = userId;

    // Credit referral reward if applicable
    if (referredBy && this.db.users[referredBy]) {
      const rewardPaise = this.db.config.referralRewardPaise || 10000;
      this.db.referrals.push({
        id: `ref_${Date.now()}`,
        referrerUserId: referredBy,
        referredUserId: userId,
        referredUserMobile: cleanMobile,
        rewardPaise,
        status: 'credited',
        triggerEvent: 'NEW_USER_SIGNUP',
        createdAt: new Date().toISOString()
      });

      // Atomically credit referrer wallet ledger
      const refUser = this.db.users[referredBy];
      const balBefore = refUser.wallet.availablePaise;
      refUser.wallet.availablePaise += rewardPaise;
      refUser.wallet.totalEarnedPaise += rewardPaise;
      refUser.wallet.updatedAt = new Date().toISOString();

      this.db.ledger.push({
        id: `led_ref_${Date.now()}`,
        userId: referredBy,
        entryType: 'REFERRAL_REWARD',
        amountPaise: rewardPaise,
        balanceBeforePaise: balBefore,
        balanceAfterPaise: refUser.wallet.availablePaise,
        description: `Referral signup reward from invitee (${cleanMobile.slice(-4)})`,
        referenceId: `REF-${userId}`,
        createdAt: new Date().toISOString()
      });
    }

    const token = this.createSession(userId);
    this.save();
    return { user: profile, token };
  }

  public loginUser(mobile: string, password: string): { user: UserProfile; token: string } {
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    const userId = this.db.mobileIndex[cleanMobile];
    if (!userId || !this.db.users[userId]) {
      throw new Error('Invalid mobile number or credentials');
    }

    const stored = this.db.users[userId];
    if (stored.profile.accountStatus === 'locked' || stored.profile.accountStatus === 'suspended') {
      throw new Error('Account access restricted. Please contact support.');
    }

    const testHash = hashSecret(password, stored.salt);
    if (testHash !== stored.passwordHash) {
      throw new Error('Invalid mobile number or credentials');
    }

    stored.profile.lastLoginAt = new Date().toISOString();
    const token = this.createSession(userId);
    this.save();
    return { user: stored.profile, token };
  }

  public createSession(userId: string): string {
    const token = `rps_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days
    this.db.sessions[token] = { userId, createdAt: new Date().toISOString(), expiresAt };
    this.save();
    return token;
  }

  public validateSession(token: string): StoredUser | null {
    if (!token) return null;
    const session = this.db.sessions[token];
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.db.sessions[token];
      this.save();
      return null;
    }
    return this.db.users[session.userId] || null;
  }

  public logoutSession(token: string): void {
    if (token && this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.save();
    }
  }

  // --- PIN MANAGEMENT ---
  public setTransactionPin(userId: string, pin: string): void {
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error('Transaction PIN must be 4 to 6 numeric digits');
    }
    const pinSalt = crypto.randomBytes(16).toString('hex');
    user.pinHash = hashSecret(pin, pinSalt);
    user.pinSalt = pinSalt;
    user.profile.hasPin = true;
    user.profile.failedPinAttempts = 0;
    user.profile.pinLockedUntil = undefined;
    this.save();
  }

  public verifyTransactionPin(userId: string, pin: string): boolean {
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');
    if (!user.pinHash || !user.pinSalt) {
      throw new Error('Transaction PIN is not configured yet. Please set your PIN in Security Settings.');
    }

    if (user.profile.pinLockedUntil && new Date(user.profile.pinLockedUntil).getTime() > Date.now()) {
      throw new Error('PIN entry temporarily locked due to repeated incorrect attempts. Please try again later.');
    }

    const testHash = hashSecret(pin, user.pinSalt);
    if (testHash !== user.pinHash) {
      user.profile.failedPinAttempts = (user.profile.failedPinAttempts || 0) + 1;
      if (user.profile.failedPinAttempts >= 5) {
        user.profile.pinLockedUntil = new Date(Date.now() + 1800000).toISOString(); // 30 min lockout
      }
      this.save();
      throw new Error(`Invalid transaction PIN. (${5 - user.profile.failedPinAttempts} attempts remaining)`);
    }

    user.profile.failedPinAttempts = 0;
    this.save();
    return true;
  }

  // --- SETTLEMENT WALLET / UPI ID PERMANENT PERSISTENCE ---
  public updateUserSettlementWallet(
    userId: string,
    params: {
      upiId?: string;
      upiHolderName?: string;
      bankAccount?: {
        accountNumber: string;
        ifscCode: string;
        bankName?: string;
        holderName?: string;
      };
    }
  ): UserProfile {
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');

    if (params.upiId !== undefined) {
      user.profile.upiId = params.upiId;
      user.profile.upiHolderName = params.upiHolderName || user.profile.fullName;
    }
    if (params.bankAccount) {
      user.profile.bankAccount = params.bankAccount;
    }

    this.save();
    return user.profile;
  }

  // --- BUY / DEPOSIT ORDER WORKFLOW ---
  public createBuyOrder(params: {
    userId: string;
    inrAmountPaise: number;
    paymentMethod: 'razorpay' | 'upi_qr' | 'bank_transfer' | 'manual_review';
    notes?: string;
  }): BuyOrder {
    const user = this.db.users[params.userId];
    if (!user) throw new Error('User not found');

    const rates = this.db.rates;
    const amountInr = params.inrAmountPaise / 100;

    if (amountInr < rates.minBuyInr || amountInr > rates.maxBuyInr) {
      throw new Error(`Order amount must be between ₹${rates.minBuyInr.toLocaleString('en-IN')} and ₹${rates.maxBuyInr.toLocaleString('en-IN')}`);
    }

    // Full credited balance with 6% commission bonus added directly to wallet
    const feePaise = 0; // Zero deduction for users
    const netAmountPaise = Math.round(params.inrAmountPaise * 1.06);
    const unitsEstimated = Number((netAmountPaise / 100).toFixed(2));

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const order: BuyOrder = {
      id: orderId,
      userId: user.profile.id,
      userName: user.profile.fullName,
      userMobile: user.profile.mobile,
      orderType: 'buy',
      inrAmountPaise: params.inrAmountPaise,
      rateInrPerUnit: rates.buyRate,
      unitsEstimated,
      feePaise,
      netAmountPaise,
      paymentMethod: params.paymentMethod,
      status: 'pending',
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.orders.unshift(order);
    this.save();
    return order;
  }

  public getOrderById(orderId: string): BuyOrder | undefined {
    return this.db.orders.find((o) => o.id === orderId);
  }

  public getAllOrders(): BuyOrder[] {
    return this.db.orders;
  }

  public completeOrder(orderId: string, paymentRef: string, gatewayPaymentId?: string): BuyOrder {
    const order = this.db.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'approved') return order; // idempotent

    const user = this.db.users[order.userId];
    if (!user) throw new Error('User account not found');

    order.status = 'approved';
    order.paymentReference = paymentRef;
    order.gatewayPaymentId = gatewayPaymentId;
    order.updatedAt = new Date().toISOString();

    // Atomic Balance Credit
    const balBefore = user.wallet.availablePaise;
    user.wallet.availablePaise += order.netAmountPaise;
    user.wallet.totalDepositedPaise += order.inrAmountPaise;
    user.wallet.updatedAt = new Date().toISOString();

    this.db.ledger.unshift({
      id: `led_${Date.now()}`,
      userId: user.profile.id,
      relatedOrderId: order.id,
      entryType: 'BUY_CREDIT',
      amountPaise: order.netAmountPaise,
      balanceBeforePaise: balBefore,
      balanceAfterPaise: user.wallet.availablePaise,
      description: `Order ${order.id} verified credit (${paymentRef || 'Gateway Settlement'})`,
      referenceId: paymentRef || order.id,
      createdAt: new Date().toISOString()
    });

    this.save();
    return order;
  }

  // --- 1ST DEPOSIT REWARD (₹150 BONUS) ---
  public claimFirstDepositReward(userId: string): { success: boolean; rewardPaise: number; newBalancePaise: number } {
    const user = this.db.users[userId];
    if (!user) throw new Error('User not found');

    // Check if user has made at least one deposit (totalDepositedPaise > 0 or has an approved buy order)
    const hasApprovedOrder = this.db.orders.some((o) => o.userId === userId && o.status === 'approved');
    const hasDeposit = (user.wallet.totalDepositedPaise && user.wallet.totalDepositedPaise > 0) || hasApprovedOrder;

    if (!hasDeposit) {
      throw new Error('1st Deposit Reward can only be claimed after making your first deposit or completing a buy order.');
    }

    // Check if already claimed in ledger
    const alreadyClaimed = this.db.ledger.some(
      (l) => l.userId === userId && l.entryType === 'FIRST_DEPOSIT_REWARD'
    );
    if (alreadyClaimed) {
      throw new Error('You have already claimed your 1st Deposit Bonus of ₹150.');
    }

    const rewardPaise = 15000; // ₹150.00
    const balBefore = user.wallet.availablePaise;
    user.wallet.availablePaise += rewardPaise;
    user.wallet.totalEarnedPaise += rewardPaise;
    user.wallet.updatedAt = new Date().toISOString();

    this.db.ledger.unshift({
      id: `led_rew_${Date.now()}`,
      userId: user.profile.id,
      entryType: 'FIRST_DEPOSIT_REWARD',
      amountPaise: rewardPaise,
      balanceBeforePaise: balBefore,
      balanceAfterPaise: user.wallet.availablePaise,
      description: '1st Deposit Starter Program Reward (₹150 Bonus)',
      referenceId: `REW-FIRSTDEP-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    });

    this.save();
    return {
      success: true,
      rewardPaise,
      newBalancePaise: user.wallet.availablePaise
    };
  }

  // --- SELL / WITHDRAWAL WORKFLOW (Atomic Fund Reservation) ---
  public createWithdrawalRequest(params: {
    userId: string;
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
  }): SellWithdrawRequest {
    const user = this.db.users[params.userId];
    if (!user) throw new Error('User not found');

    // 1. Verify Transaction PIN
    this.verifyTransactionPin(params.userId, params.pin);

    // 2. Validate Limits
    const rates = this.db.rates;
    const grossAmountPaise = Math.round(params.unitsToSell * rates.sellRate * 100);
    const amountInr = grossAmountPaise / 100;

    if (amountInr < rates.minSellInr || amountInr > rates.maxSellInr) {
      throw new Error(`Withdrawal amount must be between ₹${rates.minSellInr.toLocaleString('en-IN')} and ₹${rates.maxSellInr.toLocaleString('en-IN')}`);
    }

    const feePercent = rates.sellFeePercent || 0.75;
    const feePaise = Math.round((grossAmountPaise * feePercent) / 100);
    const netAmountPaise = grossAmountPaise - feePaise;

    // 3. Check and atomically reserve funds
    if (user.wallet.availablePaise < grossAmountPaise) {
      throw new Error(`Insufficient wallet balance. Available: ₹${(user.wallet.availablePaise / 100).toLocaleString('en-IN')}`);
    }

    const reqId = `WTH-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Atomically debit available and place into review escrow
    const balBefore = user.wallet.availablePaise;
    user.wallet.availablePaise -= grossAmountPaise;
    user.wallet.inReviewPaise += grossAmountPaise;
    user.wallet.updatedAt = new Date().toISOString();

    const request: SellWithdrawRequest = {
      id: reqId,
      userId: user.profile.id,
      userName: user.profile.fullName,
      userMobile: user.profile.mobile,
      unitsToSell: params.unitsToSell,
      rateInrPerUnit: rates.sellRate,
      grossAmountPaise,
      feePaise,
      netAmountPaise,
      payoutMethod: params.payoutMethod,
      destinationAccount: params.destinationAccount,
      status: 'pending',
      reservedPaise: grossAmountPaise,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.withdrawals.unshift(request);

    // Record ledger entry for hold
    this.db.ledger.unshift({
      id: `led_hold_${Date.now()}`,
      userId: user.profile.id,
      relatedOrderId: reqId,
      entryType: 'SELL_HOLD',
      amountPaise: -grossAmountPaise,
      balanceBeforePaise: balBefore,
      balanceAfterPaise: user.wallet.availablePaise,
      description: `Funds reserved for withdrawal request ${reqId}`,
      referenceId: reqId,
      createdAt: new Date().toISOString()
    });

    this.save();
    return request;
  }

  public processWithdrawal(reqId: string, action: 'approve' | 'reject', reason?: string, providerRef?: string): SellWithdrawRequest {
    const req = this.db.withdrawals.find((w) => w.id === reqId);
    if (!req) throw new Error('Withdrawal request not found');
    if (req.status !== 'pending' && req.status !== 'under_review') {
      throw new Error(`Request is already in ${req.status} state`);
    }

    const user = this.db.users[req.userId];
    if (!user) throw new Error('User account not found');

    if (action === 'approve') {
      req.status = 'completed';
      req.payoutProviderRef = providerRef || `PAYOUT-BANK-${Date.now()}`;
      req.adminReason = reason || 'Payout approved and executed';
      req.updatedAt = new Date().toISOString();

      // Release reserved escrow from inReview and mark withdrawn
      user.wallet.inReviewPaise = Math.max(0, user.wallet.inReviewPaise - req.reservedPaise);
      user.wallet.totalWithdrawnPaise += req.netAmountPaise;
      user.wallet.updatedAt = new Date().toISOString();

      this.db.ledger.unshift({
        id: `led_wth_done_${Date.now()}`,
        userId: user.profile.id,
        relatedOrderId: req.id,
        entryType: 'SELL_COMPLETE',
        amountPaise: -req.netAmountPaise,
        balanceBeforePaise: user.wallet.availablePaise,
        balanceAfterPaise: user.wallet.availablePaise,
        description: `Withdrawal ${req.id} disbursed to destination account (${req.payoutProviderRef})`,
        referenceId: req.payoutProviderRef,
        createdAt: new Date().toISOString()
      });
    } else {
      // Rejection: Atomically refund reserved balance back to available
      req.status = 'rejected';
      req.adminReason = reason || 'Declined during compliance check';
      req.updatedAt = new Date().toISOString();

      const balBefore = user.wallet.availablePaise;
      user.wallet.inReviewPaise = Math.max(0, user.wallet.inReviewPaise - req.reservedPaise);
      user.wallet.availablePaise += req.reservedPaise;
      user.wallet.updatedAt = new Date().toISOString();

      this.db.ledger.unshift({
        id: `led_wth_refund_${Date.now()}`,
        userId: user.profile.id,
        relatedOrderId: req.id,
        entryType: 'SELL_REFUND',
        amountPaise: req.reservedPaise,
        balanceBeforePaise: balBefore,
        balanceAfterPaise: user.wallet.availablePaise,
        description: `Withdrawal ${req.id} rejected: ${req.adminReason}. Funds restored.`,
        referenceId: req.id,
        createdAt: new Date().toISOString()
      });
    }

    this.save();
    return req;
  }

  // --- GETTERS & QUERIES ---
  public getUserData(userId: string) {
    const user = this.db.users[userId];
    if (!user) return null;
    // Compute Team & Referral Statistics
    const userReferrals = (this.db.referrals || []).filter((r) => r.referrerUserId === userId);
    const totalInvites = userReferrals.length;
    const teamEarnedPaise = userReferrals.reduce((sum, r) => sum + (r.rewardPaise || 0), 0) + (user.wallet.totalEarnedPaise || 0);

    return {
      profile: user.profile,
      wallet: user.wallet,
      recentOrders: this.db.orders.filter((o) => o.userId === userId),
      recentWithdrawals: this.db.withdrawals.filter((w) => w.userId === userId),
      recentLedger: this.db.ledger.filter((l) => l.userId === userId),
      teamStats: {
        totalInvites,
        totalEarnedPaise: teamEarnedPaise,
        referrals: userReferrals
      },
      rates: this.db.rates,
      config: this.db.config
    };
  }

  public getPlatformOverview() {
    let totalUsers = Object.keys(this.db.users).length;
    let totalDepositedPaise = 0;
    let totalWithdrawnPaise = 0;
    let totalEscrowPaise = 0;

    Object.values(this.db.users).forEach((u) => {
      totalDepositedPaise += u.wallet.totalDepositedPaise;
      totalWithdrawnPaise += u.wallet.totalWithdrawnPaise;
      totalEscrowPaise += u.wallet.inReviewPaise;
    });

    return {
      totalUsers,
      totalDepositedPaise,
      totalWithdrawnPaise,
      totalEscrowPaise,
      pendingOrdersCount: this.db.orders.filter((o) => o.status === 'pending').length,
      pendingWithdrawalsCount: this.db.withdrawals.filter((w) => w.status === 'pending').length,
      rates: this.db.rates,
      config: this.db.config
    };
  }

  public getRawDatabase(): RushPayDatabase {
    return this.db;
  }

  public updateRates(rates: Partial<ExchangeRateConfig>, adminName: string): ExchangeRateConfig {
    this.db.rates = {
      ...this.db.rates,
      ...rates,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminName
    };
    this.save();
    return this.db.rates;
  }

  public updateConfig(newConfig: Partial<RushPayPlatformConfig>): RushPayPlatformConfig {
    this.db.config = {
      ...this.db.config,
      ...newConfig
    };
    this.save();
    return this.db.config;
  }
}

export const financialStore = new FinancialStore();
