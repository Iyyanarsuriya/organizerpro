const Reminder = require('../../models/reminderModel');
const User = require('../../models/userModel');
const googleService = require('../../services/googleCalendarService');

exports.getReminders = async (req, res) => {
    try {
        console.log("Fetching reminders for user:", req.user.data_owner_id, "sector:", req.query.sector);
        const rows = await Reminder.getAllByUserId(req.user.data_owner_id, req.query.sector);
        console.log("Reminders found:", rows.length);
        res.json(rows);
    } catch (error) {
        console.error("Error in getReminders:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createReminder = async (req, res) => {
    const { title, description, due_date, priority, category, sector } = req.body;

    // Validation: Date cannot be in past (Education Specific)
    if (sector === 'education' && due_date && new Date(due_date) < new Date()) {
        return res.status(400).json({ error: 'Due date cannot be in the past' });
    }
    try {
        const createdReminder = await Reminder.create({
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
            try {
                const user = await User.findById(req.user.data_owner_id); // Reverted to findById as per model export
                if (user && user.google_refresh_token && due_date) {
                    const event = await googleService.createEvent(user.google_refresh_token, createdReminder);
                    if (event && event.id) {
                        await Reminder.updateGoogleEventId(createdReminder.id, event.id, sector);
                        createdReminder.google_event_id = event.id;
                    }
                }
            } catch (gErr) {
                console.error('Failed to create Google Event/fetch user:', gErr.message);
            }
        }

        res.status(201).json(createdReminder);
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
    const { is_completed, title, description, due_date, priority, category, sector } = req.body;

    // Validation: Date cannot be in past (Education Specific)
    if (sector === 'education' && due_date && new Date(due_date) < new Date()) {
        return res.status(400).json({ error: 'Due date cannot be in the past' });
    }
    try {
        let updated = false;

        // 1. Handle Status Update if present
        if (is_completed !== undefined) {
            const success = await Reminder.updateStatus(id, req.user.data_owner_id, is_completed, sector);
            if (success) {
                updated = true;

                // Sync status change to Google Calendar
                // We need to fetch the reminder first to get the google_event_id
                const reminder = await Reminder.getById(id, req.user.data_owner_id, sector);
                const user = await User.findById(req.user.data_owner_id);

                if (reminder && reminder.google_event_id && user && user.google_refresh_token) {
                    const isCompletedBool = is_completed == 1 || is_completed === true || is_completed === 'true';

                    let baseTitle = reminder.title;
                    if (reminder.description) {
                        baseTitle = `${reminder.title} - ${reminder.description}`;
                    }

                    // Helper to make text look crossed out
                    const strikeThrough = (text) => text.split('').map(char => char + '\u0336').join('');

                    let newSummary = isCompletedBool ? `✅ ${strikeThrough(baseTitle)}` : baseTitle;

                    // Google Calendar Colors: 8 = Grey (completed), null = default
                    const eventUpdates = {
                        summary: newSummary,
                        colorId: isCompletedBool ? '8' : null
                    };

                    try {
                        await googleService.updateEvent(user.google_refresh_token, reminder.google_event_id, eventUpdates);
                    } catch (gErr) {
                        console.error('Failed to update Google Event status:', gErr.message);
                    }
                }
            }
        }

        // 2. Handle Content Update if any field is present
        if (title || description || due_date || priority || category) {
            const success = await Reminder.update(id, req.user.data_owner_id, req.body, sector);
            if (success) updated = true;
        }

        if (!updated) {
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


