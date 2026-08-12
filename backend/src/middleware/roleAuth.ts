import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

/**
 * Middleware to verify Firebase ID Token from Authorization header.
 * Attaches decoded token to req.user for use in controllers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing Bearer token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

/**
 * Middleware to allow only specific roles.
 * Since we might not use custom claims yet, we can check a Firestore users collection
 * or we can assume the token has a role claim.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    // Check custom claims role
    const userRole = user?.role;
    
    // For development, if role is not strictly defined in claims, we might need a DB lookup.
    // Assuming custom claims are set correctly for now.
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${roles.join(', ')}] role` });
    }
    next();
  };
}
