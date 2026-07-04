import express from 'express';
import {
  getAdminStats,
  getUsers,
  verifyNgo,
  deleteUser,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getAdminStats);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/ngos/:id/verify', protect, authorize('admin'), verifyNgo);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

export default router;
