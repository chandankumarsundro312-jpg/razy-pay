export type PhoneBrand = 'Apple' | 'Samsung' | 'OnePlus' | 'Google' | 'Other Android';

export type PhoneCondition = 'Pristine' | 'Like New' | 'Excellent' | 'Good';

export interface PhoneSpecifications {
  screen: string;
  battery: string;
  camera: string;
  processor: string;
}

export interface PhoneColorVariant {
  name: string;
  hex: string;
  image: string;
  inStock?: boolean;
}

export interface PhoneListing {
  id: string;
  brand: PhoneBrand;
  model: string;
  ram: string;
  storage: string;
  condition: PhoneCondition;
  color: string;
  availableColors?: PhoneColorVariant[];
  availableStorage?: string[];
  price?: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  securityDeposit?: number;
  location: string;
  deliveryAvailable: boolean;
  primaryImage: string;
  images: string[];
  accessories: string[];
  specifications: PhoneSpecifications;
  description: string;
  rentalRules: string;
  status: 'available' | 'rented' | 'maintenance';
  approvalStatus: 'approved' | 'pending' | 'rejected';
  featured: boolean;
  ownerName: string;
  ownerPhone: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'Booking Requested'
  | 'Awaiting Approval'
  | 'Payment Pending'
  | 'Payment Under Verification'
  | 'Confirmed'
  | 'Rental Active'
  | 'Return Pending'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed';

export type PaymentStatus = 'unpaid' | 'claimed' | 'verified' | 'rejected' | 'refunded';

export interface RentalBooking {
  id: string;
  phoneId: string;
  phoneModel: string;
  phoneBrand: string;
  phoneImage: string;
  customerName: string;
  customerPhone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  rentalCharges: number;
  securityDeposit?: number;
  deliveryFee: number;
  platformFee: number;
  totalPayable: number;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  pincode?: string;
  postOffice?: string;
  district?: string;
  state?: string;
  aadhaarCardUrl?: string; // Mandatory Aadhaar card verification doc
  notes?: string;
  acceptedTerms: boolean;
  bookingStatus: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: 'online' | 'cod';
  codAdvanceAmount?: number;
  codBalanceAmount?: number;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentClaim {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  claimedAmount: number;
  expectedAmount: number;
  upiTxnId: string; // 12-digit UTR
  paymentTimestamp: string;
  screenshotUrl?: string;
  status: 'pending' | 'verified' | 'rejected' | 'refunded';
  adminNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface QrSettings {
  upiId: string;
  merchantName: string;
  customQrUrl?: string;
  lastUpdated: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminUser: string;
}

export interface CustomNavItemConfig {
  id: string;
  label: string;
  hash: string;
  category: 'main-nav' | 'rental-payments' | 'info-support';
  order: number;
  visible: boolean;
  iconName?: string;
  badge?: string;
  badgeColor?: string;
  type: 'section' | 'modal' | 'admin' | 'filter';
  description?: string;
}

export interface WebsiteSettings {
  storeName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  supportAddress: string;
  platformFee: number;
  deliveryFee: number;
  termsContent?: string;
  navigationConfig?: CustomNavItemConfig[];
}

export interface CartItem {
  phone: PhoneListing;
  selectedColor?: string;
  selectedStorage?: string;
  quantity: number;
  addedAt: string;
}

export interface AdminOverviewStats {
  totalPhones: number;
  availablePhones: number;
  rentedPhones: number;
  pendingApprovals: number;
  totalBookings: number;
  activeRentals: number;
  pendingPayments: number;
  totalRevenue: number;
  totalDepositsHeld?: number;
}
