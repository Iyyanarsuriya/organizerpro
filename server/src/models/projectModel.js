const db = require('../config/db');

const TABLE_NAME = 'manufacturing_projects';

const create = async (userId, name, description) => {
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, name, description) VALUES (?, ?, ?)`,
        [userId, name, description]
    );
    return { id: result.insertId, user_id: userId, name, description };
};

const getAllByUserId = async (userId) => {
    const [rows] = await db.query(
        `SELECT * FROM ${TABLE_NAME} WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
};

const deleteProject = async (id, userId) => {
    const [result] = await db.query(
        `DELETE FROM ${TABLE_NAME} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteProject
};
