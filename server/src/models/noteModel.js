const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'manufacturing') return 'manufacturing_notes';
    if (sector === 'it') return 'it_notes';
    if (sector === 'education') return 'education_notes';
    if (sector === 'hotel') return 'hotel_notes';
    return 'personal_notes';
};

const create = async ({ user_id, title, content, color, is_pinned, sector }) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)`,
        [user_id, title, content || '', color || 'yellow', is_pinned || false]
    );
    return { id: result.insertId, user_id, title, content, color, is_pinned };
};

const findAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC`, [userId]);
    return rows;
};

const findById = async (id, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return rows[0];
};

const update = async (id, { title, content, color, is_pinned, sector }) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `UPDATE ${table} SET title = ?, content = ?, color = ?, is_pinned = ? WHERE id = ?`,
        [title, content, color, is_pinned, id]
    );
    return result.affectedRows > 0;
};

const deleteResult = async (id, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    findAllByUserId,
    findById,
    update,
    delete: deleteResult
};
