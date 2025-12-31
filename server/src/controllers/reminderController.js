const Reminder = require('../models/remindermodel');
const User = require('../models/userModel');
const googleService = require('../services/googleCalendarService');

exports.getReminders = async (req, res) => {
    try {
        const rows = await Reminder.getAllByUserId(req.user.id);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createReminder = async (req, res) => {
    const { title, description, due_date, priority, category, recurrence_type, recurrence_interval } = req.body;
    try {
        const newReminder = await Reminder.create({
            user_id: req.user.id,
            title,
            description,
            due_date,
            priority,
            category,
            recurrence_type,
            recurrence_interval
        });

        // Sync with Google Calendar if connected
        const user = await User.findById(req.user.id);
        if (user && user.google_refresh_token && due_date) {
            try {
                const event = await googleService.createEvent(user.google_refresh_token, newReminder);
                if (event && event.id) {
                    await Reminder.updateGoogleEventId(newReminder.id, event.id);
                    newReminder.google_event_id = event.id;
                }
            } catch (gErr) {
                console.error('Failed to create Google Event:', gErr.message);
            }
        }

        res.status(201).json(newReminder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteReminder = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch reminder to check for google_event_id before deleting
        const reminders = await Reminder.getAllByUserId(req.user.id);
        const reminderToDelete = reminders.find(r => r.id == id);

        const success = await Reminder.delete(id, req.user.id);
        if (!success) return res.status(404).json({ error: 'Reminder not found' });

        // Delete from Google Calendar if exists
        if (reminderToDelete && reminderToDelete.google_event_id) {
            const user = await User.findById(req.user.id);
            if (user && user.google_refresh_token) {
                await googleService.deleteEvent(user.google_refresh_token, reminderToDelete.google_event_id);
            }
        }

        res.json({ message: 'Reminder deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateReminder = async (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;
    try {
        const success = await Reminder.updateStatus(id, req.user.id, is_completed);
        if (!success) return res.status(404).json({ error: 'Reminder not found' });
        res.json({ message: 'Reminder updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const { runMissedTaskCheck } = require('../jobs/cronService');

exports.triggerMissedTaskEmail = async (req, res) => {
    const { date } = req.body;
    try {
        // Trigger the check specifically for this user and date
        const result = await runMissedTaskCheck(req.user.id, date);
        res.json({ message: `Missed task check ran for ${date || 'today'}`, ...result });
    } catch (error) {
        console.error('Manual trigger error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.automatedMissedTaskJob = async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const clientSecret = req.headers['x-cron-secret'];

    // Verify secret if it exists in env
    if (cronSecret && cronSecret !== clientSecret) {
        return res.status(401).json({ error: 'Unauthorized cron trigger' });
    }

    try {
        // Run for all users
        const result = await runMissedTaskCheck();
        res.json({ message: 'Automated missed task check ran successfully', ...result });
    } catch (error) {
        console.error('Automated trigger error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
