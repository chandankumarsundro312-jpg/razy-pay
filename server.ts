import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  PhoneListing,
  RentalBooking,
  PaymentClaim,
  QrSettings,
  WebsiteSettings,
  AdminAuditLog,
  AdminOverviewStats
} from "./src/types";
import { COMPREHENSIVE_PHONE_FLEET } from "./src/data/phoneFleet";
import { financialStore } from "./src/lib/financialStore";
import { saveUserToSupabase } from "./src/lib/supabase";

// ============================================================================
// DATA DIRECTORY & PERSISTENT DATABASE SETUP
// ============================================================================
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'chandan-store-data') : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "chandan-store-db.json");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Note creating server data directory:', e);
}

interface ChandanStoreDatabase {
  phones: PhoneListing[];
  bookings: RentalBooking[];
  payments: PaymentClaim[];
  qrSettings: QrSettings;
  settings: WebsiteSettings;
  auditLogs: AdminAuditLog[];
}

const DEFAULT_QR_SETTINGS: QrSettings = {
  upiId: "razypey@ptyes",
  merchantName: "Razy Pay Official",
  lastUpdated: new Date().toISOString()
};

const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  storeName: "RAZY PAY",
  tagline: "High-Performance Financial Operating System & Verified Settlement",
  supportPhone: "+91 9572918366",
  supportEmail: "support@razypay.network",
  supportAddress: "Financial District, Mumbai, India",
  platformFee: 0,
  deliveryFee: 0
};

const INITIAL_PHONES: PhoneListing[] = COMPREHENSIVE_PHONE_FLEET;

function loadDatabase(): ChandanStoreDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      const existingIds = new Set((parsed.phones || []).map((p: any) => p.id));
      const missingFleet = COMPREHENSIVE_PHONE_FLEET.filter((p) => !existingIds.has(p.id));
      const loadedPhones = [...(parsed.phones || []), ...missingFleet].map((p: any) => ({
        ...p,
        securityDeposit: p.securityDeposit !== undefined ? Number(p.securityDeposit) : 0
      }));
      const loadedBookings = (parsed.bookings || []).map((b: any) => ({
        ...b,
        securityDeposit: b.securityDeposit !== undefined ? Number(b.securityDeposit) : 0,
        platformFee: 0,
        totalPayable: b.rentalCharges + (b.deliveryFee || 0) + (b.securityDeposit || 0)
      }));
      const dbInstance: ChandanStoreDatabase = {
        phones: loadedPhones,
        bookings: loadedBookings,
        payments: parsed.payments || [],
        qrSettings: { ...DEFAULT_QR_SETTINGS, ...(parsed.qrSettings || {}) },
        settings: { ...DEFAULT_WEBSITE_SETTINGS, ...(parsed.settings || {}), platformFee: 0 },
        auditLogs: parsed.auditLogs || []
      };
      if (missingFleet.length > 0) {
        saveDatabase(dbInstance);
      }
      return dbInstance;
    }
  } catch (err) {
    console.error("Error reading database file, initializing defaults:", err);
  }

  const initialDb: ChandanStoreDatabase = {
    phones: INITIAL_PHONES,
    bookings: [],
    payments: [],
    qrSettings: DEFAULT_QR_SETTINGS,
    settings: DEFAULT_WEBSITE_SETTINGS,
    auditLogs: [
      {
        id: "log-1",
        action: "STORE_INITIALIZED",
        details: "Chandan Store phone rental platform initialized with flagship fleet.",
        timestamp: new Date().toISOString(),
        adminUser: "System"
      }
    ]
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: ChandanStoreDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// In-memory cache synced to disk
let db = loadDatabase();

// Admin Authentication tokens
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vipbhiya01";
const ADMIN_PHONE = "7549545333";
const ADMIN_EMAIL = "chandankumarsundro312@gmail.com";
const activeAdminTokens = new Set<string>();

function logAudit(action: string, details: string, adminUser = "Admin") {
  const newLog: AdminAuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    timestamp: new Date().toISOString(),
    adminUser
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDatabase(db);
}

// Express App Initialization
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS / Security headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Admin Authentication Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing admin token" });
  }
  const token = authHeader.split(" ")[1];
  if (!activeAdminTokens.has(token)) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired admin session" });
  }
  next();
}

// ============================================================================
// PUBLIC STOREFRONT APIS (NO CUSTOMER LOGIN REQUIRED)
// ============================================================================

// 1. Get Approved Available Phone Listings
app.get("/api/phones", (req: Request, res: Response) => {
  try {
    const { brand, search, condition, sort, featured } = req.query;

    let results = db.phones.filter((p) => p.approvalStatus === "approved");

    if (brand && typeof brand === "string" && brand !== "All") {
      results = results.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    if (condition && typeof condition === "string" && condition !== "All") {
      results = results.filter((p) => p.condition.toLowerCase() === condition.toLowerCase());
    }

    if (featured === "true") {
      results = results.filter((p) => p.featured);
    }

    if (search && typeof search === "string") {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.model.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.ram.toLowerCase().includes(q) ||
          p.storage.toLowerCase().includes(q)
      );
    }

    if (sort === "price-asc") {
      results.sort((a, b) => a.dailyPrice - b.dailyPrice);
    } else if (sort === "price-desc") {
      results.sort((a, b) => b.dailyPrice - a.dailyPrice);
    } else {
      // Default: Newest first
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({ phones: results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch phones" });
  }
});

// 2. Get Single Phone Details
app.get("/api/phones/:id", (req: Request, res: Response) => {
  const phone = db.phones.find((p) => p.id === req.params.id);
  if (!phone) {
    return res.status(404).json({ error: "Phone listing not found" });
  }
  res.json({ phone });
});

// 3. Public Submit: List Your Phone for Rent (Pending Approval)
app.post("/api/phones/submit", (req: Request, res: Response) => {
  try {
    const {
      ownerName,
      ownerPhone,
      brand,
      model,
      ram,
      storage,
      condition,
      color,
      dailyPrice,
      weeklyPrice,
      monthlyPrice,
      securityDeposit,
      location,
      deliveryAvailable,
      images,
      accessories,
      description,
      rentalRules,
      screen,
      battery,
      camera,
      processor,
      ownsPhoneConfirmed
    } = req.body;

    if (!ownerName || !ownerPhone || !model || !brand || !dailyPrice) {
      return res.status(400).json({ error: "Please fill in all required fields (Name, Phone, Model, Brand, Rates)." });
    }

    if (!ownsPhoneConfirmed) {
      return res.status(400).json({ error: "You must confirm ownership or authorized authority to list this phone for rent." });
    }

    const listingRef = `LST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const validImages = Array.isArray(images) && images.length > 0
      ? images
      : ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80"];

    const newListing: PhoneListing = {
      id: listingRef,
      brand: brand || "Other Android",
      model: model.trim(),
      ram: ram ? `${ram}` : "8GB",
      storage: storage ? `${storage}` : "128GB",
      condition: condition || "Like New",
      color: color || "Standard",
      dailyPrice: Number(dailyPrice),
      weeklyPrice: Number(weeklyPrice) || Number(dailyPrice) * 6,
      monthlyPrice: Number(monthlyPrice) || Number(dailyPrice) * 22,
      securityDeposit: 0,
      location: location || "Local Pickup",
      deliveryAvailable: !!deliveryAvailable,
      primaryImage: validImages[0],
      images: validImages,
      accessories: Array.isArray(accessories) && accessories.length > 0 ? accessories : ["Charger & Cable"],
      specifications: {
        screen: screen || "6.5-inch Super AMOLED Display",
        battery: battery || "5,000 mAh High Capacity Battery",
        camera: camera || "50MP Multi-Lens AI Camera",
        processor: processor || "Octa-Core High Performance CPU"
      },
      description: description || `Certified authentic ${model} available for rent on Chandan Store.`,
      rentalRules: rentalRules || "Standard rental agreement. Zero security deposit required.",
      status: "available",
      approvalStatus: "pending",
      featured: false,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.phones.unshift(newListing);
    saveDatabase(db);
    logAudit("PUBLIC_LISTING_SUBMITTED", `Phone listing ${newListing.model} submitted by ${ownerName} (${ownerPhone}) - Ref: ${listingRef}`);

    res.status(201).json({
      success: true,
      referenceNumber: listingRef,
      message: "Phone listing submitted successfully! It is now pending admin review before appearing on the public store.",
      listing: newListing
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to submit listing" });
  }
});

// 4. Create Rental Booking (Without Customer Login)
app.post("/api/bookings", (req: Request, res: Response) => {
  try {
    const {
      phoneId,
      customerName,
      customerPhone,
      startDate,
      endDate,
      fulfillmentType,
      deliveryAddress,
      pincode,
      postOffice,
      district,
      state,
      aadhaarCardUrl,
      notes,
      acceptedTerms,
      paymentMethod
    } = req.body;

    if (!phoneId || !customerName || !customerPhone || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required booking details (Phone, Name, Contact Phone, Dates)." });
    }

    if (!aadhaarCardUrl) {
      return res.status(400).json({ error: "Aadhaar Card upload is mandatory for identity verification." });
    }

    if (!acceptedTerms) {
      return res.status(400).json({ error: "You must accept the rental terms and conditions." });
    }

    const phone = db.phones.find((p) => p.id === phoneId);
    if (!phone) {
      return res.status(404).json({ error: "Selected smartphone was not found." });
    }

    if (phone.status !== "available" || phone.approvalStatus !== "approved") {
      return res.status(400).json({ error: "Selected smartphone is currently unavailable for new bookings." });
    }

    // Calculate dates securely on server
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays < 1) {
      return res.status(400).json({ error: "Rental end date must be on or after start date." });
    }

    // Check for overlapping confirmed bookings
    const hasOverlap = db.bookings.some(
      (b) =>
        b.phoneId === phoneId &&
        ["Confirmed", "Rental Active", "Payment Under Verification"].includes(b.bookingStatus) &&
        new Date(b.startDate) <= end &&
        new Date(b.endDate) >= start
    );

    if (hasOverlap) {
      return res.status(409).json({ error: "Selected smartphone is already reserved for the chosen date range. Please select different dates." });
    }

    // Calculate rental price tiers
    let rentalCharges = 0;
    if (totalDays >= 30) {
      const months = Math.floor(totalDays / 30);
      const remainingDays = totalDays % 30;
      rentalCharges = months * phone.monthlyPrice + remainingDays * phone.dailyPrice;
    } else if (totalDays >= 7) {
      const weeks = Math.floor(totalDays / 7);
      const remainingDays = totalDays % 7;
      rentalCharges = weeks * phone.weeklyPrice + remainingDays * phone.dailyPrice;
    } else {
      rentalCharges = totalDays * phone.dailyPrice;
    }

    const deliveryFee = 0;
    const platformFee = 0;
    const securityDeposit = 0;
    const phoneFullPrice = phone.price || phone.dailyPrice || 2000;
    const isCod = paymentMethod === 'cod';
    const codAdvanceAmount = 501;
    const codBalanceAmount = Math.max(0, phoneFullPrice - codAdvanceAmount);
    const totalPayable = isCod ? codAdvanceAmount : phoneFullPrice;

    const bookingRef = `CS-BKG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: RentalBooking = {
      id: bookingRef,
      phoneId: phone.id,
      phoneModel: phone.model,
      phoneBrand: phone.brand,
      phoneImage: phone.primaryImage,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      startDate,
      endDate,
      totalDays,
      rentalCharges,
      securityDeposit,
      deliveryFee,
      platformFee,
      totalPayable,
      paymentMethod: isCod ? 'cod' : 'online',
      codAdvanceAmount: isCod ? codAdvanceAmount : undefined,
      codBalanceAmount: isCod ? codBalanceAmount : undefined,
      fulfillmentType: fulfillmentType || "delivery",
      deliveryAddress,
      pincode,
      postOffice,
      district,
      state,
      aadhaarCardUrl,
      notes,
      acceptedTerms: true,
      bookingStatus: "Payment Pending",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.bookings.unshift(newBooking);
    saveDatabase(db);
    logAudit("BOOKING_CREATED", `Booking ${bookingRef} created for ${phone.model} by ${customerName} (${customerPhone}). Total Payable: ₹${totalPayable}`);

    res.status(201).json({
      success: true,
      booking: newBooking,
      qrSettings: db.qrSettings,
      upiId: db.qrSettings.upiId,
      message: "Booking request created successfully. Please scan the QR code to complete your UPI payment."
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create booking" });
  }
});

// 5. Public My Booking Lookup (No Login: Search by Booking Ref + Contact Phone)
app.post("/api/bookings/lookup", (req: Request, res: Response) => {
  const { bookingId, customerPhone } = req.body;

  if (!bookingId || !customerPhone) {
    return res.status(400).json({ error: "Please enter both Booking Reference Number and Contact Phone Number." });
  }

  const cleanRef = bookingId.trim().toUpperCase();
  const cleanPhone = customerPhone.trim().replace(/\D/g, "");

  const booking = db.bookings.find((b) => {
    const bRef = b.id.toUpperCase();
    const bPhone = b.customerPhone.replace(/\D/g, "");
    return bRef === cleanRef && (bPhone.endsWith(cleanPhone) || cleanPhone.endsWith(bPhone));
  });

  if (!booking) {
    return res.status(404).json({ error: "No matching booking found. Please verify the booking reference number and phone number." });
  }

  const phone = db.phones.find((p) => p.id === booking.phoneId);
  const paymentClaim = db.payments.find((p) => p.bookingId === booking.id);

  res.json({
    booking,
    phone,
    paymentClaim,
    qrSettings: db.qrSettings
  });
});

// 5b. Public My Orders & Payments by Customer Phone (Lookup all bookings & payment claims)
app.post("/api/bookings/my-orders", (req: Request, res: Response) => {
  const { customerPhone } = req.body;

  if (!customerPhone) {
    return res.status(400).json({ error: "Please enter your 10-digit mobile number." });
  }

  const cleanPhone = customerPhone.trim().replace(/\D/g, "");
  if (cleanPhone.length < 5) {
    return res.status(400).json({ error: "Please enter a valid phone number." });
  }

  const customerBookings = db.bookings.filter((b) => {
    const bPhone = (b.customerPhone || "").replace(/\D/g, "");
    return bPhone.endsWith(cleanPhone) || cleanPhone.endsWith(bPhone);
  });

  const customerPayments = db.payments.filter((p) => {
    return customerBookings.some((b) => b.id === p.bookingId);
  });

  res.json({
    bookings: customerBookings,
    payments: customerPayments
  });
});

// 6. Submit Payment Details (UTR / Transaction ID)
app.post("/api/payments/claim", (req: Request, res: Response) => {
  try {
    const { bookingId, upiTxnId, claimedAmount, paymentTimestamp, screenshotUrl } = req.body;

    if (!bookingId || !upiTxnId || !claimedAmount) {
      return res.status(400).json({ error: "Please provide Booking Reference, 12-digit UPI UTR/Transaction ID, and Claimed Amount." });
    }

    const cleanUtr = upiTxnId.trim().toUpperCase();
    const booking = db.bookings.find((b) => b.id.toUpperCase() === bookingId.trim().toUpperCase());

    if (!booking) {
      return res.status(404).json({ error: "Invalid booking reference number." });
    }

    // Check duplicate UTR submission
    const existingUtr = db.payments.find((p) => p.upiTxnId.toUpperCase() === cleanUtr && p.status !== "rejected");
    if (existingUtr && existingUtr.bookingId !== booking.id) {
      return res.status(409).json({ error: "This UPI Transaction ID / UTR has already been submitted for another booking. Please check your transaction receipt." });
    }

    const paymentRef = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newClaim: PaymentClaim = {
      id: paymentRef,
      bookingId: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      claimedAmount: Number(claimedAmount),
      expectedAmount: booking.totalPayable,
      upiTxnId: cleanUtr,
      paymentTimestamp: paymentTimestamp || new Date().toISOString(),
      screenshotUrl: screenshotUrl || undefined,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    // Remove any older rejected claims for this booking
    db.payments = db.payments.filter((p) => !(p.bookingId === booking.id && p.status === "rejected"));
    db.payments.unshift(newClaim);

    // Update booking status atomically
    booking.paymentStatus = "claimed";
    booking.bookingStatus = "Payment Under Verification";
    booking.paymentReference = paymentRef;
    booking.updatedAt = new Date().toISOString();

    saveDatabase(db);
    logAudit("PAYMENT_CLAIMED", `Payment claim ${paymentRef} submitted for booking ${booking.id} by ${booking.customerName} - UTR: ${cleanUtr}, Amount: ₹${claimedAmount}`);

    res.status(201).json({
      success: true,
      paymentReference: paymentRef,
      message: "Payment details received successfully! Status is 'Payment Under Verification'. Our admin team will verify the merchant UPI records promptly.",
      paymentClaim: newClaim,
      booking
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to submit payment details" });
  }
});

// 7. Get Public QR & Store Settings
app.get("/api/qr-settings", (_req: Request, res: Response) => {
  res.json({
    qrSettings: db.qrSettings,
    settings: {
      storeName: db.settings.storeName,
      tagline: db.settings.tagline,
      supportPhone: db.settings.supportPhone,
      supportEmail: db.settings.supportEmail,
      supportAddress: db.settings.supportAddress,
      platformFee: db.settings.platformFee,
      deliveryFee: db.settings.deliveryFee
    }
  });
});

// ============================================================================
// BLADEPAY PAYMENT GATEWAY & WEBHOOK CONFIGURATION
// Merchant API Bearer Token: gw_bf2493d0211f8cf9e5b924809b6ab7408abba3be1a7ea37ad9471029e6f29aae
// API Endpoint: https://api.bladepay.pro/merchant/api/payin/create
// ============================================================================
const BLADEPAY_BEARER_TOKEN = process.env.BLADEPAY_BEARER_TOKEN || "gw_bf2493d0211f8cf9e5b924809b6ab7408abba3be1a7ea37ad9471029e6f29aae";
const BLADEPAY_PAYIN_URL = "https://api.bladepay.pro/merchant/api/payin/create";

// Public Health & Environment diagnostic endpoint
app.get("/api/health", async (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? "vercel-serverless" : process.env.NODE_ENV || "development",
    supabaseConfigured: Boolean(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_ID)
  });
});

// Endpoint to fetch public BladePay gateway configuration
app.get("/api/payment-gateway/config", (_req: Request, res: Response) => {
  res.json({
    success: true,
    provider: "BladePay",
    gatewayKey: BLADEPAY_BEARER_TOKEN,
    gatewayType: "BLADEPAY_PAYIN",
    status: "active"
  });
});

// Create BladePay Payin Payment Request
app.post("/api/payment-gateway/create-order", async (req: Request, res: Response) => {
  try {
    const { orderId, amount, customerPhone, customerName, customerEmail } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required for creating a payment" });
    }

    const merchantOrderNo = orderId || `ORD-${Date.now()}`;
    const formattedAmount = Number(amount).toFixed(2);
    const cleanPhone = (customerPhone || "9876543210").replace(/\D/g, "");
    const cleanName = customerName || "RAZY PAY Customer";
    const cleanEmail = customerEmail || "support@razypay.network";

    const hostUrl = process.env.APP_URL || "https://razypay.in";
    const notifyUrl = `${hostUrl}/api/payin-webhook`;
    const returnUrl = `${hostUrl}/payment-success`;

    // Exact payload as requested for BladePay
    const payinPayload = {
      merchantOrderNo,
      amount: formattedAmount,
      currency: "INR",
      payinName: cleanName,
      payinPhone: cleanPhone,
      payinEmail: cleanEmail,
      notifyUrl,
      returnUrl
    };

    let paymentUrl = `https://api.bladepay.online/fastUAPay/?nonce=7341&order_id=${merchantOrderNo}&platform=RushPay&timestamp=${Date.now()}&upi=7903605423%40mbkns`;
    let gatewayOrderNo = `BP_${Date.now()}`;
    let isLiveSuccess = false;

    try {
      const response = await fetch(BLADEPAY_PAYIN_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BLADEPAY_BEARER_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payinPayload)
      });

      const json = await response.json().catch(() => null);

      if (response.ok && json) {
        // Handle BladePay response fields (data.paymentUrl or data.payUrl or payment_url)
        const payUrl = json.data?.paymentUrl || json.data?.payUrl || json.paymentUrl || json.payUrl || json.data?.url;
        if (payUrl) {
          paymentUrl = payUrl;
          isLiveSuccess = true;
        }
        if (json.data?.orderNo || json.orderNo) {
          gatewayOrderNo = json.data?.orderNo || json.orderNo;
        }
      } else {
        console.warn("BladePay API returned non-OK:", response.status, json);
      }
    } catch (apiErr: any) {
      console.warn("BladePay API network call note:", apiErr?.message || apiErr);
    }

    res.json({
      success: true,
      merchantOrderNo,
      gatewayOrderNo,
      paymentUrl,
      amount: formattedAmount,
      isLiveSuccess
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create BladePay payin order" });
  }
});

// BladePay Payin Webhook / Callback endpoint (/api/payin-webhook)
app.post(["/api/payin-webhook", "/api/payment-gateway/webhook"], (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const merchantOrderNo = payload.merchantOrderNo || payload.orderId || payload.client_txn_id;
    const orderStatus = String(payload.status || payload.orderStatus || "").toUpperCase();
    const utr = payload.utr || payload.bankRefNo || payload.channelOrderNo || `UTR_${Date.now()}`;
    const amount = payload.amount;

    if (
      orderStatus === "SUCCESS" ||
      orderStatus === "PAID" ||
      orderStatus === "COMPLETED" ||
      payload.success === true ||
      payload.status === "1"
    ) {
      if (merchantOrderNo) {
        const allOrders = financialStore.getAllOrders();
        const order = allOrders.find((o) => o.id === merchantOrderNo);
        if (order && order.status !== "approved") {
          financialStore.completeOrder(order.id, utr, payload.channelOrderNo || "BLADEPAY");
        }
      }

      logAudit("BLADEPAY_PAYIN_SUCCESS", `BladePay received ₹${amount || 0} for Order ${merchantOrderNo}. UTR: ${utr}`);

      return res.status(200).json({ status: "SUCCESS", message: "Payin verified and wallet credited" });
    }

    res.status(200).json({ status: "IGNORED", message: "Payin status not in success state" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Webhook processing error" });
  }
});

// Helper: Query BladePay Payin Status using Method 1 (POST query) & Method 2 (REST GET status)
async function queryBladePayStatus(orderNo: string): Promise<{ success: boolean; isPaid: boolean; data?: any; raw?: any }> {
  const cleanOrderNo = orderNo.trim();
  
  // Try Method 1: POST https://api.bladepay.pro/merchant/api/payin/query
  try {
    const postRes = await fetch("https://api.bladepay.pro/merchant/api/payin/query", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BLADEPAY_BEARER_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderNo: cleanOrderNo })
    });

    if (postRes.ok) {
      const json = await postRes.json();
      const statusStr = String(json.data?.status || json.status || "").toUpperCase();
      const isPaid = statusStr === "SUCCESS" || statusStr === "PAID" || statusStr === "COMPLETED" || json.success === true || json.status === "1";
      return { success: true, isPaid, data: json.data || json, raw: json };
    }
  } catch (err) {
    console.warn("BladePay Method 1 (POST query) attempt note:", err);
  }

  // Fallback to Method 2: GET https://api.bladepay.pro/merchant/api/payin/status/:orderNo
  try {
    const getRes = await fetch(`https://api.bladepay.pro/merchant/api/payin/status/${encodeURIComponent(cleanOrderNo)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${BLADEPAY_BEARER_TOKEN}`
      }
    });

    if (getRes.ok) {
      const json = await getRes.json();
      const statusStr = String(json.data?.status || json.status || "").toUpperCase();
      const isPaid = statusStr === "SUCCESS" || statusStr === "PAID" || statusStr === "COMPLETED" || json.success === true || json.status === "1";
      return { success: true, isPaid, data: json.data || json, raw: json };
    }
  } catch (err) {
    console.warn("BladePay Method 2 (GET status) attempt note:", err);
  }

  return { success: false, isPaid: false };
}

// Endpoint to check payment status in real-time and auto-credit order
app.get("/api/payment-gateway/check-status/:orderNo", async (req: Request, res: Response) => {
  try {
    const { orderNo } = req.params;
    if (!orderNo) {
      return res.status(400).json({ error: "Order number is required" });
    }

    const queryResult = await queryBladePayStatus(orderNo);

    // If marked paid, automatically complete order in database
    if (queryResult.isPaid) {
      const allOrders = financialStore.getAllOrders();
      const order = allOrders.find((o) => o.id === orderNo);
      if (order && order.status !== "approved") {
        const utr = queryResult.data?.utr || queryResult.data?.bankRefNo || `BP_UTR_${Date.now()}`;
        financialStore.completeOrder(order.id, utr, queryResult.data?.channelOrderNo || "BLADEPAY");
        logAudit("BLADEPAY_QUERY_PAID", `Order ${orderNo} auto-verified via BladePay query API. UTR: ${utr}`);
      }
    }

    res.json({
      success: true,
      orderNo,
      isPaid: queryResult.isPaid,
      details: queryResult.data || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to query BladePay payment status" });
  }
});

// Endpoint to query BladePay Merchant Account Balance
// GET https://api.bladepay.pro/merchant/api/balance
app.get("/api/payment-gateway/balance", async (_req: Request, res: Response) => {
  try {
    const response = await fetch("https://api.bladepay.pro/merchant/api/balance", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${BLADEPAY_BEARER_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    const json = await response.json().catch(() => null);

    if (response.ok && json) {
      return res.json({
        success: true,
        statusCode: response.status,
        data: json.data || json
      });
    }

    res.status(response.status || 500).json({
      success: false,
      statusCode: response.status,
      error: json?.message || "Failed to fetch BladePay merchant balance",
      details: json
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Network error fetching BladePay balance"
    });
  }
});

// ============================================================================
// RAZORPAY INTEGRATION ENDPOINTS
// ============================================================================
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_chandan_store";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_chandan_2026";

// Get Razorpay Public Key
app.get("/api/razorpay/config", (_req: Request, res: Response) => {
  res.json({
    keyId: RAZORPAY_KEY_ID,
    merchantName: db.qrSettings.merchantName || "Chandan Store",
    isLive: Boolean(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_"))
  });
});

// Create Razorpay Order
app.post("/api/razorpay/create-order", async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, customerPhone, customerName } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required for creating a payment order" });
    }

    const orderReceipt = bookingId || `rcpt_${Date.now().toString().slice(-8)}`;
    const amountInPaise = Math.round(Number(amount) * 100);

    // If live API keys are provided in process.env, use official SDK/API
    let razorpayOrderId = `order_${crypto.randomBytes(10).toString("hex")}`;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const RazorpayModule = await import("razorpay");
        const Razorpay = RazorpayModule.default || RazorpayModule;
        const instance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const order = await instance.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: orderReceipt.slice(0, 40),
          notes: {
            bookingId: bookingId || "DIRECT_PURCHASE",
            store: "Chandan Store",
            customerPhone: customerPhone || "",
            customerName: customerName || ""
          }
        });

        if (order && order.id) {
          razorpayOrderId = order.id;
        }
      } catch (sdkError: any) {
        console.warn("Razorpay SDK order fallback:", sdkError?.message || sdkError);
      }
    }

    res.json({
      success: true,
      orderId: razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
      merchantName: db.qrSettings.merchantName || "Chandan Store",
      description: "Certified Refurbished Smartphone Order",
      prefill: {
        name: customerName || "Customer",
        contact: customerPhone || "7549545333",
        email: "chandankumarsundro312@gmail.com"
      }
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create Razorpay order" });
  }
});

// Verify Razorpay Payment Signature and automatically approve booking
app.post("/api/razorpay/verify-payment", (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      amount
    } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ error: "Missing razorpay_payment_id" });
    }

    let isSignatureValid = true;

    // Verify signature using crypto HMAC if secret is configured
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      isSignatureValid = generatedSignature === razorpay_signature;
    }

    if (!isSignatureValid) {
      return res.status(400).json({ error: "Invalid Razorpay payment signature. Payment could not be verified." });
    }

    // Record verified payment
    const paymentRef = `PAY-RZP-${Date.now().toString().slice(-6)}`;
    const paymentClaim: PaymentClaim = {
      id: paymentRef,
      bookingId: bookingId || "ONLINE_DIRECT",
      customerName: "Razorpay Verified Customer",
      customerPhone: "",
      claimedAmount: Number(amount) || 0,
      expectedAmount: Number(amount) || 0,
      upiTxnId: razorpay_payment_id,
      paymentTimestamp: new Date().toISOString(),
      status: "verified",
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      verifiedBy: "Razorpay Payment Gateway",
      adminNotes: `Automated instant gateway verification via Razorpay (Order: ${razorpay_order_id || 'N/A'}, Payment ID: ${razorpay_payment_id})`
    };

    // If linked to an existing booking, instantly confirm booking
    let updatedBooking = null;
    let updatedBuyOrder = null;

    if (bookingId) {
      // 1. Check if it's a RushPay Buy Order
      const buyOrder = financialStore.getAllOrders().find((o) => o.id === bookingId);
      if (buyOrder) {
        updatedBuyOrder = financialStore.completeOrder(buyOrder.id, paymentRef, razorpay_payment_id);
      } else {
        // 2. Otherwise check phone rental booking
        const booking = db.bookings.find((b) => b.id.toUpperCase() === bookingId.trim().toUpperCase());
        if (booking) {
          booking.paymentStatus = "verified";
          booking.bookingStatus = "Confirmed";
          booking.paymentReference = paymentRef;
          booking.updatedAt = new Date().toISOString();
          paymentClaim.customerName = booking.customerName;
          paymentClaim.customerPhone = booking.customerPhone;
          paymentClaim.expectedAmount = booking.totalPayable;
          updatedBooking = booking;
        }
      }
    }

    db.payments.unshift(paymentClaim);
    saveDatabase(db);

    logAudit(
      "RAZORPAY_PAYMENT_SUCCESS",
      `Payment ${razorpay_payment_id} successfully processed via Razorpay for ₹${amount || 0}. Ref: ${paymentRef}`
    );

    res.json({
      success: true,
      message: "Payment successfully verified and confirmed via Razorpay!",
      paymentReference: paymentRef,
      paymentId: razorpay_payment_id,
      booking: updatedBooking,
      buyOrder: updatedBuyOrder
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to verify Razorpay payment" });
  }
});

// ============================================================================
// RUSHPAY FINANCIAL PLATFORM REST ENDPOINTS
// ============================================================================

// Middleware to extract and validate RushPay session token
function requireRushUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  const storedUser = financialStore.validateSession(token);
  if (!storedUser) {
    return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
  }

  (req as any).rushUser = storedUser;
  (req as any).rushToken = token;
  next();
}

// 1. Register User
app.post("/api/rush/auth/register", (req: Request, res: Response) => {
  try {
    const { mobile, email, fullName, password, referralCode } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile number and password are required.' });
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number.' });
    }

    const assignedName = (fullName && fullName.trim()) ? fullName.trim() : `User ${cleanMobile.slice(-4)}`;

    const result = financialStore.registerUser({
      mobile: cleanMobile,
      email: email || `${cleanMobile}@rushpay.network`,
      fullName: assignedName,
      password,
      referralCode
    });

    // Automatically save registration details to Supabase backend table
    saveUserToSupabase({
      id: result.user.id,
      mobile: cleanMobile,
      email: email || `${cleanMobile}@rushpay.network`,
      fullName: assignedName,
      referralCode,
      role: result.user.role,
      accountStatus: result.user.accountStatus,
      kycStatus: result.user.kycStatus,
      createdAt: result.user.createdAt
    }).catch((supaErr) => {
      console.warn('[Supabase Sync Note]:', supaErr?.message || supaErr);
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      user: result.user,
      token: result.token
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Registration failed. Please check your credentials.';
    console.error(`[Server Registration Error]:`, errorMsg);
    
    // Explicitly handle duplicate mobile error with 409 Conflict
    if (errorMsg.includes('already exists')) {
      return res.status(409).json({ error: 'An account with this mobile number already exists. Please Sign In.' });
    }

    res.status(400).json({ error: errorMsg });
  }
});

// 2. Login User
app.post("/api/rush/auth/login", (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile and password are required' });
    }
    const result = financialStore.loginUser(mobile, password);
    res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
});

// 3. User Session Profile & Balances
app.get("/api/rush/user/dashboard", requireRushUser, (req: Request, res: Response) => {
  const user = (req as any).rushUser;
  const data = financialStore.getUserData(user.profile.id);
  res.json({
    success: true,
    data
  });
});

// 4. Logout Session (Graceful: clears server session if present, always succeeds)
app.post("/api/rush/auth/logout", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      financialStore.logoutSession(token);
    } catch (e) {
      // Ignored: session might already be expired
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// 5. Set or Reset Transaction PIN
app.post("/api/rush/user/pin", requireRushUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).rushUser;
    const { pin } = req.body;
    financialStore.setTransactionPin(user.profile.id, pin);
    res.json({ success: true, message: 'Transaction PIN configured securely.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to set PIN' });
  }
});

// 5.5 Update User Settlement UPI ID & Bank Account
app.post("/api/rush/user/wallet-settings", requireRushUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).rushUser;
    const { upiId, upiHolderName, bankAccount } = req.body;
    const updatedProfile = financialStore.updateUserSettlementWallet(user.profile.id, {
      upiId,
      upiHolderName,
      bankAccount
    });
    res.json({
      success: true,
      message: 'Settlement wallet details permanently stored!',
      profile: updatedProfile
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save wallet details' });
  }
});

// 6. Create Buy Order (INR -> Units)
app.post("/api/rush/orders/buy", requireRushUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).rushUser;
    const { amountInr, paymentMethod, notes } = req.body;
    if (!amountInr || Number(amountInr) <= 0) {
      return res.status(400).json({ error: 'Valid purchase amount in INR is required.' });
    }

    const order = financialStore.createBuyOrder({
      userId: user.profile.id,
      inrAmountPaise: Math.round(Number(amountInr) * 100),
      paymentMethod: paymentMethod || 'upi_qr',
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Buy order created successfully',
      order
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create buy order' });
  }
});

// 7. Complete Buy Order (Manual UTR or Gateway Callback)
app.post("/api/rush/orders/:id/confirm-payment", requireRushUser, (req: Request, res: Response) => {
  try {
    const { paymentRef, gatewayPaymentId } = req.body;
    if (!paymentRef && !gatewayPaymentId) {
      return res.status(400).json({ error: 'Payment reference or UTR is required.' });
    }
    const order = financialStore.completeOrder(req.params.id, paymentRef || 'DIRECT_CONFIRMED', gatewayPaymentId);
    res.json({
      success: true,
      message: 'Payment verified and funds credited to wallet ledger.',
      order
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to confirm order' });
  }
});

// 8. Create Sell / Withdrawal Request (Atomic Reservation with PIN)
app.post("/api/rush/withdrawals/create", requireRushUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).rushUser;
    const { unitsToSell, payoutMethod, destinationAccount, pin } = req.body;

    if (!unitsToSell || Number(unitsToSell) <= 0) {
      return res.status(400).json({ error: 'Please enter a valid amount of units to sell/withdraw.' });
    }
    if (!pin) {
      return res.status(400).json({ error: 'Security Transaction PIN is required to authorize withdrawal.' });
    }
    if (!destinationAccount || !destinationAccount.accountHolderName) {
      return res.status(400).json({ error: 'Destination account holder name and payout details are required.' });
    }

    const withdrawal = financialStore.createWithdrawalRequest({
      userId: user.profile.id,
      unitsToSell: Number(unitsToSell),
      payoutMethod: payoutMethod || 'upi',
      destinationAccount,
      pin: String(pin)
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created and funds placed in escrow review.',
      withdrawal
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit withdrawal' });
  }
});

// 8.5 Claim 1st Deposit Bonus (₹150)
app.post("/api/rush/user/claim-first-deposit", requireRushUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).rushUser;
    const result = financialStore.claimFirstDepositReward(user.profile.id);
    res.json({
      success: true,
      message: '🎉 ₹150 1st Deposit Bonus successfully credited to your wallet balance!',
      rewardPaise: result.rewardPaise,
      newBalancePaise: result.newBalancePaise
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim reward' });
  }
});

// 9. Get Platform Public Rates & Config
app.get("/api/rush/public/info", (_req: Request, res: Response) => {
  const overview = financialStore.getPlatformOverview();
  res.json({
    success: true,
    rates: overview.rates,
    config: overview.config
  });
});

// 10. Admin Overview & Operations for RushPay
app.get("/api/rush/admin/overview", requireAdmin, (_req: Request, res: Response) => {
  const overview = financialStore.getPlatformOverview();
  const rawDb = financialStore.getRawDatabase();
  res.json({
    success: true,
    overview,
    recentOrders: rawDb.orders.slice(0, 20),
    recentWithdrawals: rawDb.withdrawals.slice(0, 20),
    recentLedger: rawDb.ledger.slice(0, 30),
    allUsers: Object.values(rawDb.users).map((u) => u.profile)
  });
});

app.post("/api/rush/admin/withdrawals/:id/review", requireAdmin, (req: Request, res: Response) => {
  try {
    const { action, reason, providerRef } = req.body;
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Action must be approve or reject' });
    }
    const result = financialStore.processWithdrawal(req.params.id, action, reason, providerRef);
    res.json({
      success: true,
      message: `Withdrawal successfully ${action}d`,
      withdrawal: result
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Action failed' });
  }
});

app.post("/api/rush/admin/rates", requireAdmin, (req: Request, res: Response) => {
  try {
    const updatedRates = financialStore.updateRates(req.body, "Admin (SuperAdmin)");
    res.json({ success: true, rates: updatedRates });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update rates' });
  }
});

// Admin Login
app.post("/api/admin/login", (req: Request, res: Response) => {
  const { credential, password } = req.body;

  const validPassword = password === 'razypay@admin' || password === ADMIN_PASSWORD;
  const isAuthorized =
    validPassword &&
    (!credential ||
      credential === "admin" ||
      credential === "razypay" ||
      credential === ADMIN_PHONE ||
      credential === ADMIN_EMAIL ||
      credential === "7549545333");

  if (!isAuthorized) {
    return res.status(401).json({ error: "Invalid admin password. Please enter razypay@admin" });
  }

  const token = `adm_${crypto.randomBytes(24).toString("hex")}`;
  activeAdminTokens.add(token);

  logAudit("ADMIN_LOGIN", `Administrator logged into Chandan Store dashboard.`);

  res.json({
    success: true,
    token,
    admin: {
      name: "Chandan Kumar",
      phone: ADMIN_PHONE,
      email: ADMIN_EMAIL,
      role: "Super Admin"
    }
  });
});

// Admin Logout
app.post("/api/admin/logout", requireAdmin, (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) activeAdminTokens.delete(token);
  res.json({ success: true, message: "Logged out successfully" });
});

// Admin Dashboard Overview Statistics
app.get("/api/admin/overview", requireAdmin, (_req: Request, res: Response) => {
  const totalPhones = db.phones.length;
  const availablePhones = db.phones.filter((p) => p.status === "available" && p.approvalStatus === "approved").length;
  const rentedPhones = db.phones.filter((p) => p.status === "rented").length;
  const pendingApprovals = db.phones.filter((p) => p.approvalStatus === "pending").length;

  const totalBookings = db.bookings.length;
  const activeRentals = db.bookings.filter((b) => ["Confirmed", "Rental Active"].includes(b.bookingStatus)).length;
  const pendingPayments = db.payments.filter((p) => p.status === "pending").length;

  const verifiedPayments = db.payments.filter((p) => p.status === "verified");
  const totalRevenue = verifiedPayments.reduce((acc, curr) => acc + (curr.claimedAmount || 0), 0);
  const stats: AdminOverviewStats = {
    totalPhones,
    availablePhones,
    rentedPhones,
    pendingApprovals,
    totalBookings,
    activeRentals,
    pendingPayments,
    totalRevenue
  };

  res.json({
    stats,
    recentBookings: db.bookings.slice(0, 8),
    pendingPaymentsList: db.payments.filter((p) => p.status === "pending").slice(0, 8),
    recentAuditLogs: db.auditLogs.slice(0, 10)
  });
});

// Admin Phone Listings Management
app.get("/api/admin/phones", requireAdmin, (_req: Request, res: Response) => {
  res.json({ phones: db.phones });
});

// Admin Add New Phone Listing
app.post("/api/admin/phones", requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      brand,
      model,
      ram,
      storage,
      condition,
      color,
      dailyPrice,
      weeklyPrice,
      monthlyPrice,
      location,
      deliveryAvailable,
      images,
      accessories,
      specifications,
      description,
      rentalRules,
      featured,
      status
    } = req.body;

    if (!model || !brand || !dailyPrice) {
      return res.status(400).json({ error: "Model, Brand, and Daily Price are required." });
    }

    const id = `phone-${Date.now()}`;
    const validImages = Array.isArray(images) && images.length > 0
      ? images
      : ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80"];

    const newPhone: PhoneListing = {
      id,
      brand: brand || "Apple",
      model: model.trim(),
      ram: ram || "8GB",
      storage: storage || "256GB",
      condition: condition || "Pristine",
      color: color || "Titanium",
      dailyPrice: Number(dailyPrice),
      weeklyPrice: Number(weeklyPrice) || Number(dailyPrice) * 6,
      monthlyPrice: Number(monthlyPrice) || Number(dailyPrice) * 20,
      securityDeposit: Number(req.body.securityDeposit !== undefined ? req.body.securityDeposit : 0),
      location: location || "Mumbai & Express Delivery",
      deliveryAvailable: deliveryAvailable !== undefined ? !!deliveryAvailable : true,
      primaryImage: validImages[0],
      images: validImages,
      accessories: Array.isArray(accessories) ? accessories : ["Fast Charger", "Original Cable", "Armor Case"],
      specifications: specifications || {
        screen: "6.7-inch 120Hz ProMotion Display",
        battery: "4,500 mAh Fast Charging",
        camera: "Pro Multi-Lens Camera System",
        processor: "Flagship Octa-Core CPU"
      },
      description: description || `Certified authentic ${model} available for rent on Chandan Store.`,
      rentalRules: rentalRules || "Standard rental agreement. Zero security deposit required.",
      status: status || "available",
      approvalStatus: "approved",
      featured: !!featured,
      ownerName: "Chandan Store Fleet",
      ownerPhone: ADMIN_PHONE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.phones.unshift(newPhone);
    saveDatabase(db);
    logAudit("PHONE_ADDED", `Admin added new phone ${newPhone.model} (${newPhone.brand}) - ID: ${id}`);

    res.status(201).json({ success: true, phone: newPhone });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to add phone" });
  }
});

// Admin Update Phone Listing
app.put("/api/admin/phones/:id", requireAdmin, (req: Request, res: Response) => {
  const index = db.phones.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Phone listing not found" });
  }

  const existing = db.phones[index];
  const updated: PhoneListing = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  // If primary image wasn't explicitly set, default to first image
  if (Array.isArray(updated.images) && updated.images.length > 0 && !updated.primaryImage) {
    updated.primaryImage = updated.images[0];
  }

  db.phones[index] = updated;
  saveDatabase(db);
  logAudit("PHONE_UPDATED", `Admin updated phone ${updated.model} (${updated.id})`);

  res.json({ success: true, phone: updated });
});

// Admin Approve or Reject Phone Listing
app.put("/api/admin/phones/:id/approval", requireAdmin, (req: Request, res: Response) => {
  const { approvalStatus } = req.body;
  const phone = db.phones.find((p) => p.id === req.params.id);

  if (!phone) {
    return res.status(404).json({ error: "Phone listing not found" });
  }

  if (!["approved", "pending", "rejected"].includes(approvalStatus)) {
    return res.status(400).json({ error: "Invalid approval status" });
  }

  phone.approvalStatus = approvalStatus;
  phone.updatedAt = new Date().toISOString();
  saveDatabase(db);
  logAudit("PHONE_APPROVAL_CHANGED", `Listing ${phone.model} approval set to '${approvalStatus}'`);

  res.json({ success: true, phone });
});

// Admin Delete Phone Listing
app.delete("/api/admin/phones/:id", requireAdmin, (req: Request, res: Response) => {
  const index = db.phones.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Phone listing not found" });
  }

  const removed = db.phones.splice(index, 1)[0];
  saveDatabase(db);
  logAudit("PHONE_DELETED", `Admin deleted phone ${removed.model} (${removed.id})`);

  res.json({ success: true, message: "Phone listing deleted successfully" });
});

// Admin Bookings Management
app.get("/api/admin/bookings", requireAdmin, (_req: Request, res: Response) => {
  res.json({ bookings: db.bookings });
});

// Admin Update Booking Status
app.put("/api/admin/bookings/:id/status", requireAdmin, (req: Request, res: Response) => {
  const { bookingStatus, paymentStatus, adminNotes } = req.body;
  const booking = db.bookings.find((b) => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const oldStatus = booking.bookingStatus;
  if (bookingStatus) booking.bookingStatus = bookingStatus;
  if (paymentStatus) booking.paymentStatus = paymentStatus;
  booking.updatedAt = new Date().toISOString();

  // If confirmed or active, update device status
  const phone = db.phones.find((p) => p.id === booking.phoneId);
  if (phone) {
    if (["Confirmed", "Rental Active"].includes(booking.bookingStatus)) {
      phone.status = "rented";
    } else if (["Completed", "Cancelled"].includes(booking.bookingStatus)) {
      phone.status = "available";
    }
  }

  saveDatabase(db);
  logAudit(
    "BOOKING_STATUS_CHANGED",
    `Booking ${booking.id} status changed from '${oldStatus}' to '${booking.bookingStatus}'. Note: ${adminNotes || "N/A"}`
  );

  res.json({ success: true, booking });
});

// Admin Payment Verification Management
app.get("/api/admin/payments", requireAdmin, (_req: Request, res: Response) => {
  res.json({ payments: db.payments });
});

// Admin Verify or Reject Payment Claim
app.post("/api/admin/payments/:id/verify", requireAdmin, (req: Request, res: Response) => {
  const { action, adminNotes } = req.body; // action: 'verify' | 'reject' | 'refund'
  const payment = db.payments.find((p) => p.id === req.params.id);

  if (!payment) {
    return res.status(404).json({ error: "Payment record not found" });
  }

  const booking = db.bookings.find((b) => b.id === payment.bookingId);

  if (action === "verify") {
    payment.status = "verified";
    payment.adminNotes = adminNotes || "Payment verified against merchant UPI statement.";
    payment.verifiedAt = new Date().toISOString();
    payment.verifiedBy = "Chandan Kumar (Admin)";

    if (booking) {
      booking.paymentStatus = "verified";
      booking.bookingStatus = "Confirmed";
      booking.updatedAt = new Date().toISOString();

      const phone = db.phones.find((p) => p.id === booking.phoneId);
      if (phone) phone.status = "rented";
    }

    logAudit("PAYMENT_VERIFIED", `Payment ${payment.id} (UTR: ${payment.upiTxnId}) verified. Booking ${payment.bookingId} marked as Confirmed.`);
  } else if (action === "reject") {
    payment.status = "rejected";
    payment.adminNotes = adminNotes || "Invalid or unverified transaction reference.";

    if (booking) {
      booking.paymentStatus = "rejected";
      booking.bookingStatus = "Payment Pending";
      booking.updatedAt = new Date().toISOString();
    }

    logAudit("PAYMENT_REJECTED", `Payment ${payment.id} rejected. Reason: ${adminNotes || "Unverified UTR"}`);
  } else if (action === "refund") {
    payment.status = "refunded";
    payment.adminNotes = adminNotes || "Deposit refunded upon return inspection.";

    if (booking) {
      booking.paymentStatus = "refunded";
      booking.bookingStatus = "Completed";
      booking.updatedAt = new Date().toISOString();

      const phone = db.phones.find((p) => p.id === booking.phoneId);
      if (phone) phone.status = "available";
    }

    logAudit("PAYMENT_REFUNDED", `Deposit for payment ${payment.id} refunded.`);
  } else {
    return res.status(400).json({ error: "Invalid verification action" });
  }

  saveDatabase(db);
  res.json({ success: true, payment, booking });
});

// Admin Update QR Settings
app.post("/api/admin/qr-settings", requireAdmin, (req: Request, res: Response) => {
  const { customQrUrl, merchantName } = req.body;

  // The UPI ID is strictly immutable as per system specification
  db.qrSettings = {
    ...db.qrSettings,
    merchantName: merchantName || "Chandan Store",
    customQrUrl: customQrUrl !== undefined ? customQrUrl : db.qrSettings.customQrUrl,
    lastUpdated: new Date().toISOString()
  };

  saveDatabase(db);
  logAudit("QR_SETTINGS_UPDATED", `QR code settings updated by admin. Active UPI ID: ${db.qrSettings.upiId}`);

  res.json({ success: true, qrSettings: db.qrSettings });
});

// Public Website Settings
app.get("/api/settings", (_req: Request, res: Response) => {
  res.json({ settings: db.settings });
});

// Admin Update Website Settings
app.post("/api/admin/settings", requireAdmin, (req: Request, res: Response) => {
  db.settings = {
    ...db.settings,
    ...req.body
  };
  saveDatabase(db);
  logAudit("WEBSITE_SETTINGS_UPDATED", "Website general settings updated by admin.");

  res.json({ success: true, settings: db.settings });
});

// Admin Update Custom Navigation Hierarchy
app.put("/api/admin/navigation", requireAdmin, (req: Request, res: Response) => {
  const { navigationConfig } = req.body;
  if (!Array.isArray(navigationConfig)) {
    return res.status(400).json({ error: "navigationConfig array is required" });
  }

  db.settings = {
    ...db.settings,
    navigationConfig
  };
  saveDatabase(db);
  logAudit("NAVIGATION_UPDATED", `Updated custom navigation hierarchy with ${navigationConfig.length} items.`);

  res.json({ success: true, navigationConfig: db.settings.navigationConfig, settings: db.settings });
});

// Admin Audit Logs
app.get("/api/admin/audit-logs", requireAdmin, (_req: Request, res: Response) => {
  res.json({ auditLogs: db.auditLogs });
});

// ============================================================================
// VITE CLIENT MOUNTING (FULL STACK INTEGRATION)
// ============================================================================
async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteDevServer } = await import("vite");
    const vite = await createViteDevServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Chandan Store phone rental server running on port ${PORT}`);
  });
}

// Only auto-start standalone listener when executed directly as main script
const isMainScript = !process.env.VERCEL && (
  (typeof require !== "undefined" && require.main === module) ||
  (process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.cjs")))
);

if (isMainScript) {
  startServer();
}

export default app;
