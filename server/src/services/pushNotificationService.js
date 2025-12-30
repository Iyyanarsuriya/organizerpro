const webpush = require('web-push');
const PushSubscription = require('../models/pushSubscriptionModel');
const path = require('path');
// Try to load .env from server root if not already loaded
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configure web-push
const configureWebPush = () => {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        try {
            webpush.setVapidDetails(
                process.env.VAPID_MAILTO || 'mailto:admin@example.com',
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );
            return true;
        } catch (err) {
            console.error('VAPID Configuration Error:', err);
            return false;
        }
    }
    return false;
};

// Initial config attempt
configureWebPush();

exports.sendNotification = async (userId, payload) => {
    // Ensure config is ready before sending
    if (!process.env.VAPID_PUBLIC_KEY) configureWebPush();

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
    if (!process.env.VAPID_PUBLIC_KEY) {
        // Try reloading env if missing
        require('dotenv').config({ path: path.join(__dirname, '../../.env') });
        configureWebPush();
    }
    return process.env.VAPID_PUBLIC_KEY;
};
