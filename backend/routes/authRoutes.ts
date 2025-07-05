import { Router } from 'express';
import {
  register,
  login,
  logout,
  verifyToken,
  getProfile,
  changePassword
} from '../auth/authController';
import { authenticateToken, rateLimitByUser } from '../auth/authMiddleware';

const router = Router();

// ===== PUBLIC ROUTES (without auth) =====


router.post('/register', register);
router.post('/login', login);


// ===== PROTECT ROUTES (with auth) =====

router.post('/logout', authenticateToken, logout);
router.get('/verify', authenticateToken, verifyToken);
router.get('/profile', authenticateToken, getProfile);


router.put('/change-password', 
  authenticateToken, 
  rateLimitByUser(5, 15 * 60 * 1000), // máximo 5 intentos cada 15 minutos
  changePassword
);

export default router;
