import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Delivery from '../models/Delivery.js';
import Notification from '../models/Notification.js';
import Review from '../models/Review.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zerowaste');
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany();
    await Donation.deleteMany();
    await Delivery.deleteMany();
    await Notification.deleteMany();
    await Review.deleteMany();
    console.log('Existing data cleared.');

    // Create Admin User
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@zerowaste.org',
      password: 'password123',
      role: 'admin',
      phone: '9876543210',
      address: 'ZeroWaste Headquarters, Sitabuldi, Nagpur',
      location: { lat: 21.1458, lng: 79.0882 },
      verified: true,
    });
    console.log('Admin user seeded.');

    // Create Donors
    const donor1 = await User.create({
      name: "Haldiram's Sitabuldi",
      email: 'haldirams@nagpur.com',
      password: 'password123',
      role: 'donor',
      donorType: 'restaurant',
      phone: '9123456780',
      address: 'Abhyankar Marg, Sitabuldi, Nagpur, Maharashtra 440012',
      location: { lat: 21.1432, lng: 79.0818 },
      verified: true,
    });

    const donor2 = await User.create({
      name: 'Hotel Ashoka Sadar',
      email: 'ashoka@hotel.com',
      password: 'password123',
      role: 'donor',
      donorType: 'hotel',
      phone: '9123456781',
      address: 'Mount Road, Sadar, Nagpur, Maharashtra 440001',
      location: { lat: 21.1627, lng: 79.0805 },
      verified: true,
    });

    const donor3 = await User.create({
      name: 'Reliance Fresh Manish Nagar',
      email: 'relfresh@manishnagar.com',
      password: 'password123',
      role: 'donor',
      donorType: 'supermarket',
      phone: '9123456782',
      address: 'Manish Nagar Main Rd, Nagpur, Maharashtra 440015',
      location: { lat: 21.0965, lng: 79.0888 },
      verified: true,
    });
    console.log('Donors seeded.');

    // Create NGOs
    const ngo1 = await User.create({
      name: 'Nagpur Food Bank',
      email: 'nagpurfoodbank@ngo.org',
      password: 'password123',
      role: 'ngo',
      registrationNumber: 'NFB-NGO-2023-89',
      description: 'Serving meals to underprivileged families near Nagpur railway station and slums.',
      phone: '9890123456',
      address: 'Central Avenue, Wardhaman Nagar, Nagpur, Maharashtra 440008',
      location: { lat: 21.1550, lng: 79.1270 },
      verified: true,
    });

    const ngo2 = await User.create({
      name: 'Robin Hood Army Nagpur',
      email: 'robinhood@ngo.org',
      password: 'password123',
      role: 'ngo',
      registrationNumber: 'RHA-NGO-4402',
      description: 'Zero-funds volunteer organization routing surplus food to hungry citizens.',
      phone: '9890123457',
      address: 'Gokulpeth Market Rd, Dharampeth, Nagpur, Maharashtra 440010',
      location: { lat: 21.1408, lng: 79.0628 },
      verified: true,
    });

    const ngo3 = await User.create({
      name: 'Asha Kiran Foundation',
      email: 'ashakiran@ngo.org',
      password: 'password123',
      role: 'ngo',
      registrationNumber: 'AKF-NGO-998',
      description: 'Shelter home and care for abandoned children and widows.',
      phone: '9890123458',
      address: 'Trimurti Nagar, Ring Road, Nagpur, Maharashtra 440022',
      location: { lat: 21.1215, lng: 79.0495 },
      verified: false, // Pending verification
    });
    console.log('NGOs seeded.');

    // Create Volunteers
    const vol1 = await User.create({
      name: 'Amit Deshmukh',
      email: 'amit@volunteer.com',
      password: 'password123',
      role: 'volunteer',
      vehicleType: 'motorcycle',
      phone: '9422102030',
      address: 'Ramdaspeth, Nagpur, Maharashtra 440010',
      location: { lat: 21.1350, lng: 79.0768 },
      verified: true,
    });

    const vol2 = await User.create({
      name: 'Sneha Patil',
      email: 'sneha@volunteer.com',
      password: 'password123',
      role: 'volunteer',
      vehicleType: 'bicycle',
      phone: '9422102031',
      address: 'Nandanvan, Nagpur, Maharashtra 440009',
      location: { lat: 21.1398, lng: 79.1242 },
      verified: true,
    });
    console.log('Volunteers seeded.');

    // Create Donations
    const expiryToday = new Date();
    expiryToday.setHours(expiryToday.getHours() + 6); // Expires in 6 hours

    const expiryTomorrow = new Date();
    expiryTomorrow.setDate(expiryTomorrow.getDate() + 1); // Expires in 24 hours

    const don1 = await Donation.create({
      donor: donor1._id,
      title: 'Surplus Samosas & Kachoris',
      description: 'Freshly fried samosas and kachoris left from high-noon stock. Still warm and crisp.',
      foodType: 'Veg',
      quantity: 50,
      quantityUnit: 'servings',
      photos: ['https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop'],
      expiryTime: expiryToday,
      pickupAddress: 'Haldiram\'s, Abhyankar Marg, Sitabuldi, Nagpur',
      location: { lat: 21.1432, lng: 79.0818 },
      status: 'available',
    });

    const don2 = await Donation.create({
      donor: donor2._id,
      title: 'Buffet Main Course Meals',
      description: 'Paneer Butter Masala, Dal Makhani, Jeera Rice, and Butter Naan from hotel dinner buffet. Properly refrigerated.',
      foodType: 'Veg',
      quantity: 35,
      quantityUnit: 'servings',
      photos: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop'],
      expiryTime: expiryToday,
      pickupAddress: 'Hotel Ashoka, Mount Road, Sadar, Nagpur',
      location: { lat: 21.1627, lng: 79.0805 },
      status: 'available',
    });

    const don3 = await Donation.create({
      donor: donor3._id,
      title: 'Fresh Bread, Milk & Groceries',
      description: 'Packaged sandwich bread (expires tomorrow) and 20 packets of fresh milk. Stored in deep freezer.',
      foodType: 'Bakery',
      quantity: 25,
      quantityUnit: 'units',
      photos: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop'],
      expiryTime: expiryTomorrow,
      pickupAddress: 'Reliance Fresh, Manish Nagar Main Rd, Nagpur',
      location: { lat: 21.0965, lng: 79.0888 },
      status: 'available',
    });

    // Create a claimed and completed donation to populate history and leaderboard
    const don4 = await Donation.create({
      donor: donor2._id,
      title: 'Leftover Chole Bhature Buffet',
      description: 'Chole bhature surplus from breakfast buffet. High quality.',
      foodType: 'Veg',
      quantity: 40,
      quantityUnit: 'servings',
      photos: ['https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&auto=format&fit=crop'],
      expiryTime: new Date(Date.now() - 2 * 3600000), // Expired already but completed past delivery
      pickupAddress: 'Hotel Ashoka, Mount Road, Sadar, Nagpur',
      location: { lat: 21.1627, lng: 79.0805 },
      status: 'completed',
      claimedBy: ngo1._id,
      volunteer: vol1._id,
    });

    // Create corresponding Delivery
    await Delivery.create({
      donation: don4._id,
      donor: donor2._id,
      ngo: ngo1._id,
      volunteer: vol1._id,
      status: 'delivered',
      timeline: {
        assignedAt: new Date(Date.now() - 6 * 3600000),
        pickedUpAt: new Date(Date.now() - 5 * 3600000),
        deliveredAt: new Date(Date.now() - 4 * 3600000),
      },
      pickupPhoto: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop',
      deliveryPhoto: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop',
    });

    // Trigger average rating aggregation via review
    await Review.create({
      reviewer: ngo1._id,
      reviewee: vol1._id,
      donation: don4._id,
      rating: 5,
      comment: 'Excellent prompt pickup and safe delivery to our food center. Sneha was very cooperative.',
    });

    await Review.create({
      reviewer: ngo1._id,
      reviewee: donor2._id,
      donation: don4._id,
      rating: 4,
      comment: 'The hotel staff packaged the surplus buffet meals beautifully. Food was fresh and tasty.',
    });

    console.log('Mock donations and historical logs seeded.');
    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
