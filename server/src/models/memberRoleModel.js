const db = require('../config/db');

const TABLE_NAME = 'manufacturing_member_roles';

const create = async (userId, name) => {
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, name) VALUES (?, ?)`,
        [userId, name]
    );
    return { id: result.insertId, user_id: userId, name };
};

const getAllByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT * FROM ${TABLE_NAME} WHERE user_id = ? ORDER BY name ASC`,
        [userId]
    );
    return rows;
};

const deleteResult = async (id, userId) => {
    const [result] = await db.query(
        `DELETE FROM ${TABLE_NAME} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteResult
};
