const express = require('express');
const router = express.Router();
const hotelController = require('../../controllers/Hotel/hotelController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

// Units
router.get('/units', hotelController.getUnits);
router.post('/units', hotelController.createUnit);
router.put('/units/:id', hotelController.updateUnit);

// Guests
router.get('/guests', hotelController.getGuests);
router.post('/guests', hotelController.createGuest);

// Bookings
router.get('/bookings', hotelController.getBookings);
router.post('/bookings', hotelController.createBooking);
router.put('/bookings/:id/status', hotelController.updateBookingStatus);

// Payments
router.get('/payments/booking/:bookingId', hotelController.getPaymentsByBooking);
router.post('/payments', hotelController.addPayment);

// Ops
router.get('/maintenance', hotelController.getMaintenance);

// Settings
router.get('/settings', hotelController.getSettings);
router.put('/settings', hotelController.updateSettings);

module.exports = router;
