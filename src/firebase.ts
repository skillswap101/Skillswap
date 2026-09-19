/// <reference types="vite/client" />
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "skillswapapp-905ca";

export const isFirebaseConfigured: boolean = Boolean(
  rawApiKey &&
  rawApiKey !== "undefined" &&
  rawApiKey !== "null" &&
  !rawApiKey.startsWith("MY_") &&
  rawApiKey.length >= 10
);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!isFirebaseConfigured) {
  throw new Error(
    "Firebase is not configured. Set the required VITE_FIREBASE_* environment variables."
  );
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const authInstance = getAuth(app);
const dbInstance = getFirestore(app);
const storageInstance = getStorage(app);

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export default app;
