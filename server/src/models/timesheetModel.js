const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'it') return 'it_timesheets';
    return 'it_timesheets'; // Default
};

const create = async (data) => {
    const table = getTableName(data.sector);
    const { user_id, member_id, project_id, date, task_description, hours_spent, is_billable, status } = data;
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, member_id, project_id, date, task_description, hours_spent, is_billable, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, member_id, project_id || null, date, task_description, hours_spent || 0, is_billable || 1, status || 'pending']
    );
    return { id: result.insertId, ...data };
};

const getAll = async (userId, filters = {}) => {
    const table = getTableName(filters.sector);
    const memberTable = filters.sector === 'it' ? 'it_members' : 'it_members';
    const projectTable = filters.sector === 'it' ? 'it_projects' : 'it_projects';

    let query = `
        SELECT t.*, m.name as member_name, p.name as project_name 
        FROM ${table} t
        JOIN ${memberTable} m ON t.member_id = m.id
        LEFT JOIN ${projectTable} p ON t.project_id = p.id
        WHERE t.user_id = ?
    `;
    const params = [userId];

    if (filters.member_id) {
        query += ' AND t.member_id = ?';
        params.push(filters.member_id);
    }
    if (filters.project_id) {
        query += ' AND t.project_id = ?';
        params.push(filters.project_id);
    }
    if (filters.date) {
        query += ' AND t.date = ?';
        params.push(filters.date);
    }
    if (filters.status) {
        query += ' AND t.status = ?';
        params.push(filters.status);
    }

    query += ' ORDER BY t.date DESC';

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
