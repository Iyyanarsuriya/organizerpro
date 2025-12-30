const webpush = require('web-push');
const PushSubscription = require('../models/pushSubscriptionModel');
require('dotenv').config();

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_MAILTO || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('⚠️ VAPID keys are missing. Push notifications will not work.');
}

exports.sendNotification = async (userId, payload) => {
    try {
        const subscriptions = await PushSubscription.getByUserId(userId);
        if (!subscriptions || subscriptions.length === 0) return;

        const notifications = subscriptions.map(sub => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return webpush.sendNotification(pushConfig, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription has expired or is no longer valid
                        console.log('Push subscription expired, deleting:', sub.endpoint);
                        return PushSubscription.deleteByEndpoint(sub.endpoint);
                    }
                    console.error('Error sending push notification:', err);
                });
        });

        await Promise.all(notifications);
        return true;
    } catch (error) {
        console.error('Error in sendNotification service:', error);
        return false;
    }
};

exports.getPublicKey = () => {
    return process.env.VAPID_PUBLIC_KEY;
};
