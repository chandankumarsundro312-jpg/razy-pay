import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  RotateCcw,
  Shield,
  ArrowLeft,
  DollarSign,
  Lock,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

export type LegalTabType =
  | 'terms'
  | 'rental'
  | 'pricing'
  | 'damage'
  | 'privacy'
  | 'return'
  | 'deposit';

interface LegalModalProps {
  initialTab?: LegalTabType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  initialTab = 'terms',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);

  const tabLabels: Record<LegalTabType, string> = {
    terms: 'Terms & Conditions',
    rental: 'Rental Agreement',
    pricing: 'Pricing & Billing Policy',
    damage: 'Damage & Loss Policy',
    privacy: 'Privacy Policy',
    return: 'Return Policy',
    deposit: 'Security Deposit Info'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 text-left animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Top Header with Breadcrumbs & Back Button */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Legal & Support</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-black text-indigo-950">
              {tabLabels[activeTab]}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-2 bg-slate-100/80 border-b border-slate-200 overflow-x-auto shrink-0 text-xs font-bold scrollbar-none">
          {(
            [
              'terms',
              'rental',
              'pricing',
              'deposit',
              'return',
              'damage',
              'privacy'
            ] as LegalTabType[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                activeTab === tab
                  ? 'bg-white text-indigo-900 shadow-xs scale-102 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed flex-1">
          {/* TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4 text-slate-700">
              {/* Header Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block mb-1">
                  Computer-Generated Electronic Record • IT Act 2000 & Rules 2021
                </span>
                <h4 className="font-display text-base sm:text-lg font-black text-slate-950">
                  PART A: GENERAL TERMS AND CONDITIONS
                </h4>
                <p className="text-[11px] text-indigo-900 mt-1 leading-relaxed">
                  This document/agreement/understanding is a computer-generated electronic record published in terms of Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (amended from time to time) read with Information Technology Act, 2000 (amended from time to time) and does not require any physical or digital signatures.
                </p>
              </div>

              {/* Merchant Details Banner */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Merchant / Store Owner</span>
                  <span className="font-bold text-white text-xs">CHANDAN KUMAR (Chandan Store)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Verified Signatory Email</span>
                  <span className="font-mono text-purple-300">chandankumarsundro312@gmail.com</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Active Payment Rail</span>
                  <span className="font-mono text-emerald-400 font-bold">wallepayy@naviaxis</span>
                </div>
              </div>

              {/* Section 1 */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  1. PROPRIETARY RIGHTS & LEGAL AGREEMENT
                </h5>
                <p>
                  1.1. These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legal agreement governing access to and use of services, including smartphone sales, rentals, payment gateway integration, software, analytics, or any other services and tools offered. The Services are available and appropriate only for use in India.
                </p>
                <p>
                  1.2. All intellectual property, trademarks, domain names, logos, and distinctive brand features remain protected under applicable copyright and industrial property laws.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  2. USAGE OF PLATFORM & USE OF SERVICES BY THE USER
                </h5>
                <p>
                  2.1. <strong>Eligibility:</strong> Users must be of the age of 18 or above and legally capable of entering into binding contracts under Applicable Laws.
                </p>
                <p>
                  2.2. <strong>Information Accuracy:</strong> You agree to provide true, accurate, current, and complete information regarding your identity, shipping address, and contact details during order submission.
                </p>
                <p>
                  2.3. <strong>KYC & Regulatory Compliance:</strong> You acknowledge that for undertaking any financial transaction, due diligence measures and KYC verification (including Aadhaar Card or Government Photo ID) may be undertaken in accordance with RBI Guidelines on Payment Aggregators, Payment and Settlement Systems Act, 2007, and Prevention of Money Laundering Act, 2002 (PMLA).
                </p>
                <p>
                  2.4. <strong>Communications Consent:</strong> By utilizing the services and submitting your contact number, you consent to receive order updates, invoice receipts, and service notices via SMS, WhatsApp, or phone calls, waiving conflicting DND/NCPR preferences for transactional communications under TRAI regulations.
                </p>
                <p>
                  2.5. <strong>Prohibited Conduct:</strong> Users shall not use the platform for fraudulent, unauthorized, or unlawful purposes, nor engage in any activity detrimental to cybersecurity, financial systems, or NPCI UPI rails.
                </p>
              </div>

              {/* Section 3: Payment */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  3. PAYMENT, COMMERCE & RECONCILIATION
                </h5>
                <p>
                  3.1. <strong>Payment Rail & Zero Hidden Fees:</strong> Transactions are processed transparently via NPCI UPI QR rails directly to verified merchant VPA <strong>wallepayy@naviaxis</strong>. All transactions feature zero hidden charges and clear price breakdown before checkout.
                </p>
                <p>
                  3.2. <strong>Taxes & Invoicing:</strong> Prices displayed are inclusive of applicable goods & services taxation. Digital invoices are generated and accessible to customers for every verified order.
                </p>
                <p>
                  3.3. <strong>Transaction Reconciliation:</strong> Order payments are verified through 12-digit bank UTR reference matching against merchant bank settlement records.
                </p>
              </div>

              {/* Section 4: Prohibited Goods */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  4. PROHIBITED PRODUCTS & SERVICES COMPLIANCE
                </h5>
                <p>
                  In compliance with payment aggregator statutory guidelines and RBI regulations, Chandan Store strictly prohibits and does not facilitate any transactions relating to: counterfeit goods, weapons, unauthorized items, illegal drugs, unlicensed financial schemes, or any products prohibited under the laws of India.
                </p>
              </div>

              {/* Section 5: Refunds & Chargebacks */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  5. REFUNDS, REVERSALS & FRAUD PREVENTION
                </h5>
                <p>
                  5.1. <strong>10 Din Return Guarantee:</strong> All certified refurbished devices purchased from Chandan Store come with our 10-day 100% money-back guarantee if the customer is not satisfied with the unit condition.
                </p>
                <p>
                  5.2. <strong>Refund Routing:</strong> Approved refunds are routed directly back to the originating bank account or UPI payment instrument used during the transaction.
                </p>
                <p>
                  5.3. <strong>Fraud Prevention:</strong> The merchant maintains zero tolerance for chargeback fraud, counterfeit UTR submissions, or identity misrepresentation, and cooperates fully with law enforcement and banking facility providers under Section 94 BNSS and relevant IT regulations.
                </p>
              </div>

              {/* Section 6: Specific Undertaking */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase">
                  6. Statutory Merchant Undertaking & Compliance
                </span>
                <p className="text-slate-600">
                  M/s. Chandan Kumar (&lsquo;Merchant&rsquo;, &lsquo;Chandan Store&rsquo;) hereby affirms full compliance with KYC norms, Prevention of Money Laundering Act (PMLA) 2002, Consumer Protection (E-Commerce) Rules 2020, and NPCI Unified Payments Interface operational guidelines.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px] text-slate-500 border-t border-slate-200">
                  <div>
                    <strong className="text-slate-700 block">Signatory:</strong> Chandan Kumar
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Contact:</strong> +91 9572918366
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Jurisdiction:</strong> India
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Acceptance:</strong> Digital Assent
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RENTAL AGREEMENT */}
          {activeTab === 'rental' && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-black text-slate-900">
                Rental Agreement
              </h4>
              <p>
                1. <strong>Rental Period:</strong> The rental window commences upon verified delivery or physical pickup and concludes on the scheduled return date agreed during booking.
              </p>
              <p>
                2. <strong>Authorized Usage:</strong> Devices must not be rooted, jailbroken, or used for unlawful activities. All personal accounts (Apple ID, iCloud, Google Account, Samsung Account) must be completely logged out prior to return.
              </p>
              <p>
                3. <strong>Extensions:</strong> Customers may request rental extensions at least 24 hours prior to return date subject to device availability and prevailing daily rental rates.
              </p>
              <p>
                4. <strong>Prohibited Modifications:</strong> No hardware alterations, screen replacements, or uncertified repairs are permitted under any circumstances.
              </p>
            </div>
          )}

          {/* PRICING & BILLING POLICY */}
          {activeTab === 'pricing' && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-black text-slate-900">
                Rental Pricing & Billing Policy
              </h4>
              <p>
                1. <strong>Transparent Down Payment:</strong> Chandan Store charges a clear flat ₹2,000 down payment on certified refurbished smartphones. There are strictly zero hidden platform fees, no extra charge, and free express delivery.
              </p>
              <p>
                2. <strong>Multi-Tier Rates:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Daily Plan:</strong> 1 to 6 days flexible rental with daily billing.</li>
                <li><strong>Weekly Plan:</strong> 7 to 29 days bundled rental with up to 15% discount.</li>
                <li><strong>Monthly Plan:</strong> 30+ days continuous rental with maximum savings.</li>
              </ul>
              <p>
                3. <strong>No Hidden Platform Margins:</strong> All charges, taxes, and deposit obligations are shown upfront on the product card and checkout breakdown before payment.
              </p>
            </div>
          )}

          {/* SECURITY DEPOSIT INFO */}
          {activeTab === 'deposit' && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-black text-slate-900">
                Security Deposit Information & Refund Policy
              </h4>
              <p>
                1. <strong>Transparent Deposit Requirement:</strong> Select premium flagship models carry a refundable security deposit clearly indicated on the product card (ranging from ₹0 on standard models up to ₹1,500 on latest ultra flagships).
              </p>
              <p>
                2. <strong>100% Refundable:</strong> Security deposits are held in dedicated merchant escrow during your rental period and are refunded 100% immediately upon safe return inspection.
              </p>
              <p>
                3. <strong>Instant UPI Refund:</strong> Refunds are processed directly back to the customer's originating UPI VPA or bank account within 2 hours of device verification.
              </p>
              <p>
                4. <strong>Zero Deduction for Normal Wear:</strong> Microscopic minor surface marks or hairline scratches on protective cases do not attract any deposit deduction.
              </p>
            </div>
          )}

          {/* RETURN POLICY */}
          {activeTab === 'return' && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-black text-slate-900">
                Return & Pickup Policy
              </h4>
              <p>
                1. <strong>Return Schedule:</strong> Device returns are scheduled on the final date of the rental period. Our logistics courier will coordinate pickup at your delivery address.
              </p>
              <p>
                2. <strong>Pre-Return Checklist:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sign out of Apple ID / iCloud (turn off Find My iPhone).</li>
                <li>Remove Google Account / Samsung Account and factory reset screen lock.</li>
                <li>Pack the device in its provided protective case along with original charging cable and adapter.</li>
              </ul>
              <p>
                3. <strong>Late Return Grace Window:</strong> A 2-hour grace period is provided on the return day. Unannounced delays beyond the grace period will be billed at regular daily rental rates.
              </p>
            </div>
          )}

          {/* DAMAGE & LOSS POLICY */}
          {activeTab === 'damage' && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-black text-slate-900">
                Damage, Loss & Protection Policy
              </h4>
              <p>
                1. <strong>Normal Wear & Tear Covered:</strong> Everyday minor cosmetic marks on bumpers or screen protectors are covered free of charge under our standard rental guarantee.
              </p>
              <p>
                2. <strong>Accidental Screen Damage:</strong> In case of deep cracks, shattered displays, or liquid ingress, repair fees will be assessed transparently according to authorized brand service center estimates.
              </p>
              <p>
                3. <strong>Total Loss or Non-Return:</strong> Complete non-return or unrecovered devices will incur replacement liability under Indian Contract Act and police FIR reporting.
              </p>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 text-slate-700">
              {/* Privacy Header */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block mb-1">
                  Privacy Policy • Last updated March 19th, 2024 / Validated 2026
                </span>
                <h4 className="font-display text-base sm:text-lg font-black text-slate-950">
                  Introduction to Privacy Policy
                </h4>
                <p className="text-[11px] text-indigo-900 mt-1 leading-relaxed">
                  This privacy policy (&ldquo;Privacy Policy&rdquo;) applies to your use of Chandan Store (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) and payment services. The term &ldquo;Personal Information&rdquo; means information you provide to us which personally identifies you to be contacted or identified, such as your name, phone number, email address, shipping address, and transaction data.
                </p>
              </div>

              {/* Merchant & User Details Banner */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Platform Merchant</span>
                  <span className="font-bold text-white text-xs">CHANDAN KUMAR (Chandan Store)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Signatory Contact</span>
                  <span className="font-mono text-purple-300">+91 9572918366</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email</span>
                  <span className="font-mono text-emerald-400 font-bold">chandankumarsundro312@gmail.com</span>
                </div>
              </div>

              {/* Information Collection */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  1. INFORMATION WE COLLECT AND HOW WE USE IT
                </h5>
                <p>
                  1.1. We collect, receive, and store your Personal Information provided during order placement, checkout, or identity verification. Collection is limited strictly to that which is necessary to fulfill order delivery, customer support, and regulatory requirements.
                </p>
                <p>
                  1.2. The Personal Information collected will be used only for enabling you to use the services, ensuring delivery to the correct destination, informing you of order status and updates, troubleshooting issues, and detecting and preventing fraud or erroneous transactions.
                </p>
                <p>
                  1.3. <strong>Option of Erasure:</strong> Users have the right to request erasure of their Personal Information from active databases upon complete settlement and fulfillment of orders.
                </p>
              </div>

              {/* Customer Information & Data Privacy */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  2. CUSTOMER INFORMATION & ZERO PASSWORD STORAGE
                </h5>
                <p>
                  2.1. We collect customer shipping address, mobile contact number, and transaction references (UTR). Because our platform operates on self-service transparent checkout, no sensitive passwords, debit card PINs, or banking credentials are ever requested or stored on our servers.
                </p>
                <p>
                  2.2. Chandan Store assures that your Personal Information will not be made public, leased, or sold to any third-party marketing companies.
                </p>
                <p>
                  2.3. <strong>Device Data Sanitization:</strong> In accordance with NIST 800-88 standards, all refurbished or demo phones undergo complete cryptographic factory wipes to ensure zero personal photos, contacts, or residual accounts remain on devices.
                </p>
              </div>

              {/* Activity & Cookies */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  3. ACTIVITY & COOKIES
                </h5>
                <p>
                  We use essential session and persistent cookies to remember shopping cart items and improve browsing performance. We do not track personal identifying information through third-party advertisement cookies without explicit consent. Users can manage or disable cookies via browser preferences.
                </p>
              </div>

              {/* Transfer of Information */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  4. TRANSFER OF INFORMATION & STATUTORY COMPLIANCE
                </h5>
                <p>
                  We do not share your Personal Information with third parties except with banking institutions, authorized payment gateways / NPCI UPI settlement networks, logistics delivery partners, or government authorities as mandated under the Information Technology Act 2000, RBI regulations, and Indian judicial processes.
                </p>
              </div>

              {/* Security Practices */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  5. SECURITY PRACTICES & APPLICABLE LAW
                </h5>
                <p>
                  5.1. We have implemented industry-standard security practices and procedures commensurate with information assets being protected to prevent unauthorized disclosure, loss, or alteration.
                </p>
                <p>
                  5.2. <strong>Applicable Law:</strong> This Privacy Policy is governed by and construed in accordance with the laws of India.
                </p>
              </div>

              {/* Grievance & DPO Details Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-2">
                <span className="font-bold text-slate-900 block text-xs uppercase">
                  6. Complaints, DPO & Grievance Redressal
                </span>
                <p className="text-slate-600">
                  Any complaints, discrepancies, or concerns regarding your Personal Information or data handling may be communicated directly to our grievance desk:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Store Data Protection Officer</span>
                    <strong className="text-slate-800">Chandan Kumar / Privacy Desk</strong>
                    <p className="text-slate-600 text-[11px]">Chandan Store, Gandhi Nagar, Patna, Bihar</p>
                    <p className="text-indigo-700 text-[11px] font-mono mt-0.5">chandankumarsundro312@gmail.com</p>
                    <p className="text-slate-700 text-[11px] font-mono">+91 9572918366</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Rail Partner Redressal</span>
                    <strong className="text-slate-800">Nodal Grievance Office</strong>
                    <p className="text-slate-600 text-[11px]">SJR Cyber, 22 Laskar-Hosur Road, Adugodi, Bangalore</p>
                    <p className="text-slate-700 text-[11px]">Email: nodal-officer@razorpay.com / dpo@razorpay.com</p>
                    <p className="text-slate-700 text-[11px]">Portal: razorpay.com/grievances/</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Official Chandan Store Policy Document • Updated 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
