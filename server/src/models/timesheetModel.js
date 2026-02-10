const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_timesheets'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.it;

// --- IT SECTOR ---
const ITTimesheetModel = {
    create: async (data) => {
        const { user_id, member_id, project_id, date, task_description, hours_spent, is_billable, status } = data;
        const [res] = await db.query(
            `INSERT INTO it_timesheets (user_id, member_id, project_id, date, task_description, hours_spent, is_billable, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, member_id, project_id || null, date, task_description, hours_spent || 0, is_billable || 1, status || 'pending']
        );
        return { id: res.insertId, ...data };
    },
    getAll: async (userId, filters) => {
        let query = `
            SELECT t.*, m.name as member_name, p.name as project_name 
            FROM it_timesheets t
            JOIN it_members m ON t.member_id = m.id
            LEFT JOIN it_projects p ON t.project_id = p.id
            WHERE t.user_id = ?
        `;
        const params = [userId];
        if (filters.member_id) { query += ' AND t.member_id = ?'; params.push(filters.member_id); }
        if (filters.project_id) { query += ' AND t.project_id = ?'; params.push(filters.project_id); }
        if (filters.date) { query += ' AND t.date = ?'; params.push(filters.date); }
        if (filters.status) { query += ' AND t.status = ?'; params.push(filters.status); }
        query += ' ORDER BY t.date DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    // Currently only IT has timesheets, but pattern allows expansion
    return ITTimesheetModel;
};

// --- CORE TIMESHEET FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector).create(data);
};

const getAll = async (userId, filters = {}) => {
    return getSectorModel(filters.sector).getAll(userId, filters);
};

const updateStatus = async (id, status, sector) => {
    const table = getTableName(sector);
    await db.query(`UPDATE ${table} SET status = ? WHERE id = ?`, [status, id]);
    return { id, status };
};

const remove = async (id, sector) => {
    const table = getTableName(sector);
    await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return { id };
};

module.exports = {
    create,
    getAll,
    updateStatus,
    delete: remove
};
