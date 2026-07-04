import express from 'express';
import {
  getAvailableDeliveries,
  claimDelivery,
  getMyDeliveries,
  getLeaderboard,
} from '../controllers/volunteerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/deliveries/available', protect, authorize('volunteer'), getAvailableDeliveries);
router.post('/deliveries/:id/claim', protect, authorize('volunteer'), claimDelivery);
router.get('/deliveries/my', protect, authorize('volunteer'), getMyDeliveries);
router.get('/leaderboard', getLeaderboard);

export default router;
