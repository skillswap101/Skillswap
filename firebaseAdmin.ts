import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();

let adminApp: App | null = null;
let initError: string | null = null;

try {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      // Decode Base64 if needed
      if (!privateKey.includes("-----BEGIN") && privateKey.length > 100) {
        try {
          const decoded = Buffer.from(privateKey, "base64").toString("utf-8");
          if (decoded.includes("-----BEGIN")) {
            privateKey = decoded;
          }
        } catch {}
      }
      privateKey = privateKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
    }

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } else if (projectId) {
      // Lightweight token-verification initialization using Project ID
      adminApp = initializeApp({ projectId });
    }
  }
} catch (e: any) {
  initError = `Firebase Admin initialization notice: ${e?.message}`;
  console.warn(`[firebaseAdmin] Notice: ${initError}`);
}

export const firebaseAdmin: App | null = adminApp;
export const firebaseAuth: Auth | null = adminApp ? getAuth(adminApp) : null;
// Firestore is decommissioned in favor of Supabase Postgres
export const firestore = null as any;
export const firebaseAdminInitError: string | null = initError;
