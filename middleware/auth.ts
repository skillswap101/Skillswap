import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { firebaseAuth } from '../firebaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken & { uid: string; email?: string; role?: string };
}

export const verifyFirebaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken || idToken === 'null' || idToken === 'undefined') {
    res.status(401).json({ error: 'Unauthorized: Empty token' });
    return;
  }

  if (!firebaseAuth) {
    res.status(503).json({ error: 'Authentication service unavailable' });
    return;
  }

  // Pre-validate JWT structure and header before calling verifyIdToken
  // A valid Firebase ID token must have 3 parts and a 'kid' claim in its header.
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    res.status(401).json({ error: 'Unauthorized: Malformed JWT token structure' });
    return;
  }

  try {
    const headerStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const header = JSON.parse(headerStr);
    if (!header || !header.kid || header.alg === 'none') {
      res.status(401).json({ error: 'Unauthorized: Invalid token header (missing kid claim)' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Unauthorized: Malformed token header' });
    return;
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken, true);
    
    req.user = {
      ...decodedToken,
      uid: decodedToken.uid || (decodedToken as any).user_id,
      email: decodedToken.email || '',
      role: (decodedToken as any).role || 'user',
    };

    next();
  } catch (error: any) {
    console.warn('[Auth Middleware] Token verification failed:', error?.code || 'auth/invalid-token');
    res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase token' });
  }
};

export const authenticateUser = verifyFirebaseToken;
export default verifyFirebaseToken;
