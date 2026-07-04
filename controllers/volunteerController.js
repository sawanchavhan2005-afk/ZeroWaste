import Delivery from '../models/Delivery.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';

// @desc    Get all available deliveries for volunteers
// @route   GET /api/volunteers/deliveries/available
// @access  Private (Volunteer only)
export const getAvailableDeliveries = async (req, res, next) => {
  try {
    // Deliveries that are status 'assigned' and have no volunteer assigned yet
    const deliveries = await Delivery.find({ status: 'assigned', volunteer: null })
      .populate('donation')
      .populate('donor', 'name address location')
      .populate('ngo', 'name address location description');

    res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim a delivery for pickup
// @route   POST /api/volunteers/deliveries/:id/claim
// @access  Private (Volunteer only)
export const claimDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('donation')
      .populate('donor')
      .populate('ngo');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    if (delivery.volunteer) {
      return res.status(400).json({ success: false, message: 'This delivery has already been claimed by another volunteer' });
    }

    delivery.volunteer = req.user.id;
    await delivery.save();

    // Link volunteer to donation record too
    const donation = await Donation.findById(delivery.donation._id);
    if (donation) {
      donation.volunteer = req.user.id;
      await donation.save();
    }

    // Send notifications to donor and NGO
    await Notification.create({
      user: delivery.donor._id,
      message: `Volunteer ${req.user.name} has claimed pickup for your donation: "${delivery.donation.title}".`,
      type: 'delivery_assigned',
      relatedId: delivery._id,
    });

    await Notification.create({
      user: delivery.ngo._id,
      message: `Volunteer ${req.user.name} is on the way to pick up your claimed food: "${delivery.donation.title}".`,
      type: 'delivery_assigned',
      relatedId: delivery._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('deliveryClaimed', {
        deliveryId: delivery._id,
        volunteerName: req.user.name,
        donorId: delivery.donor._id,
        ngoId: delivery.ngo._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery claimed successfully',
      delivery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active/claimed deliveries of the logged in volunteer
// @route   GET /api/volunteers/deliveries/my
// @access  Private (Volunteer only)
export const getMyDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({ volunteer: req.user.id })
      .populate('donation')
      .populate('donor', 'name phone address location')
      .populate('ngo', 'name phone address location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer leaderboard
// @route   GET /api/volunteers/leaderboard
// @access  Public
export const getLeaderboard = async (req, res, next) => {
  try {
    // Aggregation to count completed deliveries per volunteer and return top 10
    const leaderboard = await Delivery.aggregate([
      { $match: { status: 'delivered', volunteer: { $ne: null } } },
      {
        $group: {
          _id: '$volunteer',
          completedDeliveries: { $sum: 1 },
        },
      },
      { $sort: { completedDeliveries: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'volunteerInfo',
        },
      },
      { $unwind: '$volunteerInfo' },
      {
        $project: {
          _id: 1,
          completedDeliveries: 1,
          name: '$volunteerInfo.name',
          vehicleType: '$volunteerInfo.vehicleType',
          rating: '$volunteerInfo.rating',
          createdAt: '$volunteerInfo.createdAt',
        },
      },
    ]);

    // Fill in default leaderboard items if database is empty for UX presentation
    if (leaderboard.length === 0) {
      // Return empty array
    }

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
};
