import mongoose from 'mongoose';

const DeliverySchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'delivered', 'cancelled'],
    default: 'assigned',
  },
  timeline: {
    assignedAt: { type: Date, default: Date.now },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
  },
  pickupPhoto: {
    type: String,
    default: '',
  },
  deliveryPhoto: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Delivery', DeliverySchema);
