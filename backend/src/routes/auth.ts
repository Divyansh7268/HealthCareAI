import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/roleAuth';
import { db } from '../config/firebase';

const router = Router();

// POST /api/v1/auth/session - To start a session or verify login
router.post('/session', requireAuth, (req: Request, res: Response) => {
  // The requireAuth middleware already verified the token
  // We can just return success or mint a custom session cookie if needed
  res.status(200).json({ message: 'Session valid', user: (req as any).user });
});

// GET /api/v1/users/me - Get current user profile
router.get('/users/me', requireAuth, async (req: Request, res: Response, next) => {
  try {
    const uid = (req as any).user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found in database' });
    }
    
    res.status(200).json({ user: { id: userDoc.id, ...userDoc.data() } });
  } catch (err) {
    next(err);
  }
});

export default router;
