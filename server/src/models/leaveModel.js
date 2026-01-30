const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'it') return 'it_leaves';
    return 'it_leaves'; // Default
};

const create = async (data) => {
    const table = getTableName(data.sector);
    const { user_id, member_id, leave_type, start_date, end_date, reason, status } = data;
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, member_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, member_id, leave_type, start_date, end_date, reason, status || 'pending']
    );
    return { id: result.insertId, ...data };
};

const getAll = async (userId, filters = {}) => {
    const table = getTableName(filters.sector);
    const memberTable = filters.sector === 'it' ? 'it_members' : 'it_members';

    let query = `
        SELECT l.*, m.name as member_name 
        FROM ${table} l
        JOIN ${memberTable} m ON l.member_id = m.id
        WHERE l.user_id = ?
    `;
    const params = [userId];

    if (filters.member_id) {
        query += ' AND l.member_id = ?';
        params.push(filters.member_id);
    }
    if (filters.status) {
        query += ' AND l.status = ?';
        params.push(filters.status);
    }

    query += ' ORDER BY l.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
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
    remove
};
