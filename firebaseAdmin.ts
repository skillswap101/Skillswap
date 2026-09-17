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

function normalizePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // If provided as Base64 encoded string:
  if (!key.includes("-----BEGIN") && key.length > 100) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf-8");
      if (decoded.includes("-----BEGIN")) {
        key = decoded.trim();
      }
    } catch {}
  }

  // Strip leading/trailing quotes
  key = key.replace(/^["']|["']$/g, "").trim();

  // Replace literal '\n' and '\r\n' strings with real newlines
  key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

  // Standardize CRLF to LF
  key = key.replace(/\r\n/g, "\n");

  return key;
}

function loadCredential(): ServiceAccount | null {
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = normalizePrivateKey(privateKey);
  }

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  const localKeyPath = path.resolve(__dirname, "serviceaccountkey.json");
  if (existsSync(localKeyPath)) {
    try {
      const fileContent = readFileSync(localKeyPath, "utf-8");
      const parsed = JSON.parse(fileContent);
      return {
        projectId: parsed.project_id || projectId,
        clientEmail: parsed.client_email || clientEmail,
        privateKey: normalizePrivateKey(parsed.private_key || ""),
      };
    } catch (e: any) {
      initError = `Failed to parse serviceaccountkey.json: ${e?.message}`;
      return null;
    }
  }

  initError =
    "No Firebase Admin credentials found. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars.";
  return null;
}

try {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    const cred = loadCredential();
    if (cred && cred.privateKey) {
      const credential = cert(cred);
      adminApp = initializeApp({
        credential,
        projectId: cred.projectId,
      });
    } else {
      initError = initError || "Missing valid credentials";
    }
  }
} catch (e: any) {
  initError = `Firebase Admin initialization threw: ${e?.message || e}`;
  adminApp = null;
}

export const firebaseAdmin: App | null = adminApp;
export const firebaseAuth: Auth | null = adminApp ? getAuth(adminApp) : null;
export const firestore: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const firebaseAdminInitError: string | null = initError;

if (initError || !adminApp) {
  console.warn(`[firebaseAdmin] FAILED to initialize: ${initError}`);
} else {
  console.log(
    `[firebaseAdmin] Initialized successfully for project: ${
      adminApp?.options?.projectId || "unknown"
    }`
  );
}
