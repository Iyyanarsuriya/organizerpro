const db = require('../../config/db');

// --- Units ---
const getUnits = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hotel_units WHERE user_id = ? ORDER BY unit_number ASC', [req.user.data_owner_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createUnit = async (req, res) => {
    try {
        const { unit_number, unit_type, category, base_price, capacity, description } = req.body;
        const [result] = await db.query(
            'INSERT INTO hotel_units (user_id, unit_number, unit_type, category, base_price, capacity, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.data_owner_id, unit_number, unit_type, category, base_price, capacity, description]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUnit = async (req, res) => {
    try {
        const { unit_number, unit_type, category, base_price, capacity, status, description } = req.body;
        await db.query(
            'UPDATE hotel_units SET unit_number=?, unit_type=?, category=?, base_price=?, capacity=?, status=?, description=? WHERE id=? AND user_id=?',
            [unit_number, unit_type, category, base_price, capacity, status, description, req.params.id, req.user.data_owner_id]
        );
        res.status(200).json({ success: true, message: 'Unit updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Guests ---
const getGuests = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hotel_guests WHERE user_id = ? ORDER BY name ASC', [req.user.data_owner_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createGuest = async (req, res) => {
    try {
        const { name, email, phone, id_proof_type, id_proof_number, address } = req.body;
        const [result] = await db.query(
            'INSERT INTO hotel_guests (user_id, name, email, phone, id_proof_type, id_proof_number, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.data_owner_id, name, email, phone, id_proof_type, id_proof_number, address]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Bookings ---
const getBookings = async (req, res) => {
    try {
        const query = `
            SELECT b.*, g.name as guest_name, g.phone as guest_phone, u.unit_number, u.unit_type, u.category as unit_category
            FROM hotel_bookings b
            JOIN hotel_guests g ON b.guest_id = g.id
            JOIN hotel_units u ON b.unit_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.check_in DESC
        `;
        const [rows] = await db.query(query, [req.user.data_owner_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createBooking = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const { guest_id, unit_id, check_in, check_out, total_amount, advance_paid, booking_source, notes } = req.body;

        // 1. Availability Logic (Integration Testing Case)
        const [overlap] = await connection.query(
            'SELECT id FROM hotel_bookings WHERE unit_id = ? AND status != "cancelled" AND ((check_in BETWEEN ? AND ?) OR (check_out BETWEEN ? AND ?))',
            [unit_id, check_in, check_out, check_in, check_out]
        );

        if (overlap.length > 0) {
            throw new Error('Unit is already booked for these dates');
        }

        // 2. Create Booking
        const [result] = await connection.query(
            'INSERT INTO hotel_bookings (user_id, guest_id, unit_id, check_in, check_out, total_amount, advance_paid, booking_source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.data_owner_id, guest_id, unit_id, check_in, check_out, total_amount, advance_paid, booking_source, notes]
        );

        const bookingId = result.insertId;

        // Get guest name for transaction title
        const [guestData] = await connection.query('SELECT name FROM hotel_guests WHERE id = ?', [guest_id]);
        const guestName = guestData[0]?.name || 'Guest';

        // 3. Record Payment if advance paid
        if (parseFloat(advance_paid) > 0) {
            // Record in payments table
            await connection.query(
                'INSERT INTO hotel_payments (user_id, booking_id, amount, payment_method, remark) VALUES (?, ?, ?, ?, ?)',
                [req.user.data_owner_id, bookingId, advance_paid, 'cash', 'Advance payment']
            );

            // ✅ CRITICAL: Also record in transactions table for revenue tracking
            await connection.query(
                'INSERT INTO hotel_transactions (user_id, title, amount, type, category, date, guest_name, payment_status) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)',
                [req.user.data_owner_id, `Booking Advance - ${guestName} (Booking #${bookingId})`, advance_paid, 'income', 'Room Revenue', guestName, 'completed']
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, id: bookingId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE hotel_bookings SET status = ? WHERE id = ? AND user_id = ?', [status, req.params.id, req.user.data_owner_id]);

        // Update unit status based on booking status
        const [booking] = await db.query('SELECT unit_id FROM hotel_bookings WHERE id = ?', [req.params.id]);
        if (booking.length > 0) {
            let unitStatus = 'available';
            if (status === 'checked_in') unitStatus = 'occupied';
            if (status === 'checked_out') unitStatus = 'dirty';

            await db.query('UPDATE hotel_units SET status = ? WHERE id = ?', [unitStatus, booking[0].unit_id]);
        }

        res.status(200).json({ success: true, message: 'Booking status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Payments ---
const getPaymentsByBooking = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hotel_payments WHERE booking_id = ? AND user_id = ?', [req.params.bookingId, req.user.data_owner_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addPayment = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const { booking_id, amount, payment_method, remark } = req.body;

        // Get booking and guest details
        const [booking] = await connection.query(
            'SELECT b.id, b.total_amount, g.name as guest_name FROM hotel_bookings b JOIN hotel_guests g ON b.guest_id = g.id WHERE b.id = ? AND b.user_id = ?',
            [booking_id, req.user.data_owner_id]
        );

        if (booking.length === 0) {
            throw new Error('Booking not found');
        }

        const { guest_name } = booking[0];

        // Record in payments table
        await connection.query(
            'INSERT INTO hotel_payments (user_id, booking_id, amount, payment_method, remark) VALUES (?, ?, ?, ?, ?)',
            [req.user.data_owner_id, booking_id, amount, payment_method, remark || 'Payment']
        );

        // Record in transactions table for revenue tracking
        await connection.query(
            'INSERT INTO hotel_transactions (user_id, title, amount, type, category, date, guest_name, payment_status) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)',
            [req.user.data_owner_id, `Booking Payment - ${guest_name} (Booking #${booking_id})`, amount, 'income', 'Room Revenue', guest_name, 'completed']
        );

        // Check if booking is now fully paid
        const [payments] = await connection.query(
            'SELECT SUM(amount) as total_paid FROM hotel_payments WHERE booking_id = ?',
            [booking_id]
        );

        const totalPaid = parseFloat(payments[0].total_paid || 0);
        const totalAmount = parseFloat(booking[0].total_amount);

        if (totalPaid >= totalAmount) {
            await connection.query(
                'UPDATE hotel_bookings SET status = ? WHERE id = ?',
                ['checked_out', booking_id]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Payment recorded', total_paid: totalPaid });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// --- Operations / Maintenance ---
const getMaintenance = async (req, res) => {
    try {
        const query = `
            SELECT m.*, u.unit_number, u.unit_type
            FROM hotel_maintenance m
            JOIN hotel_units u ON m.unit_id = u.id
            WHERE m.user_id = ?
            ORDER BY m.scheduled_date ASC
        `;
        const [rows] = await db.query(query, [req.user.data_owner_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Settings ---
const getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hotel_settings WHERE user_id = ?', [req.user.data_owner_id]);
        if (rows.length === 0) return res.status(200).json({ success: true, data: {} });
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { property_name, property_type, currency, tax_percentage, check_in_time, check_out_time } = req.body;
        // Check if exists
        const [existing] = await db.query('SELECT id FROM hotel_settings WHERE user_id = ?', [req.user.data_owner_id]);

        if (existing.length > 0) {
            await db.query(
                'UPDATE hotel_settings SET property_name=?, property_type=?, currency=?, tax_percentage=?, check_in_time=?, check_out_time=? WHERE user_id=?',
                [property_name, property_type, currency, tax_percentage, check_in_time, check_out_time, req.user.data_owner_id]
            );
        } else {
            await db.query(
                'INSERT INTO hotel_settings (user_id, property_name, property_type, currency, tax_percentage, check_in_time, check_out_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.user.data_owner_id, property_name, property_type, currency, tax_percentage, check_in_time, check_out_time]
            );
        }
        res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getUnits, createUnit, updateUnit,
    getGuests, createGuest,
    getBookings, createBooking, updateBookingStatus,
    getPaymentsByBooking, addPayment,
    getMaintenance,
    getSettings, updateSettings
};
