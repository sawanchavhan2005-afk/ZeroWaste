import Delivery from '../models/Delivery.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import { uploadImage } from '../utils/upload.js';
import { sendEmail } from '../utils/email.js';

// @desc    Update delivery status (assigned -> picked_up -> delivered)
// @route   PUT /api/deliveries/:id/status
// @access  Private (Volunteer only)
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id)
      .populate('donation')
      .populate('donor')
      .populate('ngo')
      .populate('volunteer');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    // Check if the volunteer updating is the assigned one
    if (delivery.volunteer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this delivery' });
    }

    let photoUrl = '';
    if (req.file) {
      photoUrl = await uploadImage(req.file);
    }

    if (status === 'picked_up') {
      delivery.status = 'picked_up';
      delivery.timeline.pickedUpAt = Date.now();
      if (photoUrl) {
        delivery.pickupPhoto = photoUrl;
      }

      await delivery.save();

      // Notify Donor and NGO
      await Notification.create({
        user: delivery.donor._id,
        message: `Your food donation "${delivery.donation.title}" has been picked up by volunteer ${req.user.name}.`,
        type: 'delivery_status',
        relatedId: delivery._id,
      });

      await Notification.create({
        user: delivery.ngo._id,
        message: `Volunteer ${req.user.name} has picked up your food "${delivery.donation.title}" and is en route.`,
        type: 'delivery_status',
        relatedId: delivery._id,
      });

      const io = req.app.get('socketio');
      if (io) {
        io.emit('deliveryStatusUpdate', {
          deliveryId: delivery._id,
          status: 'picked_up',
          donorId: delivery.donor._id,
          ngoId: delivery.ngo._id,
        });
      }
    } else if (status === 'delivered') {
      delivery.status = 'delivered';
      delivery.timeline.deliveredAt = Date.now();
      if (photoUrl) {
        delivery.deliveryPhoto = photoUrl;
      }

      await delivery.save();

      // Update Donation status to completed
      const donation = await Donation.findById(delivery.donation._id);
      if (donation) {
        donation.status = 'completed';
        await donation.save();
      }

      // Notify Donor and NGO
      await Notification.create({
        user: delivery.donor._id,
        message: `Your food donation "${delivery.donation.title}" was successfully delivered to ${delivery.ngo.name}! Thank you.`,
        type: 'delivery_status',
        relatedId: delivery._id,
      });

      await Notification.create({
        user: delivery.ngo._id,
        message: `Food donation "${delivery.donation.title}" has been delivered by ${req.user.name}.`,
        type: 'delivery_status',
        relatedId: delivery._id,
      });

      const io = req.app.get('socketio');
      if (io) {
        io.emit('deliveryStatusUpdate', {
          deliveryId: delivery._id,
          status: 'delivered',
          donorId: delivery.donor._id,
          ngoId: delivery.ngo._id,
        });
      }

      // Send emails to donor and NGO
      await sendEmail({
        email: delivery.donor.email,
        subject: `Donation Delivered! - ZeroWaste`,
        html: `
          <h3>Hello ${delivery.donor.name},</h3>
          <p>Great news! Your food donation <strong>"${delivery.donation.title}"</strong> has been successfully delivered to the NGO <strong>"${delivery.ngo.name}"</strong> by our volunteer <strong>${req.user.name}</strong>.</p>
          <p>Your contribution helped feed people in need and prevent food waste.</p>
          <p>Thank you for being an active partner in our mission!</p>
          <p>Best regards,<br/>ZeroWaste Team</p>
        `,
      });

      await sendEmail({
        email: delivery.ngo.email,
        subject: `Food Delivered - ZeroWaste`,
        html: `
          <h3>Hello ${delivery.ngo.name},</h3>
          <p>Your claimed food donation <strong>"${delivery.donation.title}"</strong> has been successfully delivered by volunteer <strong>${req.user.name}</strong>.</p>
          <p>Please log in to your dashboard to view the delivery details or leave a review.</p>
          <p>Best regards,<br/>ZeroWaste Team</p>
        `,
      });
    }

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      delivery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single delivery details
// @route   GET /api/deliveries/:id
// @access  Private
export const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('donation')
      .populate('donor', 'name phone address location email')
      .populate('ngo', 'name phone address location email registrationNumber description')
      .populate('volunteer', 'name phone vehicleType rating');

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    // Check authorization: only donor, ngo, volunteer involved OR admin can access
    const isAuthorized =
      req.user.role === 'admin' ||
      delivery.donor._id.toString() === req.user.id ||
      delivery.ngo._id.toString() === req.user.id ||
      (delivery.volunteer && delivery.volunteer._id.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this delivery record' });
    }

    res.status(200).json({
      success: true,
      delivery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of deliveries for logged in user (by role)
// @route   GET /api/deliveries
// @access  Private
export const getDeliveries = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'donor') filter.donor = req.user.id;
    if (req.user.role === 'ngo') filter.ngo = req.user.id;
    if (req.user.role === 'volunteer') filter.volunteer = req.user.id;

    const deliveries = await Delivery.find(filter)
      .populate('donation')
      .populate('donor', 'name phone address')
      .populate('ngo', 'name phone address')
      .populate('volunteer', 'name phone')
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
