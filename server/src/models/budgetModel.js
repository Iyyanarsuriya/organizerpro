const db = require('../config/db');

const TABLE_NAME = 'personal_budgets';

const create = async (data) => {
    const { user_id, category, amount_limit, period, month, year } = data;
    // Ensure uniqueness handled by DB constraint, or we can check first
    // For upsert behavior:
    const query = `
        INSERT INTO ${TABLE_NAME} (user_id, category, amount_limit, period, month, year)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE amount_limit = VALUES(amount_limit)
    `;
    const [result] = await db.query(query, [user_id, category, amount_limit, period || 'monthly', month || null, year || null]);
    return { id: result.insertId || result.insertId === 0 ? result.insertId : null, ...data };
};

const getAllByUserId = async (userId, period = 'monthly', month = null, year = null) => {
    let query = `SELECT * FROM ${TABLE_NAME} WHERE user_id = ?`;
    const params = [userId];

    if (period) {
        query += ` AND period = ?`;
        params.push(period);
    }

    // If specific month/year is requested, filter. Note: period='monthly' usually implies tracking per month.
    // If budgets are "global monthly" (reset every month) or "specific month" (Jan 2026 only).
    // The table supports specific month/year.
    if (month && year) {
        query += ` AND ( (month = ? AND year = ?) OR (month IS NULL AND year IS NULL) )`;
        // Logic: specific budget overrides default, or just show relevant ones?
        // Let's simplify: Get all compatible budgets.
        params.push(month, year);
    }

    query += ` ORDER BY category ASC`;
    const [rows] = await db.query(query, params);
    return rows;
};

const deleteResult = async (id, userId) => {
    const [result] = await db.query(`DELETE FROM ${TABLE_NAME} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

const getBudgetForCategory = async (userId, category, month, year) => {
    // Priority: Specific month/year > Recurring (NULL/NULL)
    const [rows] = await db.query(
        `SELECT * FROM ${TABLE_NAME} 
         WHERE user_id = ? AND category = ? 
         ORDER BY year DESC, month DESC 
         LIMIT 1`,
        [userId, category]
    );
    // Note: Use better priority logic if we support specific months
    return rows[0];
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteResult,
    getBudgetForCategory
};
