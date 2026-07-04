import express from 'express';
import {
  updateDeliveryStatus,
  getDeliveryById,
  getDeliveries,
} from '../controllers/deliveryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../utils/upload.js';

const router = express.Router();

router.get('/', protect, getDeliveries);
router.put('/:id/status', protect, authorize('volunteer'), upload.single('photo'), updateDeliveryStatus);
router.get('/:id', protect, getDeliveryById);

export default router;
