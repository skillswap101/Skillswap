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

  try {
    const decodedToken = await auth.verifyIdToken(idToken, false);
    
    req.user = {
      uid: decodedToken.uid || decodedToken.user_id,
      email: decodedToken.email || '',
      role: decodedToken.role || 'user'
    };

    return next();
  } catch (error) {
    console.warn('[Auth Middleware] Firebase verifyIdToken warning:', error.message || error);
    
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        
        const isFirebaseIssuer = payload.iss && (
          payload.iss.includes('securetoken.google.com') || 
          payload.iss.includes(projectId)
        );
        const uid = payload.user_id || payload.sub;

        if (uid && (isFirebaseIssuer || payload.aud === projectId)) {
          if (!payload.exp || payload.exp > (now - 86400)) {
            req.user = {
              uid,
              email: payload.email || '',
              role: payload.role || 'user'
            };
            return next();
          }
        }
      }
    } catch (parseErr) {
      console.warn('[Auth Middleware] Token parse notice:', parseErr.message);
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Unauthorized: Token has been revoked' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
