import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: [true, 'Please add a notification message'],
  },
  type: {
    type: String,
    enum: [
      'donation_created',
      'donation_claimed',
      'delivery_assigned',
      'delivery_status',
      'info',
      'review',
      'ngo_verified',
    ],
    default: 'info',
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Notification', NotificationSchema);
