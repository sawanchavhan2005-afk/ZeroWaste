import Donation from '../models/Donation.js';
import Delivery from '../models/Delivery.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadImage } from '../utils/upload.js';
import { sendEmail } from '../utils/email.js';

// @desc    Create a food donation
// @route   POST /api/donations
// @access  Private (Donor only)
export const createDonation = async (req, res, next) => {
  try {
    const { title, description, foodType, quantity, quantityUnit, expiryTime, pickupAddress, lat, lng } = req.body;

    let photoUrl = '';
    if (req.file) {
      photoUrl = await uploadImage(req.file);
    }

    const donation = await Donation.create({
      donor: req.user.id,
      title,
      description,
      foodType,
      quantity: Number(quantity),
      quantityUnit: quantityUnit || 'servings',
      photos: photoUrl ? [photoUrl] : [],
      expiryTime: new Date(expiryTime),
      pickupAddress,
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
    });

    // Notify NGOs & Volunteers via Socket.IO
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newDonation', {
        id: donation._id,
        title: donation.title,
        foodType: donation.foodType,
        quantity: donation.quantity,
        quantityUnit: donation.quantityUnit,
        pickupAddress: donation.pickupAddress,
        location: donation.location,
        donorName: req.user.name,
      });
    }

    // Save Notifications in DB for all NGOs
    const ngos = await User.find({ role: 'ngo' });
    const notificationPromises = ngos.map((ngo) => {
      return Notification.create({
        user: ngo._id,
        message: `New food donation available: ${donation.title} from ${req.user.name}`,
        type: 'donation_created',
        relatedId: donation._id,
      });
    });
    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available donations with filtering, searching, and sorting
// @route   GET /api/donations
// @access  Public
export const getDonations = async (req, res, next) => {
  try {
    const { search, foodType, status, limit } = req.query;

    const query = {};

    // Filter by availability by default (available)
    if (status) {
      query.status = status;
    } else {
      query.status = 'available';
    }

    // Filter by food type
    if (foodType && foodType !== 'All') {
      query.foodType = foodType;
    }

    // Text search query matching title or address
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } },
      ];
    }

    // Do not show expired food
    query.expiryTime = { $gt: new Date() };

    let donationsQuery = Donation.find(query)
      .populate('donor', 'name phone rating')
      .sort({ createdAt: -1 });

    if (limit) {
      donationsQuery = donationsQuery.limit(Number(limit));
    }

    const donations = await donationsQuery;

    res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single donation detail
// @route   GET /api/donations/:id
// @access  Public
export const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone rating address donorType')
      .populate('claimedBy', 'name phone description registrationNumber verified');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donor's own donations
// @route   GET /api/donations/my/donations
// @access  Private (Donor only)
export const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate('claimedBy', 'name phone rating')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    NGO claims/accepts a donation
// @route   POST /api/donations/:id/claim
// @access  Private (NGO only)
export const claimDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Donation is already claimed or completed' });
    }

    // Check if NGO is verified
    if (!req.user.verified) {
      return res.status(403).json({ success: false, message: 'NGO registration is pending administrator verification' });
    }

    donation.status = 'claimed';
    donation.claimedBy = req.user.id;
    await donation.save();

    // Create a new Delivery record
    const delivery = await Delivery.create({
      donation: donation._id,
      donor: donation.donor._id,
      ngo: req.user.id,
      status: 'assigned',
    });

    // Notify Donor in DB and Socket.IO
    await Notification.create({
      user: donation.donor._id,
      message: `Your donation "${donation.title}" has been claimed by NGO: ${req.user.name}. A volunteer can now pick it up.`,
      type: 'donation_claimed',
      relatedId: donation._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('donationClaimed', {
        donationId: donation._id,
        ngoName: req.user.name,
        title: donation.title,
        donorId: donation.donor._id,
      });

      // Broadcast to volunteers that a pickup is ready
      io.emit('deliveryAvailable', {
        deliveryId: delivery._id,
        donationTitle: donation.title,
        pickupAddress: donation.pickupAddress,
        deliveryAddress: req.user.address,
      });
    }

    // Send email notification to donor
    await sendEmail({
      email: donation.donor.email,
      subject: `Donation Claimed - ZeroWaste`,
      html: `
        <h3>Hello ${donation.donor.name},</h3>
        <p>Good news! Your food donation <strong>"${donation.title}"</strong> has been accepted by the NGO <strong>"${req.user.name}"</strong>.</p>
        <p>A volunteer will be dispatched to pick up the food from: <br/><strong>${donation.pickupAddress}</strong></p>
        <p>Thank you for helping us reduce food waste and fight hunger!</p>
        <p>Best regards,<br/>ZeroWaste Team</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Donation claimed successfully. Delivery initiated.',
      delivery,
    });
  } catch (error) {
    next(error);
  }
};
