const db = require('../config/db');

exports.create = async (userId, subscription) => {
    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Check if subscription exists globally for ANY user
    const [existing] = await db.query(
        'SELECT id, user_id FROM push_subscriptions WHERE endpoint = ?',
        [endpoint]
    );

    if (existing.length > 0) {
        const record = existing[0];
        // If it belongs to another user, take ownership (Device switched users)
        if (record.user_id !== userId) {
            await db.query(
                'UPDATE push_subscriptions SET user_id = ? WHERE id = ?',
                [userId, record.id]
            );
        }
        return record.id;
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
