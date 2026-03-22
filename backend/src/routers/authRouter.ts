import { Router } from 'express';
import { login, adminLogin, register, forgotPassword, verifyResetToken, resetPassword } from '../controllers/authController';
import { uploadProfile } from '../middleware/upload';

const router = Router();

router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/register', uploadProfile.single('profileImage'), register);
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

export default router;
