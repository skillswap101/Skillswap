#!/bin/bash
set -e

echo "=== 1. Updating src/index.css for Tailwind v4 ==="
cat << 'CSS_EOF' > src/index.css
@import "tailwindcss";
CSS_EOF

echo "=== 2. Updating vite.config.ts with @tailwindcss/vite plugin ==="
cat << 'VITE_EOF' > vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
VITE_EOF

echo "=== 3. Updating src/firebase.ts (graceful initialization, prevents white-screen crashes) ==="
cat << 'FB_EOF' > src/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
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
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const storage = getStorage(app);

export default app;
FB_EOF

echo "=== 4. Updating firebaseAdmin.ts (unquotes private keys and auto-loads .env) ==="
cat << 'FBA_EOF' > firebaseAdmin.ts
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
FBA_EOF

echo "=== 5. Updating HTML title and description in index.html ==="
cat << 'HTML_EOF' > index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SkillSwap 5.0 - Peer-to-Peer Knowledge Sharing</title>
    <meta name="description" content="Community peer-to-peer skill exchange platform to teach, learn, and swap skills." />
    <meta property="og:title" content="SkillSwap 5.0 - Peer-to-Peer Knowledge Sharing" />
    <meta property="og:description" content="Community peer-to-peer skill exchange platform to teach, learn, and swap skills." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML_EOF

echo ""
echo "=== Staging and Committing to Git ==="
git add src/index.css vite.config.ts src/firebase.ts firebaseAdmin.ts index.html
git commit -m "fix(styles): integrate Tailwind v4 Vite plugin and harden Firebase Admin credentials"

echo ""
echo "=== Pushing to GitHub ==="
git push origin main || git push origin master

echo ""
echo "SUCCESS! GitHub repository has been synced with Tailwind v4 and the latest runtime fixes."
