const express = require('express');
const router = express.Router();
const db = require('../Config/db');
const { authenticateToken } = require('../Controllers/authController');

router.post('/subscribe', authenticateToken, async (req, res) => {
    const { subscription } = req.body;
    const userId = req.user.id;

    try {
        // Save or update subscription
        // We store it as JSON string or in a dedicated JSON column if mysql supports it
        await db.query(
            'INSERT INTO push_subscriptions (user_id, subscription_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE subscription_data = ?',
            [userId, JSON.stringify(subscription), JSON.stringify(subscription)]
        );

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

module.exports = router;
