import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please add a rating between 1 and 5'],
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Static method to get average rating and save to User
ReviewSchema.statics.getAverageRating = async function (userId) {
  const obj = await this.aggregate([
    { $match: { reviewee: userId } },
    {
      $group: {
        _id: '$reviewee',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (obj.length > 0) {
      await mongoose.model('User').findByIdAndUpdate(userId, {
        rating: Math.round(obj[0].averageRating * 10) / 10,
      });
    } else {
      await mongoose.model('User').findByIdAndUpdate(userId, {
        rating: 5.0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.reviewee);
});

// Call getAverageRating before delete
ReviewSchema.post('remove', async function () {
  await this.constructor.getAverageRating(this.reviewee);
});

export default mongoose.model('Review', ReviewSchema);
