import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from './firebase';
import { AUTHORIZED_ADMIN_EMAIL, isAuthorizedAdminEmail } from '../config/adminConfig';

if (typeof window !== 'undefined' && auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Could not set browserLocalPersistence:', err);
  });
}

export function onAdminAuthStateChanged(callback: (user: FirebaseUser | null, isAdmin: boolean) => void) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user) => {
    const isAdmin = isAuthorizedAdminEmail(user?.email);
    callback(user, isAdmin);
  });
}

export async function signInAdminWithGoogle(): Promise<{ user: FirebaseUser; isAdmin: boolean }> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const isAdmin = isAuthorizedAdminEmail(cred.user.email);
  return { user: cred.user, isAdmin };
}

export async function signOutAdmin(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
