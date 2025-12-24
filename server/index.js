const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const webpush = require("web-push");
const cron = require("node-cron");
const db = require("./Config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/notifications", notificationRoutes);

// Configure Web Push
webpush.setVapidDetails(
    "mailto:example@yourdomain.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Initialize Database Tables
async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                subscription_data JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_sub (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Database initialized");
    } catch (err) {
        console.error("❌ DB Initialization failed:", err);
    }
}
initDB();

// Cron Job: Check for due reminders every minute and send push
cron.schedule("* * * * *", async () => {
    try {
        // Get reminders due in the next minute that are not completed
        // We select user subscription data too
        const [reminders] = await db.query(`
            SELECT r.*, s.subscription_data 
            FROM reminders r
            JOIN push_subscriptions s ON r.user_id = s.user_id
            WHERE r.is_completed = 0 
            AND r.due_date <= NOW() 
            AND r.due_date > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        `);

        for (const reminder of reminders) {
            const subscription = JSON.parse(reminder.subscription_data);
            const payload = JSON.stringify({
                title: "🚀 Task Alert!",
                body: `Heads up! "${reminder.title}" is due now.`,
                tag: `reminder-${reminder.id}`,
                url: "/"
            });

            webpush.sendNotification(subscription, payload).catch(err => {
                console.error("Push failed for user", reminder.user_id, err);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired or removed
                    db.query('DELETE FROM push_subscriptions WHERE user_id = ?', [reminder.user_id]);
                }
            });
        }
    } catch (error) {
        console.error("Cron Error:", error);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

