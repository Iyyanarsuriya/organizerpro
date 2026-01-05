const cron = require('node-cron');
const Reminder = require('../models/remindermodel');
const emailService = require('../services/emailService');
const pushService = require('../services/pushNotificationService');
const User = require('../models/userModel');

// Reusable function to check and send emails
// Reusable function to check and send emails
const runMissedTaskCheck = async (userId = null, date = null, endDate = null, customMessage = null) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logMsg = endDate ? `${targetDate} to ${endDate}` : targetDate;
    console.log(`⏰ Running task completion check for ${logMsg}... ${userId ? `(Target User: ${userId})` : '(All Users)'}`);

    try {
        const overdueReminders = await Reminder.getOverdueRemindersForToday(userId, targetDate, endDate);

        if (overdueReminders.length === 0) {
            console.log('✅ No pending tasks found.');
            return { sent: false, message: 'No pending tasks found' };
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

        // Format date for display
        const formatDate = (d) => {
            const [y, m, da] = d.split('-');
            return `${da}-${m}-${y}`;
        };
        const displayDate = endDate ? `${formatDate(targetDate)} to ${formatDate(endDate)}` : formatDate(targetDate);
        const titleText = customMessage ? 'Custom Task Report' : 'Missed Tasks Alert';
        const introText = customMessage || `The day is almost over, but you still have <strong>${overdueReminders.length} unfinished tasks</strong> scheduled for today (${displayDate}):`;

        // Send email and push to each user
        for (const [email, data] of Object.entries(userReminders)) {
            const { username, items, userId } = data;

            // EMAIL LOGIC
            const taskListHtml = items.map(item => `
                <li style="margin-bottom: 10px; padding: 10px; background: #fff1f2; border-left: 4px solid #f43f5e; border-radius: 4px;">
                    <strong style="color: #881337;">${item.title}</strong>
                    ${item.description ? `<p style="margin: 5px 0 0; color: #4c0519; font-size: 13px;">${item.description}</p>` : ''}
                    <div style="margin-top: 5px; font-size: 11px; font-weight: bold; color: #9f1239; text-transform: uppercase;">Priority: ${item.priority} | Due: ${new Date(item.due_date).toLocaleDateString()}</div>
                </li>
            `).join('');

            const html = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #1e293b; text-align: center; border-bottom: 2px solid #f43f5e; padding-bottom: 15px;">⚠️ ${titleText} - ${displayDate}</h2>
                    <p style="color: #475569; font-size: 16px;">Hi <strong>${username}</strong>,</p>
                    <p style="color: #475569;">${customMessage ? customMessage.replace(/\n/g, '<br>') : `You have <strong>${items.length} unfinished tasks</strong>:`}</p>
                    <ul style="list-style: none; padding: 0;">
                        ${taskListHtml}
                    </ul>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
                        Stay organized and productive! <br>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; margin-top: 10px; color: #2563eb; text-decoration: none; font-weight: bold;">Go to Dashboard &rarr;</a>
                    </p>
                </div>
            `;

            await emailService.sendEmail(email, `${titleText} - ${displayDate}`, html);

            // PUSH NOTIFICATION LOGIC
            await pushService.sendNotification(userId, { // Use userId here
                title: titleText,
                body: `You have ${items.length} tasks matching your criteria.`,
                url: '/?filter=overdue',
                tag: 'custom-reminder'
            });
        }

        console.log(`📧 Sent emails/push to ${Object.keys(userReminders).length} users.`);
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
