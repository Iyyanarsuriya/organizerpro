const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_audit_logs',
    education: 'education_audit_logs'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.education;

// --- IT SECTOR ---
const ITAuditLogModel = {
    create: async (data) => {
        const { user_id, action, module, details, performed_by } = data;
        const [res] = await db.query(`INSERT INTO it_audit_logs (user_id, action, module, details, performed_by) VALUES (?, ?, ?, ?, ?)`, [user_id, action, module, details, performed_by]);
        return { id: res.insertId, ...data };
    },
    getAll: async (userId, filters) => {
        let query = `SELECT a.*, u.username as performer_name FROM it_audit_logs a LEFT JOIN users u ON a.performed_by = u.id WHERE a.user_id = ?`;
        const params = [userId];
        if (filters.module) { query += ' AND a.module = ?'; params.push(filters.module); }
        query += ' ORDER BY a.created_at DESC LIMIT 100';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- EDUCATION SECTOR ---
const EducationAuditLogModel = {
    create: async (data) => {
        const { user_id, action, module, details, performed_by } = data;
        const [res] = await db.query(`INSERT INTO education_audit_logs (user_id, action, module, details, performed_by) VALUES (?, ?, ?, ?, ?)`, [user_id, action, module, details, performed_by]);
        return { id: res.insertId, ...data };
    },
    getAll: async (userId, filters) => {
        let query = `SELECT a.*, u.username as performer_name FROM education_audit_logs a LEFT JOIN users u ON a.performed_by = u.id WHERE a.user_id = ?`;
        const params = [userId];
        if (filters.module) { query += ' AND a.module = ?'; params.push(filters.module); }
        query += ' ORDER BY a.created_at DESC LIMIT 100';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    return sector === 'it' ? ITAuditLogModel : EducationAuditLogModel;
};

// --- CORE AUDIT LOG FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector).create(data);
};

const getAllByUserId = async (userId, filters = {}) => {
    return getSectorModel(filters.sector).getAll(userId, filters);
};

module.exports = {
    create,
    getAllByUserId
};
