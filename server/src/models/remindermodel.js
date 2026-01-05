const db = require('../config/db');

exports.getAllByUserId = async (userId) => {
    const [rows] = await db.query('SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
};

exports.create = async (reminderData) => {
    const { user_id, title, description, due_date, priority, category, recurrence_type, recurrence_interval, google_event_id } = reminderData;

    const dateObj = due_date ? new Date(due_date) : null;
    const finalDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj : null;

    const [result] = await db.query(
        'INSERT INTO reminders (user_id, title, description, due_date, priority, category, recurrence_type, recurrence_interval, google_event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, title, description, finalDate, priority || 'medium', category || 'General', recurrence_type || 'none', recurrence_interval || 1, google_event_id || null]
    );
    return { id: result.insertId, ...reminderData, is_completed: false };
};

exports.updateGoogleEventId = async (id, googleEventId) => {
    const [result] = await db.query(
        'UPDATE reminders SET google_event_id = ? WHERE id = ?',
        [googleEventId, id]
    );
    return result.affectedRows > 0;
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

exports.getOverdueRemindersForToday = async (userId = null, startDate = null, endDate = null) => {
    // Get reminders that are due on a specific date (or today) OR a range, AND not completed
    // We join with users to get the email address to send notifications to
    let query = `
        SELECT r.id, r.user_id, r.title, r.description, r.due_date, r.priority, u.email, u.username 
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        WHERE r.is_completed = 0 
    `;

    const params = [];

    if (startDate && endDate) {
        query += " AND DATE(r.due_date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
    } else {
        query += " AND DATE(r.due_date) = ?";
        params.push(startDate || new Date().toISOString().split('T')[0]);
    }

    if (userId) {
        query += ' AND r.user_id = ?';
        params.push(userId);
    }

    const [rows] = await db.query(query, params);
    return rows;
};
