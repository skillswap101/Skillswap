import { initializeApp, getApps, cert, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = process.cwd();

let adminApp: App | null = null;
let initError: string | null = null;

function loadCredential(): ServiceAccount | null {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  }

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  const localKeyPath = path.resolve(__dirname, "serviceaccountkey.json");
  if (existsSync(localKeyPath)) {
    try {
      const fileContent = readFileSync(localKeyPath, "utf-8");
      return JSON.parse(fileContent);
    } catch (e: any) {
      initError = `Failed to parse serviceaccountkey.json: ${e?.message}`;
      return null;
    }
  }

  initError =
    "No Firebase Admin credentials found. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars, or provide ./serviceaccountkey.json for local dev.";
  return null;
}

try {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    const cred = loadCredential();
    if (cred) {
      adminApp = initializeApp({
        credential: cert(cred),
        projectId: cred.projectId,
      });
    }
  }
} catch (e: any) {
  initError = `Firebase Admin initialization threw: ${e?.message}`;
}

export const firebaseAdmin: App | null = adminApp;
export const firebaseAuth: Auth | null = adminApp ? getAuth(adminApp) : null;
export const firestore: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const firebaseAdminInitError: string | null = initError;

if (initError) {
  console.warn(`[firebaseAdmin] FAILED to initialize: ${initError}`);
} else {
  console.log(`[firebaseAdmin] Initialized successfully for project: ${adminApp?.options?.projectId || "unknown"}`);
}
