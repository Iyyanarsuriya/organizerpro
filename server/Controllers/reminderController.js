const Reminder = require('../Models/remindermodel');

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
    const { title, description, due_date, priority } = req.body;
    try {
        const newReminder = await Reminder.create({
            user_id: req.user.id,
            title,
            description,
            due_date,
            priority
        });
        res.status(201).json(newReminder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteReminder = async (req, res) => {
    const { id } = req.params;
    try {
        const success = await Reminder.delete(id, req.user.id);
        if (!success) return res.status(404).json({ error: 'Reminder not found' });
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
