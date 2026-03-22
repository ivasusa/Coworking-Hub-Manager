import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadProfile } from '../middleware/upload';

const router = Router();
const controller = new UserController();

router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, uploadProfile.single('profileImage'), controller.updateProfile);
router.get('/reservations', authenticate, requireRole('member'), controller.getMyReservations);
router.put('/reservations/:id/cancel', authenticate, requireRole('member'), controller.cancelReservation);

router.get('/admin/all', authenticate, requireRole('admin'), controller.getAllUsers);
router.get('/admin/pending', authenticate, requireRole('admin'), controller.getPendingUsers);
router.put('/admin/:id/approve', authenticate, requireRole('admin'), controller.approveUser);
router.put('/admin/:id/reject', authenticate, requireRole('admin'), controller.rejectUser);
router.put('/admin/:id', authenticate, requireRole('admin'), controller.updateUser);
router.delete('/admin/:id', authenticate, requireRole('admin'), controller.deleteUser);

export default router;
