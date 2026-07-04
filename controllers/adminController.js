import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Delivery from '../models/Delivery.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/email.js';

// @desc    Get dashboard statistics for Admin
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res, next) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const activeVolunteers = await User.countDocuments({ role: 'volunteer' });
    const registeredNgos = await User.countDocuments({ role: 'ngo' });
    const completedDeliveries = await Delivery.countDocuments({ status: 'delivered' });

    // Calculate meals saved & food waste prevented from completed donations
    const completedDonations = await Donation.find({ status: 'completed' });
    let mealsSaved = 0;
    let foodWastePrevented = 0; // in kg

    completedDonations.forEach((d) => {
      if (d.quantityUnit === 'servings') {
        mealsSaved += d.quantity;
        foodWastePrevented += d.quantity * 0.4; // assume 400g per serving
      } else if (d.quantityUnit === 'kg') {
        foodWastePrevented += d.quantity;
        mealsSaved += Math.round(d.quantity / 0.4);
      } else {
        mealsSaved += d.quantity;
        foodWastePrevented += d.quantity * 0.5; // units conversion
      }
    });

    // Aggregate food type distribution
    const foodTypeDistribution = await Donation.aggregate([
      {
        $group: {
          _id: '$foodType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly completed donation trends (last 6 months simulated)
    const monthlyStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Translate month numbers to labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = monthlyStats.map((item) => ({
      name: months[item._id - 1] || `Month ${item._id}`,
      donations: item.count,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalDonations,
        mealsSaved: Math.round(mealsSaved),
        foodWastePrevented: Math.round(foodWastePrevented * 10) / 10,
        activeVolunteers,
        registeredNgos,
        completedDeliveries,
        foodTypeDistribution,
        monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }
    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify pending NGO
// @route   PUT /api/admin/ngos/:id/verify
// @access  Private (Admin only)
export const verifyNgo = async (req, res, next) => {
  try {
    const ngo = await User.findById(req.params.id);

    if (!ngo || ngo.role !== 'ngo') {
      return res.status(404).json({ success: false, message: 'NGO user not found' });
    }

    ngo.verified = true;
    await ngo.save();

    // Notify NGO
    await Notification.create({
      user: ngo._id,
      message: 'Congratulations! Your NGO registration has been verified by the administrator. You can now claim donations.',
      type: 'ngo_verified',
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('ngoVerified', {
        ngoId: ngo._id,
        name: ngo.name,
      });
    }

    // Send email alert to NGO
    await sendEmail({
      email: ngo.email,
      subject: `NGO Profile Verified - ZeroWaste`,
      html: `
        <h3>Hello ${ngo.name},</h3>
        <p>Your registration on the <strong>ZeroWaste Platform</strong> has been successfully reviewed and verified by our administrators!</p>
        <p>You can now log in to access the NGO dashboard, view donations on the Nagpur food map, and claim surplus food requests.</p>
        <p>Thank you for collaborating with us to fight hunger!</p>
        <p>Best regards,<br/>ZeroWaste Admin Team</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'NGO verified successfully',
      ngo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
