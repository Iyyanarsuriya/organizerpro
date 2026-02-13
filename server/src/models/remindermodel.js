const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    manufacturing: 'manufacturing_reminders',
    it: 'it_reminders',
    education: 'education_reminders',
    hotel: 'hotel_reminders',
    personal: 'personal_reminders'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.personal;

// Helper to sanitize date (Shared logic, could be in utils)
const sanitizeDate = (date) => {
    if (!date) return null;
    if (typeof date === 'string') {
        if (date.length === 10) return date + ' 12:00:00'; // YYYY-MM-DD
        if (date.includes('T')) return date.replace('T', ' ').slice(0, 19); // ISO String
    }
    if (date instanceof Date) {
        return date.toISOString().replace('T', ' ').slice(0, 19);
    }
    return date;
};

// --- IT SECTOR ---
const ITReminderModel = {
    create: async (data) => {
        const { user_id, title, description, due_date, priority, category } = data;
        const [res] = await db.query(
            `INSERT INTO it_reminders (user_id, title, description, due_date, priority, category) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, title, description, sanitizeDate(due_date), priority || 'medium', category || 'General']
        );
        return { id: res.insertId, ...data };
    },
    updateStatus: async (id, userId, is_completed) => {
        const [res] = await db.query(`UPDATE it_reminders SET is_completed = ? WHERE id = ? AND user_id = ?`, [is_completed, id, userId]);
        return res.affectedRows > 0;
    },
    update: async (id, userId, data) => {
        const { title, description, due_date, priority, category } = data;
        const [res] = await db.query(
            `UPDATE it_reminders SET title=?, description=?, due_date=?, priority=?, category=? WHERE id=? AND user_id=?`,
            [title, description, sanitizeDate(due_date), priority, category, id, userId]
        );
        return res.affectedRows > 0;
    }
};

// --- HOTEL SECTOR ---
const HotelReminderModel = {
    create: async (data) => {
        const { user_id, title, description, due_date, priority, category } = data;
        const [res] = await db.query(
            `INSERT INTO hotel_reminders (user_id, title, description, due_date, priority, status, category) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, title, description, sanitizeDate(due_date), priority || 'medium', 'pending', category || 'General']
        );
        return { id: res.insertId, ...data };
    },
    updateStatus: async (id, userId, is_completed) => {
        const status = is_completed ? 'completed' : 'pending';
        const [res] = await db.query(`UPDATE hotel_reminders SET is_completed = ?, status = ? WHERE id = ? AND user_id = ?`, [is_completed, status, id, userId]);
        return res.affectedRows > 0;
    },
    update: async (id, userId, data) => {
        const { title, description, due_date, priority, category } = data;
        const [res] = await db.query(
            `UPDATE hotel_reminders SET title=?, description=?, due_date=?, priority=?, category=? WHERE id=? AND user_id=?`,
            [title, description, sanitizeDate(due_date), priority, category, id, userId]
        );
        return res.affectedRows > 0;
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingReminderModel = {
    create: async (data) => {
        const { user_id, title, description, due_date, priority } = data;
        const [res] = await db.query(
            `INSERT INTO manufacturing_reminders (user_id, title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, title, description, sanitizeDate(due_date), priority || 'medium', 'pending']
        );
        return { id: res.insertId, ...data };
    },
    updateStatus: async (id, userId, is_completed) => {
        const status = is_completed ? 'completed' : 'pending';
        const [res] = await db.query(`UPDATE manufacturing_reminders SET is_completed = ?, status = ? WHERE id = ? AND user_id = ?`, [is_completed, status, id, userId]);
        return res.affectedRows > 0;
    },
    update: async (id, userId, data) => {
        const { title, description, due_date, priority } = data;
        const [res] = await db.query(
            `UPDATE manufacturing_reminders SET title=?, description=?, due_date=?, priority=? WHERE id=? AND user_id=?`,
            [title, description, sanitizeDate(due_date), priority, id, userId]
        );
        return res.affectedRows > 0;
    }
};

// --- EDUCATION SECTOR ---
const EducationReminderModel = {
    create: async (data) => {
        const { user_id, title, description, due_date, priority, category } = data;
        const [res] = await db.query(
            `INSERT INTO education_reminders (user_id, title, description, due_date, priority, category) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, title, description, sanitizeDate(due_date), priority || 'medium', category || 'General']
        );
        return { id: res.insertId, ...data };
    },
    updateStatus: async (id, userId, is_completed) => {
        const [res] = await db.query(`UPDATE education_reminders SET is_completed = ? WHERE id = ? AND user_id = ?`, [is_completed, id, userId]);
        return res.affectedRows > 0;
    },
    update: async (id, userId, data) => {
        const { title, description, due_date, priority, category } = data;
        const [res] = await db.query(
            `UPDATE education_reminders SET title=?, description=?, due_date=?, priority=?, category=? WHERE id=? AND user_id=?`,
            [title, description, sanitizeDate(due_date), priority, category, id, userId]
        );
        return res.affectedRows > 0;
    }
};

// --- PERSONAL SECTOR ---
const PersonalReminderModel = {
    create: async (data) => {
        const { user_id, title, description, due_date, priority, category, google_event_id } = data;
        const [res] = await db.query(
            `INSERT INTO personal_reminders (user_id, title, description, due_date, priority, category, google_event_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, title, description, sanitizeDate(due_date), priority || 'medium', category || 'General', google_event_id || null]
        );
        return { id: res.insertId, ...data };
    },
    updateStatus: async (id, userId, is_completed) => {
        const completed_at = is_completed ? new Date() : null;
        const [res] = await db.query(`UPDATE personal_reminders SET is_completed = ?, completed_at = ? WHERE id = ? AND user_id = ?`, [is_completed, completed_at, id, userId]);
        return res.affectedRows > 0;
    },
    update: async (id, userId, data) => {
        const { title, description, due_date, priority, category } = data;
        const [res] = await db.query(
            `UPDATE personal_reminders SET title=?, description=?, due_date=?, priority=?, category=? WHERE id=? AND user_id=?`,
            [title, description, sanitizeDate(due_date), priority, category, id, userId]
        );
        return res.affectedRows > 0;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelReminderModel;
        case 'it': return ITReminderModel;
        case 'education': return EducationReminderModel;
        case 'manufacturing': return ManufacturingReminderModel;
        default: return PersonalReminderModel;
    }
};

// --- CORE REMINDER FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector).create(data);
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

const updateStatus = async (id, userId, is_completed, sector) => {
    return getSectorModel(sector).updateStatus(id, userId, is_completed);
};

const update = async (id, userId, data, sector) => {
    return getSectorModel(sector).update(id, userId, data);
};

const updateGoogleEventId = async (id, googleEventId, sector) => {
    if (sector !== 'personal' && sector !== undefined) return false;
    const [res] = await db.query(`UPDATE personal_reminders SET google_event_id = ? WHERE id = ?`, [googleEventId, id]);
    return res.affectedRows > 0;
};

const deleteReminder = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [res] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return res.affectedRows > 0;
};

const getOverdueRemindersForToday = async (userId, startDate, endDate, status, sector) => {
    const table = getTableName(sector);
    let query = `
        SELECT r.*, u.email, u.username 
        FROM ${table} r
        JOIN users u ON r.user_id = u.id
        WHERE 1=1 `;
    const params = [];
    if (status === 'pending') query += " AND r.is_completed = 0";
    else if (status === 'completed') query += " AND r.is_completed = 1";

    if (startDate && endDate) { query += " AND DATE(r.due_date) BETWEEN ? AND ?"; params.push(startDate, endDate); }
    else { query += " AND DATE(r.due_date) = ?"; params.push(startDate || new Date().toISOString().split('T')[0]); }

    if (userId) { query += " AND r.user_id = ?"; params.push(userId); }

    const [rows] = await db.query(query, params);
    return rows;
};

module.exports = {
    getAllByUserId,
    getById,
    create,
    updateGoogleEventId,
    updateStatus,
    update,
    delete: deleteReminder,
    getOverdueRemindersForToday
};
