const db = require('../config/db');

const getTableName = (sector) => {
    return sector === 'manufacturing' ? 'manufacturing_expense_categories' : 'personal_categories';
};

const getAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const query = sector === 'manufacturing'
        ? `SELECT * FROM ${table} WHERE user_id = ? ORDER BY type, name`
        : `SELECT *, 'expense' as type FROM ${table} WHERE user_id = ? ORDER BY name`; // Shim type for personal

    const [rows] = await db.query(query, [userId]);
    return rows;
};

const create = async (data) => {
    const { user_id, name, type, sector } = data;
    const table = getTableName(sector);

    // Personal categories don't have type in V2 schema (it's color instead)
    // Manufacturing has type

    let query, params;
    if (sector === 'manufacturing') {
        query = `INSERT INTO ${table} (user_id, name, type) VALUES (?, ?, ?)`;
        params = [user_id, name, type || 'expense'];
    } else {
        // Personal
        query = `INSERT INTO ${table} (user_id, name, color) VALUES (?, ?, ?)`;
        params = [user_id, name, '#2d5bff']; // Default color
    }

    const [result] = await db.query(query, params);
    return { id: result.insertId, ...data };
};

const deleteCategory = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

module.exports = {
    getAllByUserId,
    create,
    delete: deleteCategory
};
