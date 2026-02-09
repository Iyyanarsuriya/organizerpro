const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'it') return 'it_projects';
    if (sector === 'education') return 'education_projects';
    if (sector === 'hotel') return 'hotel_projects';
    return 'manufacturing_projects';
};

const create = async (userId, name, description, sector, status) => {
    const table = getTableName(sector);
    let columns = ['user_id', 'name', 'description'];
    let values = [userId, name, description || null];
    let placeholders = ['?', '?', '?'];

    if (sector === 'hotel') {
        columns.push('status');
        values.push(status || 'ongoing');
        placeholders.push('?');
    }

    const [result] = await db.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
    );
    return { id: result.insertId, user_id: userId, name, description, status };
};

const getAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE user_id = ? ORDER BY ${sector === 'hotel' ? 'name ASC' : 'created_at DESC'}`,
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
