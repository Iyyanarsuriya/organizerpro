const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'it') return 'it_audit_logs';
    return 'education_audit_logs';
};

const create = async (data) => {
    const table = getTableName(data.sector);
    const { user_id, action, module, details, performed_by } = data;
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, action, module, details, performed_by) VALUES (?, ?, ?, ?, ?)`,
        [user_id, action, module, details || null, performed_by]
    );
    return { id: result.insertId, ...data };
};

const getAllByUserId = async (userId, filters = {}) => {
    const table = getTableName(filters.sector);
    let query = `
        SELECT a.*, u.username as performer_name 
        FROM ${table} a 
        LEFT JOIN users u ON a.performed_by = u.id 
        WHERE a.user_id = ?
    `;
    const params = [userId];

    if (filters.module) {
        query += ' AND a.module = ?';
        params.push(filters.module);
    }

    query += ' ORDER BY a.created_at DESC LIMIT 100';
    const [rows] = await db.query(query, params);
    return rows;
};

module.exports = {
    create,
    getAllByUserId
};
