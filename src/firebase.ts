import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const rawApiKey =
  import.meta.env.VITE_FIREBASE_API_KEY ||
  "AIzaSyDILiPgriu8dkKMxLp8zqPqLEIK9vcvtC8";
const projectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ||
  "skillswapapp-905ca";

export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  !rawApiKey.includes("YOUR_") &&
  !rawApiKey.includes("PLACEHOLDER") &&
  rawApiKey !== "mock-key" &&
  rawApiKey !== "AIzaSyDummyKeyForDevelopment1234567" &&
  projectId
);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "934795961841",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:934795961841:web:10eeaaed65cd0aa6a45050",
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
