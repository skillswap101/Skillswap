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
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized: Empty token' });
    return;
  }

  if (!firebaseAuth) {
    res.status(503).json({ error: 'Authentication service unavailable' });
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
    console.warn('[Auth Middleware] Firebase token verification failed:', error?.message || error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase token' });
  }
};

export const authenticateUser = verifyFirebaseToken;
export default verifyFirebaseToken;
