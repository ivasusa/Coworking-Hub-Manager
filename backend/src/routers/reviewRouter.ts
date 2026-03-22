import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';

const router = Router();
const controller = new ReviewController();

router.get('/:spaceId', optionalAuth, controller.getSpaceReviews);
router.post('/:spaceId/like', authenticate, requireRole('member'), controller.addLike);
router.post('/:spaceId/dislike', authenticate, requireRole('member'), controller.addDislike);
router.post('/:spaceId/comment', authenticate, requireRole('member'), controller.addComment);

export default router;
