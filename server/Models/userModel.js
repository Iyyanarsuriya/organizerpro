const db = require('../Config/db');

exports.findByEmail = async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

exports.findById = async (id) => {
    const [rows] = await db.query('SELECT id, username, email, mobile_number, profile_image FROM users WHERE id = ?', [id]);
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
    const { username, email, mobile_number, profile_image } = userData;
    let query = 'UPDATE users SET username = ?, email = ?, mobile_number = ?';
    const params = [username, email, mobile_number];

    if (profile_image !== undefined) {
        query += ', profile_image = ?';
        params.push(profile_image);
    }

    query += ' WHERE id = ?';
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
    const [result] = await db.query(
        'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?',
        [otp, expiry, email]
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
