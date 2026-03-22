import { Router } from 'express';
import { SpaceController } from '../controllers/spaceController';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadSpaceImages } from '../middleware/upload';

const router = Router();
const controller = new SpaceController();

router.get('/count', controller.getSpaceCount);
router.get('/top5', controller.getTop5);
router.get('/cities', controller.getCities);
router.get('/search', controller.searchSpaces);
router.get('/manager/my', authenticate, requireRole('manager'), controller.getManagerSpaces);
router.get('/:id', controller.getSpaceDetails);

router.post('/', authenticate, requireRole('manager'), uploadSpaceImages.array('images', 6), controller.createSpace);
router.get('/admin/pending', authenticate, requireRole('admin'), controller.getPendingSpaces);
router.get('/admin/stats', authenticate, requireRole('admin'), controller.getAdminStats);
router.put('/admin/:id/approve', authenticate, requireRole('admin'), controller.approveSpace);

router.post('/:id/elements', authenticate, requireRole('manager'), controller.addSpaceElement);
router.put('/:id', authenticate, requireRole('manager'), controller.updateSpace);

export default router;
