import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import {
  PhoneListing,
  RentalBooking,
  PaymentClaim,
  QrSettings,
  WebsiteSettings,
  AdminAuditLog
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export function handleFirestoreError(error: unknown, op: OperationType, path: string | null) {
  console.warn(`Firestore operation ${op} at ${path} note:`, error);
}

// Phones
export async function syncPhoneToFirestore(phone: PhoneListing): Promise<void> {
  try {
    if (!db) return;
    await setDoc(doc(db, 'phones', phone.id), phone, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `phones/${phone.id}`);
  }
}

export async function deletePhoneFromFirestore(phoneId: string): Promise<void> {
  try {
    if (!db) return;
    await deleteDoc(doc(db, 'phones', phoneId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `phones/${phoneId}`);
  }
}

export async function fetchPhonesFromFirestore(): Promise<PhoneListing[]> {
  try {
    if (!db) return [];
    // Protect against sandbox offline/network latency with a graceful timeout
    const fetchPromise = getDocs(collection(db, 'phones'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore connection timeout')), 2500)
    );
    const snap = await Promise.race([fetchPromise, timeoutPromise]);
    return snap.docs.map((d) => d.data() as PhoneListing);
  } catch (err) {
    // Graceful silent fallback without spamming console
    return [];
  }
}

// Bookings
export async function syncBookingToFirestore(booking: RentalBooking): Promise<void> {
  try {
    if (!db) return;
    await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `bookings/${booking.id}`);
  }
}

// Payments
export async function syncPaymentToFirestore(payment: PaymentClaim): Promise<void> {
  try {
    if (!db) return;
    await setDoc(doc(db, 'payments', payment.id), payment, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `payments/${payment.id}`);
  }
}

// QR Settings
export async function syncQrSettingsToFirestore(qrSettings: QrSettings): Promise<void> {
  try {
    if (!db) return;
    await setDoc(doc(db, 'settings', 'qrSettings'), qrSettings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/qrSettings');
  }
}

// Audit Logs
export async function logAuditToFirestore(log: AdminAuditLog): Promise<void> {
  try {
    if (!db) return;
    await setDoc(doc(db, 'auditLogs', log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `auditLogs/${log.id}`);
  }
}

// User Profiles & Wallets (Permanent Persistence)
export async function syncUserToFirestore(userRecord: any): Promise<void> {
  try {
    if (!db || !userRecord || !userRecord.profile?.id) return;
    const userId = userRecord.profile.id;
    await setDoc(
      doc(db, 'users', userId),
      {
        id: userId,
        profile: userRecord.profile,
        wallet: userRecord.wallet,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userRecord?.profile?.id}`);
  }
}

// Orders Permanent Persistence
export async function syncOrderToFirestore(order: any): Promise<void> {
  try {
    if (!db || !order || !order.id) return;
    await setDoc(doc(db, 'orders', order.id), order, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${order?.id}`);
  }
}

// Withdrawals Permanent Persistence
export async function syncWithdrawalToFirestore(withdrawal: any): Promise<void> {
  try {
    if (!db || !withdrawal || !withdrawal.id) return;
    await setDoc(doc(db, 'withdrawals', withdrawal.id), withdrawal, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `withdrawals/${withdrawal?.id}`);
  }
}

// Ledger Records Permanent Persistence
export async function syncLedgerToFirestore(ledgerEntry: any): Promise<void> {
  try {
    if (!db || !ledgerEntry || !ledgerEntry.id) return;
    await setDoc(doc(db, 'ledger', ledgerEntry.id), ledgerEntry, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `ledger/${ledgerEntry?.id}`);
  }
}

