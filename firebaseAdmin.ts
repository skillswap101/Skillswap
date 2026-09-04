/**
 * Single canonical Firebase Admin SDK initialization.
 *
 * This project previously had THREE separate places initializing Firebase
 * Admin (root firebaseAdmin.ts, a duplicate inline block in server.ts, and
 * a dead/unused server/firebaseAdmin.ts that used require() inside an ESM
 * project and would have crashed if it were ever actually called). This is
 * now the only one. server.ts imports firebaseAuth/firestore from here.
 *
 * Credential resolution order:
 *   1. Environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 *      FIREBASE_PRIVATE_KEY) - use this in production/hosted environments.
 *   2. Local ./serviceaccountkey.json - dev-only fallback. This file must
 *      NEVER be committed or shipped in a distributable zip. It is already
 *      in .gitignore.
 */
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import path from "path";

const __dirname = process.cwd();

let firebaseApp: App | null = null;
let firebaseAuth: Auth | null = null;
let firestore: Firestore | null = null;
let initError: string | null = null;

function loadCredential(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  const keyPath = path.join(__dirname, "serviceaccountkey.json");
  if (existsSync(keyPath)) {
    try {
      const raw = JSON.parse(readFileSync(keyPath, "utf-8"));
      return raw as ServiceAccount;
    } catch {
      return null;
    }
  }
  return null;
}

try {
  if (getApps().length) {
    firebaseApp = getApps()[0];
  } else {
    const credential = loadCredential();
    if (!credential) {
      throw new Error(
        "No Firebase Admin credentials found. Set FIREBASE_PROJECT_ID / " +
        "FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars, or provide " +
        "./serviceaccountkey.json for local dev."
      );
    }
    firebaseApp = initializeApp({ credential: cert(credential) });
  }
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
} catch (e: any) {
  initError = e?.message || String(e);
  console.error("[firebaseAdmin] FAILED to initialize:", initError);
}

export { firebaseAuth, firestore, initError };
export default firebaseApp;
