import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Public Firebase client configuration (safe for client-side embedding)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBs2In3NySOfBu9bstQbxmA4s9HvVbCnHI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ecodonate-6e24d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ecodonate-6e24d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ecodonate-6e24d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '349973715308',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:349973715308:web:39cf84d3a949087fa07b49',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-J50MW9V2EK',
};

let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let storage = null;
let analytics = null;

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    storage = getStorage(app);

    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {});
    }
  }
} catch (err) {
  console.warn('[Firebase] Initialization error (safe fallback enabled):', err.message);
}

export { app, auth, googleProvider, db, storage, analytics };
export default app;
