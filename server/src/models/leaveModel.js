const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_leaves'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.it;

// --- IT SECTOR ---
const ITLeaveModel = {
    create: async (data) => {
        const { user_id, member_id, leave_type, start_date, end_date, reason, status } = data;
        const [res] = await db.query(
            `INSERT INTO it_leaves (user_id, member_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, member_id, leave_type, start_date, end_date, reason, status || 'pending']
        );
        return { id: res.insertId, ...data };
    },
    getAll: async (userId, filters) => {
        let query = `
            SELECT l.*, m.name as member_name 
            FROM it_leaves l
            JOIN it_members m ON l.member_id = m.id
            WHERE l.user_id = ?
        `;
        const params = [userId];
        if (filters.member_id) { query += ' AND l.member_id = ?'; params.push(filters.member_id); }
        if (filters.status) { query += ' AND l.status = ?'; params.push(filters.status); }
        query += ' ORDER BY l.created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    return ITLeaveModel;
};

// --- CORE LEAVE FUNCTIONS (DISPATCHERS) ---
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
