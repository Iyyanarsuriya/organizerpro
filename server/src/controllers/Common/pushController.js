const PushSubscription = require('../../models/pushSubscriptionModel');
const pushService = require('../../services/pushNotificationService');

exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        await PushSubscription.create(req.user.id, subscription);
        res.status(201).json({ message: 'Push subscription saved' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getVapidPublicKey = (req, res) => {
    const key = pushService.getPublicKey();
    if (!key) {
        return res.status(500).json({ error: 'VAPID Public Key not configured' });
    }
    res.json({ publicKey: key });
};

exports.sendTestNotification = async (req, res) => {
    try {
        await pushService.sendNotification(req.user.id, {
            title: 'Test Notification',
            body: 'This is a test notification from ReminderApp! 🔔',
            url: '/'
        });
        res.json({ message: 'Test notification sent' });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
