import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtsignaturekeyforzerowasteproject123!', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      lat,
      lng,
      donorType,
      vehicleType,
      registrationNumber,
      description,
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Build user object
    const userFields = {
      name,
      email,
      password,
      role,
      phone,
      address,
      location: {
        lat: Number(lat) || 21.1458,
        lng: Number(lng) || 79.0882,
      },
    };

    // Role specific fields
    if (role === 'donor') {
      userFields.donorType = donorType || 'individual';
    } else if (role === 'volunteer') {
      userFields.vehicleType = vehicleType || 'none';
    } else if (role === 'ngo') {
      userFields.registrationNumber = registrationNumber || '';
      userFields.description = description || '';
      // NGOs require verification by Admin, default is false
      userFields.verified = false;
    }

    const user = await User.create(userFields);

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location,
        verified: user.verified,
        donorType: user.donorType,
        vehicleType: user.vehicleType,
        registrationNumber: user.registrationNumber,
        description: user.description,
        rating: user.rating,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        location: user.location,
        verified: user.verified,
        donorType: user.donorType,
        vehicleType: user.vehicleType,
        registrationNumber: user.registrationNumber,
        description: user.description,
        rating: user.rating,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      
      if (req.body.lat && req.body.lng) {
        user.location = {
          lat: Number(req.body.lat),
          lng: Number(req.body.lng),
        };
      }

      if (user.role === 'donor' && req.body.donorType) {
        user.donorType = req.body.donorType;
      }
      if (user.role === 'volunteer' && req.body.vehicleType) {
        user.vehicleType = req.body.vehicleType;
      }
      if (user.role === 'ngo') {
        user.registrationNumber = req.body.registrationNumber || user.registrationNumber;
        user.description = req.body.description || user.description;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
          location: updatedUser.location,
          verified: updatedUser.verified,
          donorType: updatedUser.donorType,
          vehicleType: updatedUser.vehicleType,
          registrationNumber: updatedUser.registrationNumber,
          description: updatedUser.description,
          rating: updatedUser.rating,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};
