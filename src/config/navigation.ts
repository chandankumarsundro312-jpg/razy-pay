import {
  Home,
  Sparkles,
  Smartphone,
  Search,
  CreditCard,
  Upload,
  CheckCircle2,
  User,
  Layers,
  ShieldCheck,
  HelpCircle,
  FileText,
  PlusCircle,
  MapPin,
  LayoutDashboard,
  Calendar,
  CheckCheck,
  QrCode,
  ShieldAlert,
  Clock,
  RotateCcw,
  Info,
  PhoneCall,
  Mail,
  FileCheck,
  Receipt,
  Lock,
  MessageSquare,
  Repeat,
  Shield,
  SlidersHorizontal,
  ShoppingBag,
  ShoppingCart,
  type LucideIcon
} from 'lucide-react';
import { CustomNavItemConfig } from '../types';

export interface NavItem {
  id: string;
  label: string;
  hash: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  type: 'section' | 'modal' | 'admin' | 'filter';
  description?: string;
  requiresAdmin?: boolean;
  category?: 'main-nav' | 'rental-payments' | 'info-support' | 'admin-portal';
  order?: number;
  visible?: boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

// Icon dictionary to easily map string names to icons
export const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Sparkles,
  Smartphone,
  Search,
  CreditCard,
  Upload,
  CheckCircle2,
  User,
  Layers,
  ShieldCheck,
  HelpCircle,
  FileText,
  PlusCircle,
  MapPin,
  LayoutDashboard,
  Calendar,
  CheckCheck,
  QrCode,
  ShieldAlert,
  Clock,
  RotateCcw,
  Info,
  PhoneCall,
  Mail,
  FileCheck,
  Receipt,
  Lock,
  MessageSquare,
  Repeat,
  Shield,
  SlidersHorizontal,
  ShoppingBag,
  ShoppingCart
};

export function getIcon(name?: string, fallback: LucideIcon = Smartphone): LucideIcon {
  if (!name) return fallback;
  return ICON_MAP[name] || fallback;
}

// Complete Master Default Navigation Configuration
export const DEFAULT_NAV_CONFIG: CustomNavItemConfig[] = [
  // =========================================================================
  // 1. MAIN NAVIGATION SECTIONS (main-nav)
  // =========================================================================
  {
    id: 'home',
    label: 'Home',
    hash: '#home',
    category: 'main-nav',
    order: 1,
    visible: true,
    iconName: 'Home',
    badge: 'Storefront',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    type: 'section',
    description: 'Landing hero, quick search, brand filters'
  },
  {
    id: 'explore',
    label: 'All Refurbished Phones',
    hash: '#explore',
    category: 'main-nav',
    order: 2,
    visible: false,
    iconName: 'Smartphone',
    badge: 'Refurbished',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    type: 'section',
    description: 'Browse all certified refurbished flagship smartphones'
  },
  {
    id: 'iphones',
    label: 'iPhone',
    hash: '#iphones',
    category: 'main-nav',
    order: 3,
    visible: false,
    iconName: 'Smartphone',
    badge: 'All Gen',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    type: 'filter',
    description: 'Apple iPhone 12 to 16/17 Series, Pro, Max, Mini & Air'
  },
  {
    id: 'samsung',
    label: 'Samsung',
    hash: '#samsung',
    category: 'main-nav',
    order: 4,
    visible: false,
    iconName: 'Smartphone',
    badge: 'Galaxy',
    type: 'filter',
    description: 'Galaxy S25 Ultra, S24, Z Fold & Flip certified flagships'
  },
  {
    id: 'oneplus',
    label: 'OnePlus',
    hash: '#oneplus',
    category: 'main-nav',
    order: 5,
    visible: false,
    iconName: 'Smartphone',
    badge: 'Flagship',
    type: 'filter',
    description: 'OnePlus 13, 12 series with Hasselblad camera'
  },
  {
    id: 'pixel',
    label: 'Google Pixel',
    hash: '#pixel',
    category: 'main-nav',
    order: 6,
    visible: false,
    iconName: 'Smartphone',
    badge: 'Gemini',
    type: 'filter',
    description: 'Google Pixel 9 Pro XL & computational cameras'
  },
  {
    id: 'other-android',
    label: 'Other Android',
    hash: '#other-android',
    category: 'main-nav',
    order: 7,
    visible: false,
    iconName: 'Smartphone',
    type: 'filter',
    description: 'Xiaomi, Vivo, Nothing & specialized smartphones'
  },
  {
    id: 'search',
    label: 'Search Phones',
    hash: '#search',
    category: 'main-nav',
    order: 8,
    visible: true,
    iconName: 'Search',
    type: 'section',
    description: 'Find device by model name, spec or budget'
  },
  {
    id: 'featured',
    label: 'Featured Flagships',
    hash: '#featured',
    category: 'main-nav',
    order: 9,
    visible: true,
    iconName: 'Sparkles',
    badge: 'Top Picks',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    type: 'section',
    description: 'Most popular refurbished models this week'
  },
  {
    id: 'how-it-works',
    label: 'How Refurbished Works',
    hash: '#how-it-works',
    category: 'main-nav',
    order: 10,
    visible: true,
    iconName: 'Layers',
    type: 'section',
    description: '4-step simple ₹2,000 down payment order process'
  },
  {
    id: 'benefits',
    label: 'Why Refurbished Phones',
    hash: '#benefits',
    category: 'main-nav',
    order: 11,
    visible: true,
    iconName: 'ShieldCheck',
    type: 'section',
    description: '₹2,000 down payment, zero extra charge & doorstep delivery'
  },
  {
    id: 'rental-benefits',
    label: 'Refurbished Benefits',
    hash: '#rental-benefits',
    category: 'main-nav',
    order: 12,
    visible: true,
    iconName: 'Sparkles',
    type: 'section',
    description: '₹2,000 down payment, no extra charge, full warranty support'
  },
  {
    id: 'faq',
    label: 'Frequently Asked Questions (FAQ)',
    hash: '#faq',
    category: 'main-nav',
    order: 13,
    visible: true,
    iconName: 'HelpCircle',
    type: 'section',
    description: 'Answers about refurbished phones, delivery & warranty'
  },
  {
    id: 'contact',
    label: 'Contact Us',
    hash: '#contact',
    category: 'main-nav',
    order: 14,
    visible: true,
    iconName: 'PhoneCall',
    type: 'section',
    description: 'Store location, message desk & Telegram support'
  },
  {
    id: 'inquiry',
    label: 'Send an Inquiry',
    hash: '#telegram-support',
    category: 'main-nav',
    order: 15,
    visible: false,
    iconName: 'MessageSquare',
    type: 'section',
    description: 'Submit rental custom requests or queries'
  },
  {
    id: 'list-phone',
    label: 'List Your Phone & Earn',
    hash: '#list-phone',
    category: 'main-nav',
    order: 16,
    visible: true,
    iconName: 'PlusCircle',
    badge: 'Monetize',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    type: 'modal',
    description: 'Sell or trade-in your spare flagship phone'
  },
  {
    id: 'cart',
    label: 'My Shopping Cart',
    hash: '#cart',
    category: 'main-nav',
    order: 17,
    visible: true,
    iconName: 'ShoppingCart',
    badge: 'Cart',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    type: 'modal',
    description: 'View selected phones and proceed to quick checkout'
  },

  // =========================================================================
  // 2. RENTAL AND PAYMENT SECTIONS (rental-payments)
  // =========================================================================
  {
    id: 'browse-available',
    label: 'Browse Available Phones',
    hash: '#browse-available',
    category: 'rental-payments',
    order: 1,
    visible: true,
    iconName: 'CheckCircle2',
    badge: 'Ready',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    type: 'filter',
    description: 'Filter phones currently in-stock for immediate dispatch'
  },
  {
    id: 'daily-plans',
    label: 'Standard Down Payment',
    hash: '#daily-plans',
    category: 'rental-payments',
    order: 2,
    visible: true,
    iconName: 'Clock',
    badge: '₹2,000',
    type: 'filter',
    description: 'Flat ₹2,000 down payment with zero extra charges'
  },
  {
    id: 'weekly-plans',
    label: 'Weekly Plans',
    hash: '#weekly-plans',
    category: 'rental-payments',
    order: 3,
    visible: true,
    iconName: 'Calendar',
    badge: 'Save 15%',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    type: 'filter',
    description: 'Cost-effective 7+ days bundles'
  },
  {
    id: 'monthly-plans',
    label: 'Monthly Plans',
    hash: '#monthly-plans',
    category: 'rental-payments',
    order: 4,
    visible: true,
    iconName: 'Calendar',
    badge: 'Best Value',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    type: 'filter',
    description: '30+ days plans with complimentary protection'
  },
  {
    id: 'security-deposit-info',
    label: 'Security Deposit Information',
    hash: '#security-deposit-info',
    category: 'rental-payments',
    order: 5,
    visible: true,
    iconName: 'Shield',
    type: 'modal',
    description: 'Transparent refundable deposits & instant refund policy'
  },
  {
    id: 'payment-instructions',
    label: 'Payment Instructions',
    hash: '#payment-instructions',
    category: 'rental-payments',
    order: 6,
    visible: true,
    iconName: 'FileText',
    type: 'modal',
    description: 'Step-by-step UPI payment guide'
  },
  {
    id: 'upi-qr-payment',
    label: 'UPI QR Payment',
    hash: '#upi-qr-payment',
    category: 'rental-payments',
    order: 7,
    visible: true,
    iconName: 'QrCode',
    badge: 'Instant QR',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    type: 'modal',
    description: 'Scan official RAZY PAY merchant QR code'
  },
  {
    id: 'screenshot-upload',
    label: 'Upload Payment Screenshot',
    hash: '#screenshot-upload',
    category: 'rental-payments',
    order: 8,
    visible: true,
    iconName: 'Upload',
    type: 'modal',
    description: 'Upload transaction screenshot for fast verification'
  },
  {
    id: 'my-payments',
    label: 'My Payment Requests',
    hash: '#my-payments',
    category: 'rental-payments',
    order: 9,
    visible: true,
    iconName: 'CreditCard',
    type: 'modal',
    description: 'Lookup submitted payment requests and UTR status'
  },
  {
    id: 'payment-status',
    label: 'Payment Verification Status',
    hash: '#payment-status',
    category: 'rental-payments',
    order: 10,
    visible: true,
    iconName: 'CheckCheck',
    type: 'modal',
    description: 'Track admin verification & approval in real-time'
  },
  {
    id: 'my-booking',
    label: 'Orders',
    hash: '#my-booking',
    category: 'rental-payments',
    order: 11,
    visible: true,
    iconName: 'FileText',
    badge: 'Live',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    type: 'modal',
    description: 'Check active phone orders, UTR payments & delivery status'
  },
  {
    id: 'rental-extension',
    label: 'Order Assistance',
    hash: '#rental-extension',
    category: 'rental-payments',
    order: 12,
    visible: false,
    iconName: 'Repeat',
    type: 'modal',
    description: 'Assistance for your ongoing phone order'
  },
  {
    id: 'return-policy',
    label: 'Return Policy',
    hash: '#return-policy',
    category: 'rental-payments',
    order: 13,
    visible: true,
    iconName: 'RotateCcw',
    type: 'modal',
    description: 'Doorstep device pickup & condition guidelines'
  },

  // =========================================================================
  // 3. INFORMATION AND SUPPORT NAVIGATION (info-support)
  // =========================================================================
  {
    id: 'about',
    label: 'About RAZY PAY',
    hash: '#about',
    category: 'info-support',
    order: 1,
    visible: true,
    iconName: 'Info',
    type: 'modal',
    description: 'Our mission, story, quality checks & authentic devices'
  },
  {
    id: 'contact-info',
    label: 'Contact Information',
    hash: '#contact-info',
    category: 'info-support',
    order: 2,
    visible: true,
    iconName: 'PhoneCall',
    type: 'section',
    description: 'Direct communication channels & escalation matrix'
  },
  {
    id: 'phone-whatsapp-support',
    label: 'Telegram Support',
    hash: '#telegram-support',
    category: 'info-support',
    order: 3,
    visible: true,
    iconName: 'Send',
    badge: 't.me',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    type: 'section',
    description: 'Direct assistance via Telegram: t.me/Razypaysupport'
  },
  {
    id: 'support-email',
    label: 'Online Support Desk',
    hash: '#telegram-support',
    category: 'info-support',
    order: 4,
    visible: true,
    iconName: 'Send',
    type: 'section',
    description: 'Instant response via Telegram: t.me/Razypaysupport'
  },
  {
    id: 'store-location',
    label: 'Store Location',
    hash: '#store-location',
    category: 'info-support',
    order: 5,
    visible: true,
    iconName: 'MapPin',
    type: 'section',
    description: 'Gandhi Nagar, Dukan No. 12, Patna'
  },
  {
    id: 'operating-hours',
    label: 'Operating Hours',
    hash: '#operating-hours',
    category: 'info-support',
    order: 6,
    visible: true,
    iconName: 'Clock',
    badge: '9 AM - 9 PM',
    type: 'section',
    description: 'Monday to Sunday, 9:00 AM – 9:00 PM IST'
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    hash: '#terms',
    category: 'info-support',
    order: 7,
    visible: true,
    iconName: 'FileText',
    type: 'modal',
    description: 'Service usage rules & platform commitments'
  },
  {
    id: 'rental-agreement',
    label: 'Rental Agreement',
    hash: '#rental-agreement',
    category: 'info-support',
    order: 8,
    visible: true,
    iconName: 'FileCheck',
    type: 'modal',
    description: 'Device custody rules, extensions & responsibilities'
  },
  {
    id: 'pricing-policy',
    label: 'Pricing & Billing Policy',
    hash: '#pricing-policy',
    category: 'info-support',
    order: 9,
    visible: true,
    iconName: 'Receipt',
    type: 'modal',
    description: '₹2,000 down payment, zero extra charges & warranty info'
  },
  {
    id: 'damage-policy',
    label: 'Damage & Loss Policy',
    hash: '#damage-policy',
    category: 'info-support',
    order: 10,
    visible: true,
    iconName: 'ShieldAlert',
    type: 'modal',
    description: 'Protection plan, cosmetic scratches vs hardware damages'
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    hash: '#privacy',
    category: 'info-support',
    order: 11,
    visible: true,
    iconName: 'Lock',
    type: 'modal',
    description: 'Zero customer password storage & NIST factory wiping'
  }
];

// Admin-facing Navigation Groups (Restricted Portal)
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: 'admin-portal',
    title: 'RAZY PAY Admin Dashboard',
    defaultExpanded: true,
    items: [
      {
        id: 'admin-overview',
        label: 'Dashboard Overview',
        hash: '#admin/overview',
        icon: LayoutDashboard,
        badge: 'Live',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        type: 'admin',
        requiresAdmin: true,
        description: 'Revenue, active rentals & fleet utilization'
      },
      {
        id: 'admin-phones',
        label: 'Phone Fleet Management',
        hash: '#admin/phones',
        icon: Smartphone,
        type: 'admin',
        requiresAdmin: true,
        description: 'Manage phones, update daily rates & availability'
      },
      {
        id: 'admin-add-phone',
        label: 'Add New Phone Listing',
        hash: '#admin/add-phone',
        icon: PlusCircle,
        type: 'admin',
        requiresAdmin: true,
        description: 'Add new flagship devices to public catalog'
      },
      {
        id: 'admin-bookings',
        label: 'Rental Bookings',
        hash: '#admin/bookings',
        icon: Calendar,
        type: 'admin',
        requiresAdmin: true,
        description: 'Approve, dispatch & track rental return status'
      },
      {
        id: 'admin-payments',
        label: 'Payment Verification & Claims',
        hash: '#admin/payments',
        icon: CheckCheck,
        badge: 'UTR / QR',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        type: 'admin',
        requiresAdmin: true,
        description: 'Verify screenshots & match merchant bank UTR'
      },
      {
        id: 'admin-qr-settings',
        label: 'Merchant UPI QR Settings',
        hash: '#admin/qr-settings',
        icon: QrCode,
        type: 'admin',
        requiresAdmin: true,
        description: 'Configure UPI ID & merchant QR code image'
      },
      {
        id: 'admin-navigation',
        label: 'Menu & Navigation Manager',
        hash: '#admin/navigation',
        icon: SlidersHorizontal,
        badge: 'Customizer',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        type: 'admin',
        requiresAdmin: true,
        description: 'Reorder sections, rename labels & toggle visibility'
      },
      {
        id: 'admin-logs',
        label: 'Security & Audit Logs',
        hash: '#admin/logs',
        icon: ShieldAlert,
        type: 'admin',
        requiresAdmin: true,
        description: 'System-wide audit trail and admin actions'
      }
    ]
  }
];

// Helper to convert custom config array into user NavGroups
export function buildUserNavGroups(customConfigs?: CustomNavItemConfig[]): NavGroup[] {
  const configs = (customConfigs && customConfigs.length > 0) ? customConfigs : DEFAULT_NAV_CONFIG;
  const visibleConfigs = configs.filter((c) => c.visible !== false);

  const mainNavItems: NavItem[] = visibleConfigs
    .filter((c) => c.category === 'main-nav')
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      label: c.label,
      hash: c.hash,
      icon: getIcon(c.iconName),
      badge: c.badge,
      badgeColor: c.badgeColor,
      type: (c.type as any) || 'section',
      description: c.description,
      category: c.category,
      order: c.order,
      visible: c.visible
    }));

  const rentalPaymentItems: NavItem[] = visibleConfigs
    .filter((c) => c.category === 'rental-payments')
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      label: c.label,
      hash: c.hash,
      icon: getIcon(c.iconName),
      badge: c.badge,
      badgeColor: c.badgeColor,
      type: (c.type as any) || 'modal',
      description: c.description,
      category: c.category,
      order: c.order,
      visible: c.visible
    }));

  const infoSupportItems: NavItem[] = visibleConfigs
    .filter((c) => c.category === 'info-support')
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      label: c.label,
      hash: c.hash,
      icon: getIcon(c.iconName),
      badge: c.badge,
      badgeColor: c.badgeColor,
      type: (c.type as any) || 'section',
      description: c.description,
      category: c.category,
      order: c.order,
      visible: c.visible
    }));

  return [
    {
      id: 'main-nav',
      title: 'Main Navigation',
      defaultExpanded: true,
      items: mainNavItems
    },
    {
      id: 'rental-payments',
      title: 'Orders & Payments',
      defaultExpanded: true,
      items: rentalPaymentItems
    },
    {
      id: 'info-support',
      title: 'Information & Support',
      defaultExpanded: false,
      items: infoSupportItems
    }
  ];
}

// Global user nav groups default export
export const USER_NAV_GROUPS: NavGroup[] = buildUserNavGroups(DEFAULT_NAV_CONFIG);
