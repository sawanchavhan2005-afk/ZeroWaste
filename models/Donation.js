import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  foodType: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Bakery', 'Groceries', 'Mixed'],
    required: [true, 'Please select food type'],
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify quantity'],
  },
  quantityUnit: {
    type: String,
    enum: ['servings', 'kg', 'units'],
    default: 'servings',
  },
  photos: {
    type: [String],
    default: [],
  },
  expiryTime: {
    type: Date,
    required: [true, 'Please specify expiry time'],
  },
  pickupAddress: {
    type: String,
    required: [true, 'Please add a pickup address'],
  },
  location: {
    lat: {
      type: Number,
      required: [true, 'Please add latitude'],
    },
    lng: {
      type: Number,
      required: [true, 'Please add longitude'],
    },
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'completed', 'cancelled'],
    default: 'available',
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Donation', DonationSchema);
