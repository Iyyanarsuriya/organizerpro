const db = require('../config/db');

const getTableName = (sector) => {
    return sector === 'manufacturing' ? 'manufacturing_reminders' : 'personal_reminders';
};

const getAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    return rows;
};

const getById = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return rows[0];
};

const create = async (reminderData) => {
    const { user_id, title, description, due_date, priority, category, google_event_id, sector } = reminderData;
    const table = getTableName(sector);

    const dateObj = due_date ? new Date(due_date) : null;
    const finalDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj : null;

    let query, params;

    if (table === 'manufacturing_reminders') {
        query = `INSERT INTO ${table} (user_id, title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?)`;
        params = [user_id, title, description, finalDate, priority || 'medium', 'pending'];
    } else {
        query = `INSERT INTO ${table} (user_id, title, description, due_date, priority, category, google_event_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [user_id, title, description, finalDate, priority || 'medium', category || 'General', google_event_id || null];
    }

    const [result] = await db.query(query, params);
    return { id: result.insertId, ...reminderData, is_completed: false, created_at: new Date() };
};

const updateGoogleEventId = async (id, googleEventId, sector) => {
    const table = getTableName(sector);
    if (table === 'manufacturing_reminders') return false; // Not supported
    const [result] = await db.query(
        `UPDATE ${table} SET google_event_id = ? WHERE id = ?`,
        [googleEventId, id]
    );
    return result.affectedRows > 0;
};

const updateStatus = async (id, userId, is_completed, sector) => {
    const table = getTableName(sector);
    let query = `UPDATE ${table} SET is_completed = ?`;
    const params = [is_completed];

    if (table === 'personal_reminders') {
        if (is_completed) {
            query += ', completed_at = NOW()';
        } else {
            query += ', completed_at = NULL';
        }
    } else {
        // Manufacturing
        if (is_completed) {
            query += ', status = "completed"';
        } else {
            query += ', status = "pending"';
        }
    }

    query += ' WHERE id = ? AND user_id = ?';
    params.push(id, userId);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
};

const deleteReminder = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

const getOverdueRemindersForToday = async (userId = null, startDate = null, endDate = null, status = 'pending', sector = 'personal') => {
    const table = getTableName(sector);
    // Get reminders that are due on a specific date (or today) OR a range
    // We join with users to get the email address to send notifications to
    let query = `
        SELECT r.id, r.user_id, r.title, r.description, r.due_date, r.priority, u.email, u.username 
        FROM ${table} r
        JOIN users u ON r.user_id = u.id
        WHERE 1=1
    `;

    if (status === 'pending') {
        query += " AND r.is_completed = 0";
    } else if (status === 'completed') {
        query += " AND r.is_completed = 1";
    }

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

module.exports = {
    getAllByUserId,
    getById,
    create,
    updateGoogleEventId,
    updateStatus,
    delete: deleteReminder,
    getOverdueRemindersForToday
};
