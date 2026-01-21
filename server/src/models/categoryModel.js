const db = require('../config/db');

const TABLE_NAME = 'personal_categories'; // Mapped to new V2 table

const getAllByUserId = async (userId) => {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE user_id = ? ORDER BY name ASC`, [userId]);
    return rows;
};

const create = async (categoryData) => {
    const { user_id, name, color } = categoryData;
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`,
        [user_id, name, color || '#2d5bff']
    );
    return { id: result.insertId || null, ...categoryData };
};

const deleteResult = async (id, userId) => {
    const [result] = await db.query(
        `DELETE FROM ${TABLE_NAME} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

const seedDefaultCategories = async (userId) => {
    const defaults = [
        { name: 'General', color: '#64748b' },
        { name: 'Work', color: '#2d5bff' },
        { name: 'Personal', color: '#00d1a0' },
        { name: 'Health', color: '#ef4444' },
        { name: 'Study', color: '#8b5cf6' },
        { name: 'Finance', color: '#f59e0b' }
    ];

    for (const cat of defaults) {
        await create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

module.exports = {
    getAllByUserId,
    create,
    delete: deleteResult,
    seedDefaultCategories
};
