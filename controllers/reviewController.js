import Review from '../models/Review.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { revieweeId, donationId, rating, comment } = req.body;

    if (revieweeId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself' });
    }

    // Verify target user exists
    const reviewee = await User.findById(revieweeId);
    if (!reviewee) {
      return res.status(404).json({ success: false, message: 'User to review not found' });
    }

    // Verify donation exists
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Associated donation not found' });
    }

    // Check if review already exists for this donation by this reviewer
    const reviewExists = await Review.findOne({
      reviewer: req.user.id,
      reviewee: revieweeId,
      donation: donationId,
    });

    if (reviewExists) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this donation' });
    }

    const review = await Review.create({
      reviewer: req.user.id,
      reviewee: revieweeId,
      donation: donationId,
      rating: Number(rating),
      comment,
    });

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:id
// @access  Public
export const getReviewsForUser = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
