const cron = require('node-cron');
const Reminder = require('../models/reminderModel');
const emailService = require('../services/emailService');
const pushService = require('../services/pushNotificationService');
const User = require('../models/userModel');

// In-memory cache to track notified overdue tasks (cleared daily)
const notifiedTasks = new Set();

// Reusable function to check and send emails (Daily Report or Manual)
const runMissedTaskCheck = async (userId = null, date = null, endDate = null, customMessage = null, status = 'pending') => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logMsg = endDate ? `${targetDate} to ${endDate}` : targetDate;
    console.log(`⏰ Running task completion check for ${logMsg} [Status: ${status}]... ${userId ? `(Target User: ${userId})` : '(All Users)'}`);

    try {
        const queryStatus = status === 'all' ? 'all' : (status === 'completed' ? 'completed' : 'pending');
        const overdueReminders = await Reminder.getOverdueRemindersForToday(userId, targetDate, endDate, queryStatus);

        if (overdueReminders.length === 0) {
            console.log('✅ No matching tasks found.');
            return { sent: false, message: 'No matching tasks found' };
        }

        // Group reminders by user email
        const userReminders = overdueReminders.reduce((acc, reminder) => {
            if (!acc[reminder.email]) {
                acc[reminder.email] = {
                    userId: reminder.user_id,
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
        const titleText = customMessage ? 'Custom Task Report' : (status === 'completed' ? 'Completed Tasks Report' : 'Missed Tasks Alert');

        // Send email and push to each user
        for (const [email, data] of Object.entries(userReminders)) {
            const { username, items, userId } = data;

            // EMAIL LOGIC
            const taskListHtml = items.map(item => `
                <li style="margin-bottom: 10px; padding: 10px; background: ${item.is_completed ? '#ecfdf5' : '#fff1f2'}; border-left: 4px solid ${item.is_completed ? '#10b981' : '#f43f5e'}; border-radius: 4px;">
                    <strong style="color: ${item.is_completed ? '#065f46' : '#881337'};">${item.title}</strong>
                    ${item.description ? `<p style="margin: 5px 0 0; color: ${item.is_completed ? '#064e3b' : '#4c0519'}; font-size: 13px;">${item.description}</p>` : ''}
                    <div style="margin-top: 5px; font-size: 11px; font-weight: bold; color: ${item.is_completed ? '#047857' : '#9f1239'}; text-transform: uppercase;">
                        ${item.is_completed ? '✅ Completed' : '⚠️ Pending'} | Priority: ${item.priority} | Due: ${new Date(item.due_date).toLocaleDateString()}
                    </div>
                </li>
            `).join('');

            const html = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #1e293b; text-align: center; border-bottom: 2px solid ${status === 'completed' ? '#10b981' : '#f43f5e'}; padding-bottom: 15px;">
                        ${titleText} - ${displayDate}
                    </h2>
                    <p style="color: #475569; font-size: 16px;">Hi <strong>${username}</strong>,</p>
                    <p style="color: #475569;">
                        ${customMessage ? customMessage.replace(/\n/g, '<br>') : `You have <strong>${items.length} tasks</strong> matching your report:`}
                    </p>
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

            // ONLY send push for manual triggers or important alerts, avoid spamming for reports unless requested
            // For now, we send it.
            await pushService.sendNotification(userId, {
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

// Check for tasks that JUST passed their due time (Runs frequently)
const checkRealTimeOverdue = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
        // Get all pending tasks for today
        const reminders = await Reminder.getOverdueRemindersForToday(null, today, null, 'pending');

        // Filter: Due Time is passed AND not yet notified today
        const dueNow = reminders.filter(r => {
            if (!r.due_date) return false;
            const due = new Date(r.due_date);
            // Check if due time is in the past
            if (due > now) return false;

            // Check cache
            if (notifiedTasks.has(r.id)) return false;

            return true;
        });

        if (dueNow.length === 0) return;

        console.log(`⚡ Found ${dueNow.length} new overdue tasks. Sending instant alerts...`);

        // Group and notify
        const userReminders = dueNow.reduce((acc, r) => {
            if (!acc[r.user_id]) acc[r.user_id] = { email: r.email, username: r.username, count: 0, items: [] };
            acc[r.user_id].items.push(r);
            acc[r.user_id].count++;
            return acc;
        }, {});

        for (const [userId, data] of Object.entries(userReminders)) {
            // Mark as notified in cache
            data.items.forEach(r => notifiedTasks.add(r.id));

            // Send Push (Instant)
            await pushService.sendNotification(userId, {
                title: 'Task Overdue!',
                body: `"${data.items[0].title}" is now overdue!`,
                url: '/?filter=overdue',
                tag: `overdue-${data.items[0].id}`
            });

            // We could send email too, but maybe just push for instant? 
            // The requirement says "triggered after due time", implies alert. 
            // I'll skip email to avoid spamming every 15 mins, relying on Daily Report for email.
            // UNLESS user specifically wants email. PUSH is better for "triggered".
        }

    } catch (e) {
        console.error('Real-time check error:', e);
    }
};

const initCronJobs = () => {
    // Run every day at 8:00 PM (20:00) - Daily Report (Pending tasks)
    cron.schedule('0 20 * * *', async () => {
        await runMissedTaskCheck();
    });

    // Run every 15 minutes - Real-time Overdue Check
    cron.schedule('*/15 * * * *', async () => {
        await checkRealTimeOverdue();
    });

    // Clear cache daily at midnight
    cron.schedule('0 0 * * *', () => {
        notifiedTasks.clear();
        console.log('🧹 Overdue notification cache cleared.');
    });

    console.log('✅ Cron jobs initialized: Daily Report (8PM) & Real-time Overdue (Every 15m)');
};

module.exports = { initCronJobs, runMissedTaskCheck };
