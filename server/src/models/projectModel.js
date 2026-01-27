const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'it') return 'it_projects';
    if (sector === 'education') return 'education_projects';
    return 'manufacturing_projects';
};

const create = async (userId, name, description, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, name, description) VALUES (?, ?, ?)`,
        [userId, name, description]
    );
    return { id: result.insertId, user_id: userId, name, description };
};

const getAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
};

const deleteProject = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteProject
};
