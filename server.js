import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { protect } from './middleware/authMiddleware.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Models for inline stats API
import Donation from './models/Donation.js';
import Delivery from './models/Delivery.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('socketio', io);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Ensure upload directory exists
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Serve static uploads
app.use('/uploads', express.static(path.resolve('./public/uploads')));

// Real-time socket connections
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal socket room`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Mounting routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// @desc    Unified dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private (Donor, NGO, Volunteer)
app.get('/api/dashboard/stats', protect, async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    if (role === 'donor') {
      const totalCount = await Donation.countDocuments({ donor: userId });
      const completedCount = await Donation.countDocuments({ donor: userId, status: 'completed' });
      const activeCount = await Donation.countDocuments({ donor: userId, status: { $in: ['available', 'claimed'] } });
      
      const completedDonations = await Donation.find({ donor: userId, status: 'completed' });
      let mealsSaved = 0;
      let wastePrevented = 0;

      completedDonations.forEach((d) => {
        if (d.quantityUnit === 'servings') {
          mealsSaved += d.quantity;
          wastePrevented += d.quantity * 0.4;
        } else if (d.quantityUnit === 'kg') {
          wastePrevented += d.quantity;
          mealsSaved += Math.round(d.quantity / 0.4);
        } else {
          mealsSaved += d.quantity;
          wastePrevented += d.quantity * 0.5;
        }
      });

      return res.status(200).json({
        success: true,
        stats: {
          totalCount,
          completedCount,
          activeCount,
          mealsSaved,
          wastePrevented: Math.round(wastePrevented * 10) / 10,
        },
      });
    }

    if (role === 'ngo') {
      const claimedCount = await Donation.countDocuments({ claimedBy: userId });
      const completedCount = await Donation.countDocuments({ claimedBy: userId, status: 'completed' });
      const activeCount = await Donation.countDocuments({ claimedBy: userId, status: 'claimed' });

      const completedDonations = await Donation.find({ claimedBy: userId, status: 'completed' });
      let mealsDistributed = 0;
      let weightReceived = 0;

      completedDonations.forEach((d) => {
        if (d.quantityUnit === 'servings') {
          mealsDistributed += d.quantity;
          weightReceived += d.quantity * 0.4;
        } else if (d.quantityUnit === 'kg') {
          weightReceived += d.quantity;
          mealsDistributed += Math.round(d.quantity / 0.4);
        } else {
          mealsDistributed += d.quantity;
          weightReceived += d.quantity * 0.5;
        }
      });

      return res.status(200).json({
        success: true,
        stats: {
          claimedCount,
          completedCount,
          activeCount,
          mealsDistributed,
          weightReceived: Math.round(weightReceived * 10) / 10,
        },
      });
    }

    if (role === 'volunteer') {
      const activeCount = await Delivery.countDocuments({ volunteer: userId, status: { $in: ['assigned', 'picked_up'] } });
      const completedCount = await Delivery.countDocuments({ volunteer: userId, status: 'delivered' });
      const points = completedCount * 50;

      // Simple leaderboard rank query
      const allRanks = await Delivery.aggregate([
        { $match: { status: 'delivered', volunteer: { $ne: null } } },
        { $group: { _id: '$volunteer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      let rank = 1;
      for (let i = 0; i < allRanks.length; i++) {
        if (allRanks[i]._id.toString() === userId.toString()) {
          rank = i + 1;
          break;
        }
      }

      return res.status(200).json({
        success: true,
        stats: {
          activeCount,
          completedCount,
          points,
          rank,
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid role request' });
  } catch (error) {
    next(error);
  }
});

// Fallback path check
app.get('/', (req, res) => {
  res.send('ZeroWaste API Server is running...');
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
