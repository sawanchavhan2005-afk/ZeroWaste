import express from 'express';
import {
  createReview,
  getReviewsForUser,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/user/:id', getReviewsForUser);

export default router;
