const db = require('../config/db');

const getTableName = (sector) => {
    switch (sector) {
        case 'it': return 'it_categories';
        case 'manufacturing': return 'manufacturing_expense_categories'; // Assuming this for later, keep in mind
        case 'personal':
        default: return 'personal_categories';
    }
};

const getAllByUserId = async (userId, sector = 'personal') => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY name ASC`, [userId]);
    return rows;
};

const create = async (categoryData) => {
    const { user_id, name, color, sector = 'personal' } = categoryData;
    const table = getTableName(sector);
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`,
        [user_id, name, color || '#2d5bff']
    );
    return { id: result.insertId || null, ...categoryData };
};

const deleteResult = async (id, userId, sector = 'personal') => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

const seedDefaultCategories = async (userId, sector = 'personal') => {
    let defaults = [];

    if (sector === 'it') {
        defaults = [
            { name: 'Development', color: '#2d5bff' },
            { name: 'Testing', color: '#00d1a0' },
            { name: 'Infrastructure', color: '#64748b' },
            { name: 'Meeting', color: '#f59e0b' },
            { name: 'Client Call', color: '#ef4444' }
        ];
    } else {
        defaults = [
            { name: 'General', color: '#64748b' },
            { name: 'Work', color: '#2d5bff' },
            { name: 'Personal', color: '#00d1a0' },
            { name: 'Health', color: '#ef4444' },
            { name: 'Study', color: '#8b5cf6' },
            { name: 'Finance', color: '#f59e0b' }
        ];
    }

    for (const cat of defaults) {
        await create({ user_id: userId, name: cat.name, color: cat.color, sector });
    }
};

module.exports = {
    getAllByUserId,
    create,
    delete: deleteResult,
    seedDefaultCategories
};
