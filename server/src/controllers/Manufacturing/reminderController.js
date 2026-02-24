const Reminder = require('../../models/reminderModel');

exports.getReminders = async (req, res) => {
    try {
        const sector = 'manufacturing';
        const rows = await Reminder.getAllByUserId(req.user.data_owner_id, sector);
        res.json(rows);
    } catch (error) {
        console.error("Error in Manufacturing getReminders:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createReminder = async (req, res) => {
    try {
        const sector = 'manufacturing';
        const { title, description, due_date, priority, category } = req.body;

        const newReminder = await Reminder.create({
            user_id: req.user.data_owner_id,
            title,
            description,
            due_date,
            priority,
            category,
            sector
        });

        res.status(201).json(newReminder);
    } catch (error) {
        console.error("Error in Manufacturing createReminder:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateReminder = async (req, res) => {
    const { id } = req.params;
    const { is_completed, title, description, due_date, priority, category } = req.body;
    const sector = 'manufacturing';

    try {
        let updated = false;

        if (is_completed !== undefined) {
            const success = await Reminder.updateStatus(id, req.user.data_owner_id, is_completed, sector);
            if (success) updated = true;
        }

        if (title || description || due_date || priority || category) {
            const success = await Reminder.update(id, req.user.data_owner_id, req.body, sector);
            if (success) updated = true;
        }

        if (!updated) {
            const existing = await Reminder.getById(id, req.user.data_owner_id, sector);
            if (existing) {
                return res.json({ message: 'Reminder updated', note: 'No changes were necessary' });
            }
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.json({ message: 'Reminder updated' });
    } catch (error) {
        console.error("Error in Manufacturing updateReminder:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteReminder = async (req, res) => {
    const { id } = req.params;
    const sector = 'manufacturing';
    try {
        const success = await Reminder.delete(id, req.user.data_owner_id, sector);
        if (!success) return res.status(404).json({ error: 'Reminder not found' });
        res.json({ message: 'Reminder deleted' });
    } catch (error) {
        console.error("Error in Manufacturing deleteReminder:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const { runMissedTaskCheck } = require('../../jobs/cronService');

exports.sendMissedAlert = async (req, res) => {
    const { date, endDate, customMessage, status } = req.body;
    const sector = 'manufacturing';
    try {
        const result = await runMissedTaskCheck(req.user.data_owner_id, date, endDate, customMessage, status, sector);
        res.json({ message: `Manufacturing report sent for ${date || 'today'}`, ...result });
    } catch (error) {
        console.error('Manufacturing missed alert error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
