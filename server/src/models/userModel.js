const db = require('../config/db');

exports.findByEmail = async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

exports.findById = async (id) => {
    const [rows] = await db.query('SELECT id, username, email, mobile_number, profile_image, google_refresh_token FROM users WHERE id = ?', [id]);
    return rows[0];
};

exports.create = async (userData) => {
    const { username, email, password, mobile_number } = userData;
    const [result] = await db.query(
        'INSERT INTO users (username, email, password, mobile_number) VALUES (?, ?, ?, ?)',
        [username, email, password, mobile_number || null]
    );
    return result.insertId;
};

exports.update = async (id, userData) => {
    const { username, email, mobile_number, profile_image, google_refresh_token } = userData;
    let query = 'UPDATE users SET ';
    const updates = [];
    const params = [];

    if (username) { updates.push('username = ?'); params.push(username); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (mobile_number !== undefined) { updates.push('mobile_number = ?'); params.push(mobile_number); }
    if (profile_image !== undefined) { updates.push('profile_image = ?'); params.push(profile_image); }
    if (google_refresh_token !== undefined) { updates.push('google_refresh_token = ?'); params.push(google_refresh_token); }

    if (updates.length === 0) return true;

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
};

exports.updatePassword = async (id, hashedPassword) => {
    const [result] = await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
    );
    return result.affectedRows > 0;
};

// OTP-based password reset methods
exports.saveOTP = async (email, otp, expiry) => {
    // Use Date object - mysql2 formats this correctly for DATETIME columns
    const dateObj = expiry ? new Date(expiry) : null;
    const finalExpiry = (dateObj && !isNaN(dateObj.getTime())) ? dateObj : null;

    const [result] = await db.query(
        'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?',
        [otp, finalExpiry, email]
    );
    return result.affectedRows > 0;
};

exports.findByEmailAndOTP = async (email, otp) => {
    const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expiry > NOW()',
        [email, otp]
    );
    return rows[0];
};

exports.clearOTP = async (email) => {
    const [result] = await db.query(
        'UPDATE users SET reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?',
        [email]
    );
    return result.affectedRows > 0;
};
