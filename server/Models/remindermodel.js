const db = require('../Config/db');

exports.getAllByUserId = async (userId) => {
    const [rows] = await db.query('SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
};

exports.create = async (reminderData) => {
    const { user_id, title, description, due_date, priority } = reminderData;
    const [result] = await db.query(
        'INSERT INTO reminders (user_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?)',
        [user_id, title, description, due_date, priority || 'medium']
    );
    return { id: result.insertId, ...reminderData, is_completed: false };
};

exports.updateStatus = async (id, userId, is_completed) => {
    const [result] = await db.query(
        'UPDATE reminders SET is_completed = ? WHERE id = ? AND user_id = ?',
        [is_completed, id, userId]
    );
    return result.affectedRows > 0;
};

exports.delete = async (id, userId) => {
    const [result] = await db.query(
        'DELETE FROM reminders WHERE id = ? AND user_id = ?',
        [id, userId]
    );
    return result.affectedRows > 0;
};
