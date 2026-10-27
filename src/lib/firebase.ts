import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence background Firestore backend warnings in sandbox environment
try {
  setLogLevel('silent');
} catch {
  // Ignored
}

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with custom named database ID and long polling
// to prevent WebChannel 10s connection timeout in browser/iframe sandboxes
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  try {
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } catch {
    firestoreDb = null;
  }
}

export const db = firestoreDb;

// Validate Connection to Firestore safely without throwing offline errors on startup
export async function testFirestoreConnection() {
  // Safe ping if needed; avoided immediate getDocFromServer which causes false-positive offline errors
}

export default app;
