const db = require('../config/db');

const getTableName = (sector) => sector === 'it' ? 'it_member_roles' : 'manufacturing_member_roles';

const create = async (userId, name, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, name) VALUES (?, ?)`,
        [userId, name]
    );
    return { id: result.insertId, user_id: userId, name };
};

const getAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE user_id = ? ORDER BY name ASC`,
        [userId]
    );
    return rows;
};

const deleteResult = async (id, userId, sector) => {
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
    delete: deleteResult
};
