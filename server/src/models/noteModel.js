const db = require('../config/db');

const TABLE_NAME = 'personal_notes'; // Using personal by default as notes usually personal

const create = async ({ user_id, title, content, color, is_pinned }) => {
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)`,
        [user_id, title, content || '', color || 'yellow', is_pinned || false]
    );
    return { id: result.insertId, user_id, title, content, color, is_pinned };
};

const findAllByUserId = async (userId) => {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC`, [userId]);
    return rows;
};

const findById = async (id) => {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    return rows[0];
};

const update = async (id, { title, content, color, is_pinned }) => {
    const [result] = await db.query(
        `UPDATE ${TABLE_NAME} SET title = ?, content = ?, color = ?, is_pinned = ? WHERE id = ?`,
        [title, content, color, is_pinned, id]
    );
    return result.affectedRows > 0;
};

const deleteResult = async (id) => {
    const [result] = await db.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    findAllByUserId,
    findById,
    update,
    delete: deleteResult
};
