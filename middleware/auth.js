import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "skillswapapp-905ca";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!getApps().length) {
  if (privateKey) {
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

  if (clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (e) {
      console.warn('[Auth Middleware] Cert initialization failed, falling back to ProjectId:', e.message);
      initializeApp({ projectId });
    }
  } else {
    // Fallback initialization using Project ID only
    initializeApp({ projectId });
  }
}

const auth = getAuth();

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  // 1. Try standard Firebase ID token verification (without checkRevoked to avoid requiring private service account)
  try {
    const decodedToken = await auth.verifyIdToken(idToken, false);
    
    req.user = {
      uid: decodedToken.uid || decodedToken.user_id,
      email: decodedToken.email || '',
      role: decodedToken.role || 'user'
    };

    return next();
  } catch (error) {
    console.warn('[Auth Middleware] Firebase token verification failed:', error.message || error);

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Unauthorized: Token has been revoked' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase token' });
  }
};

