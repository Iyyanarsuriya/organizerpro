const db = require('../config/db');

class ExpenseCategory {
    static async getAllByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM expense_categories WHERE user_id = ? ORDER BY type, name',
            [userId]
        );
        return rows;
    }

    static async create(data) {
        const { user_id, name, type } = data;
        const [result] = await db.query(
            'INSERT INTO expense_categories (user_id, name, type) VALUES (?, ?, ?)',
            [user_id, name, type || 'expense']
        );
        return { id: result.insertId, ...data };
    }

    static async delete(id, userId) {
        const [result] = await db.query(
            'DELETE FROM expense_categories WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = ExpenseCategory;
