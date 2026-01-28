const db = require('../config/db');

// Only handling 'education' sector for now as requested
const getTableName = (sector) => {
    return 'education_departments';
};

const create = async (data) => {
    const table = getTableName(data.sector);
    const { user_id, name } = data;
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, name) VALUES (?, ?)`,
        [user_id, name]
    );
    return { id: result.insertId, ...data };
};

const getAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY name ASC`, [userId]);
    return rows;
};

const deleteById = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteById
};
