import { Router } from 'express';
import { ReservationController } from '../controllers/reservationController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const controller = new ReservationController();

router.post('/', authenticate, requireRole('member'), controller.createReservation);
router.get('/element/:elementId', controller.getElementCalendar);
router.get('/manager', authenticate, requireRole('manager'), controller.getManagerReservations);
router.get('/manager/report', authenticate, requireRole('manager'), controller.getManagerMonthlyReport);
router.get('/manager/element/:elementId', authenticate, requireRole('manager'), controller.getManagerElementCalendar);
router.put('/:id/confirm', authenticate, requireRole('manager'), controller.confirmReservation);
router.put('/:id/noshow', authenticate, requireRole('manager'), controller.noShowReservation);

export default router;
