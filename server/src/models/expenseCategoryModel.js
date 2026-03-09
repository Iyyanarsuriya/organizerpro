const db = require('../config/db');

const getTableName = (sector) => {





    if (sector === 'it') return 'it_reminder_categories';
    if (sector === 'education') return 'education_expense_categories';
    if (sector === 'manufacturing') return 'manufacturing_expense_categories';
    return 'personal_expense_categories';
};

const getAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const query = (sector === 'manufacturing' || sector === 'education' || sector === 'personal' || !sector)
        ? `SELECT * FROM ${table} WHERE user_id = ? ORDER BY type, name`
        : `SELECT *, 'expense' as type FROM ${table} WHERE user_id = ? ORDER BY name`;

    let [rows] = await db.query(query, [userId]);

    // Auto-seed for Personal Sector if empty or 'General' is missing
    const hasGeneral = rows.some(r => r.name === 'General');
    if ((sector === 'personal' || !sector) && (rows.length === 0 || !hasGeneral)) {
        await seed(userId, sector);
        [rows] = await db.query(query, [userId]);
    }

    return rows;
};

const seed = async (userId, sector) => {
    const table = getTableName(sector);
    const defaults = [
        { name: 'General', color: '#64748b', type: 'expense' },
        { name: 'Salary', color: '#2d5bff', type: 'income' },
        { name: 'Investment', color: '#10b981', type: 'income' }
    ];

    const query = `INSERT INTO ${table} (user_id, name, color, type) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name`;

    for (const cat of defaults) {
        await db.query(query, [userId, cat.name, cat.color, cat.type]);
    }
};

const create = async (data) => {
    const { user_id, name, type, sector } = data;
    const table = getTableName(sector);

    let query, params;
    if (sector === 'manufacturing' || sector === 'education' || sector === 'personal' || !sector) {
        query = `INSERT INTO ${table} (user_id, name, type, color) VALUES (?, ?, ?, ?)`;
        params = [user_id, name, type || 'expense', data.color || '#2d5bff'];
    } else {
        query = `INSERT INTO ${table} (user_id, name, color) VALUES (?, ?, ?)`;
        params = [user_id, name, data.color || '#2d5bff'];
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
