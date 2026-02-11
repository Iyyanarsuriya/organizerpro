const db = require('../../config/db');

exports.getVendors = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hotel_vendors WHERE user_id = ? ORDER BY name ASC', [req.user.data_owner_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createVendor = async (req, res) => {
    try {
        const { name, contact, email, gst_number, address } = req.body;
        const [result] = await db.query(
            'INSERT INTO hotel_vendors (user_id, name, contact, email, gst_number, address) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.data_owner_id, name, contact, email, gst_number, address]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateVendor = async (req, res) => {
    try {
        const { name, contact, email, gst_number, address } = req.body;
        await db.query(
            'UPDATE hotel_vendors SET name=?, contact=?, email=?, gst_number=?, address=? WHERE id=? AND user_id=?',
            [name, contact, email, gst_number, address, req.params.id, req.user.data_owner_id]
        );
        res.status(200).json({ success: true, message: 'Vendor updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteVendor = async (req, res) => {
    try {
        await db.query('DELETE FROM hotel_vendors WHERE id=? AND user_id=?', [req.params.id, req.user.data_owner_id]);
        res.status(200).json({ success: true, message: 'Vendor deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
