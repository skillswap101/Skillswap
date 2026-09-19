import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "skillswapapp-905ca";

export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  !rawApiKey.includes("YOUR_") &&
  !rawApiKey.includes("PLACEHOLDER") &&
  rawApiKey !== "mock-key" &&
  rawApiKey !== "AIzaSyDummyKeyForDevelopment1234567" &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey: rawApiKey || "AIzaSyDummyKeyForDevelopment1234567",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
    });
  } catch (e) {
    return getAuth(app);
  }
})();

// Backward compatibility: db is null as database persistence is handled by Supabase Postgres
export const db = null as any;

export const storage = getStorage(app);
export default app;
