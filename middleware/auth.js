import { firebaseAuth } from '../firebaseAdmin.js';

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  if (!firebaseAuth) {
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken, true);
    
    req.user = {
      uid: decodedToken.uid || decodedToken.user_id,
      email: decodedToken.email || '',
      role: decodedToken.role || 'user',
      ...decodedToken
    };

    return next();
  } catch (error) {
    console.warn('[Auth Middleware] Firebase token verification failed:', error.message || error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase token' });
  }
};

export const verifyFirebaseToken = authenticateUser;


