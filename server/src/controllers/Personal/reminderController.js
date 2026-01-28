const Reminder = require('../../models/remindermodel');
const User = require('../../models/userModel');
const googleService = require('../../services/googleCalendarService');

exports.getReminders = async (req, res) => {
    try {
        const rows = await Reminder.getAllByUserId(req.user.data_owner_id, req.query.sector);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createReminder = async (req, res) => {
    const { title, description, due_date, priority, category, sector } = req.body;
    try {
        const newReminder = await Reminder.create({
            user_id: req.user.data_owner_id,
            title,
            description,
            due_date,
            priority,
            category,
            sector
        });

        // Sync with Google Calendar if connected (Using Data Owner's Token) & Sector is Personal (implicit check in model but good here too)
        if (sector === 'personal' || !sector) {
            const user = await User.findById(req.user.data_owner_id);
            if (user && user.google_refresh_token && due_date) {
                try {
                    const event = await googleService.createEvent(user.google_refresh_token, newReminder);
                    if (event && event.id) {
                        await Reminder.updateGoogleEventId(newReminder.id, event.id, sector);
                        newReminder.google_event_id = event.id;
                    }
                } catch (gErr) {
                    console.error('Failed to create Google Event:', gErr.message);
                }
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
    const { sector } = req.query;
    try {
        // Fetch reminder to check for google_event_id before deleting
        const reminders = await Reminder.getAllByUserId(req.user.data_owner_id, sector);
        const reminderToDelete = reminders.find(r => r.id == id);

        const success = await Reminder.delete(id, req.user.data_owner_id, sector);
        if (!success) return res.status(404).json({ error: 'Reminder not found' });

        // Delete from Google Calendar if exists (Using Data Owner's Token) AND sector is personal
        if (reminderToDelete && reminderToDelete.google_event_id && (sector === 'personal' || !sector)) {
            const user = await User.findById(req.user.data_owner_id);
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
    const { is_completed, sector } = req.body;
    try {
        const success = await Reminder.updateStatus(id, req.user.data_owner_id, is_completed, sector);
        if (!success) {
            // Check if reminder exists to verify if it was a "no-op" update or truly missing
            const existing = await Reminder.getById(id, req.user.data_owner_id, sector);
            if (existing) {
                return res.json({ message: 'Reminder updated', note: 'No changes were necessary' });
            }
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.json({ message: 'Reminder updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const { runMissedTaskCheck } = require('../../jobs/cronService');

exports.triggerMissedTaskEmail = async (req, res) => {
    const { date, endDate, customMessage, status } = req.body;
    try {
        // Trigger the check specifically for this user and date
        // Note: For email triggers, should it go to the Employee or the CEO?
        // Usually CEO (Owner) configures the email.
        const result = await runMissedTaskCheck(req.user.data_owner_id, date, endDate, customMessage, status);
        res.json({ message: `Task report check ran for ${date || 'today'}`, ...result });
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
