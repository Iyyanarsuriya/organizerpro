const cron = require('node-cron');
const Reminder = require('../models/remindermodel');
const emailService = require('../services/emailService');
const pushService = require('../services/pushNotificationService');
const User = require('../models/userModel');

// Reusable function to check and send emails
const runMissedTaskCheck = async (userId = null) => {
    console.log(`⏰ Running missed task completion check... ${userId ? `(Target User: ${userId})` : '(All Users)'}`);

    try {
        const overdueReminders = await Reminder.getOverdueRemindersForToday(userId);

        if (overdueReminders.length === 0) {
            console.log('✅ No missed tasks found.');
            return { sent: false, message: 'No missed tasks found' };
        }

        // Group reminders by user email
        const userReminders = overdueReminders.reduce((acc, reminder) => {
            if (!acc[reminder.email]) {
                acc[reminder.email] = {
                    userId: reminder.user_id, // Ensure we have user_id in the query!
                    username: reminder.username,
                    items: []
                };
            }
            acc[reminder.email].items.push(reminder);
            return acc;
        }, {});

        // Send email and push to each user
        for (const [email, data] of Object.entries(userReminders)) {
            const { username, items, userId } = data; // We need user_id here. 
            // Note: Reminder.getOverdueRemindersForToday query needs to return user_id as 'user_id' or 'id' from users table.

            // EMAIL LOGIC
            const taskListHtml = items.map(item => `
                <li style="margin-bottom: 10px; padding: 10px; background: #fff1f2; border-left: 4px solid #f43f5e; border-radius: 4px;">
                    <strong style="color: #881337;">${item.title}</strong>
                    ${item.description ? `<p style="margin: 5px 0 0; color: #4c0519; font-size: 13px;">${item.description}</p>` : ''}
                    <div style="margin-top: 5px; font-size: 11px; font-weight: bold; color: #9f1239; text-transform: uppercase;">Priority: ${item.priority}</div>
                </li>
            `).join('');

            const html = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #1e293b; text-align: center; border-bottom: 2px solid #f43f5e; padding-bottom: 15px;">⚠️ Missed Tasks Alert</h2>
                    <p style="color: #475569; font-size: 16px;">Hi <strong>${username}</strong>,</p>
                    <p style="color: #475569;">The day is almost over, but you still have <strong>${items.length} unfinished tasks</strong> scheduled for today:</p>
                    <ul style="list-style: none; padding: 0;">
                        ${taskListHtml}
                    </ul>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
                        Stay organized and productive! <br>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; margin-top: 10px; color: #2563eb; text-decoration: none; font-weight: bold;">Go to Dashboard &rarr;</a>
                    </p>
                </div>
            `;

            await emailService.sendEmail(email, `You have ${items.length} missed tasks today`, html);

            // PUSH NOTIFICATION LOGIC
            await pushService.sendNotification(userId, { // Use userId here
                title: 'Unfinished Tasks Alert',
                body: `You have ${items.length} tasks still pending for today. Don't forget them!`,
                url: '/?filter=overdue', // Deep link if supported
                tag: 'daily-reminder'
            });
        }

        console.log(`📧 Sent missed task emails/push to ${Object.keys(userReminders).length} users.`);
        return { sent: true, count: Object.keys(userReminders).length };

    } catch (error) {
        console.error('❌ Error in cron job:', error);
        throw error;
    }
};

const initCronJobs = () => {
    // Run every day at 8:00 PM (20:00)
    cron.schedule('0 20 * * *', async () => {
        await runMissedTaskCheck();
    });

    console.log('✅ Cron jobs initialized: Missed Task Checker (Daily @ 8 PM)');
};

module.exports = { initCronJobs, runMissedTaskCheck };
