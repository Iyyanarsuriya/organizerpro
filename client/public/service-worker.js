self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '🚀 Task Alert!';
    const options = {
        body: data.body || 'One of your priorities is due now.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'done', title: 'Done' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // If 'Done' button clicked, just close (already closing)
    if (event.action === 'done') {
        return;
    }

    // If body clicked (no action) or any other part, open/focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if window already exists
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open new
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
