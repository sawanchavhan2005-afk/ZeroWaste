import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['donor', 'volunteer', 'ngo', 'admin'],
    required: [true, 'Please specify a user role'],
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
  },
  location: {
    lat: { type: Number, default: 21.1458 },
    lng: { type: Number, default: 79.0882 },
  },
  // Role specific fields
  donorType: {
    type: String,
    enum: ['restaurant', 'hotel', 'supermarket', 'individual', ''],
    default: '',
  },
  vehicleType: {
    type: String,
    enum: ['bicycle', 'motorcycle', 'car', 'none', ''],
    default: '',
  },
  registrationNumber: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  verified: {
    type: Boolean,
    default: function () {
      return this.role !== 'ngo'; // NGOs require admin verification, others auto-verify or don't need it
    },
  },
  rating: {
    type: Number,
    default: 5.0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
