const db = require('../config/db');

exports.create = async (userId, subscription) => {
    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Check if subscription already exists to avoid duplicates
    const [existing] = await db.query(
        'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
        [userId, endpoint]
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    const [result] = await db.query(
        'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
        [userId, endpoint, p256dh, auth]
    );
    return result.insertId;
};

exports.getByUserId = async (userId) => {
    const [rows] = await db.query('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]);
    return rows;
};

exports.deleteByEndpoint = async (endpoint) => {
    const [result] = await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    return result.affectedRows > 0;
};
