import express from 'express';
import {
  createDonation,
  getDonations,
  getDonationById,
  getMyDonations,
  claimDonation,
} from '../controllers/donationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../utils/upload.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('donor'), upload.single('photo'), createDonation)
  .get(getDonations);

router.get('/my/donations', protect, authorize('donor'), getMyDonations);

router.get('/:id', getDonationById);

router.post('/:id/claim', protect, authorize('ngo'), claimDonation);

export default router;
