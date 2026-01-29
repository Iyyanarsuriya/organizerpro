const db = require('../config/db');

const TABLE_NAME = 'education_audit_logs';

const create = async (data) => {
    const { user_id, action, module, details, performed_by } = data;
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, action, module, details, performed_by) VALUES (?, ?, ?, ?, ?)`,
        [user_id, action, module, details || null, performed_by]
    );
    return { id: result.insertId, ...data };
};

const getAllByUserId = async (userId, filters = {}) => {
    let query = `
        SELECT a.*, u.username as performer_name 
        FROM ${TABLE_NAME} a 
        JOIN users u ON a.performed_by = u.id 
        WHERE a.user_id = ?
    `;
    const params = [userId];

    if (filters.module) {
        query += ' AND a.module = ?';
        params.push(filters.module);
    }

    query += ' ORDER BY a.timestamp DESC LIMIT 100';
    const [rows] = await db.query(query, params);
    return rows;
};

module.exports = {
    create,
    getAllByUserId
};
