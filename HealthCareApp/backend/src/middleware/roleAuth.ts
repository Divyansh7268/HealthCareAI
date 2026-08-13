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
    
    const userRole = user?.role;
    
    // If the role is in the token, check it
    if (userRole && roles.includes(userRole)) {
      return next();
    }
    
    // Fallback: check Firestore users collection if custom claims aren't set
    const db = require('../config/firebase').db;
    db.collection('users').doc(user.uid).get()
      .then((doc: any) => {
        if (doc.exists && roles.includes(doc.data().role)) {
          return next();
        } else {
          return res.status(403).json({ error: `Forbidden: Requires one of [${roles.join(', ')}] role` });
        }
      })
      .catch((err: any) => {
        console.error('Error fetching user role from DB:', err);
        return res.status(403).json({ error: 'Forbidden: Error verifying role' });
      });
  };
}
