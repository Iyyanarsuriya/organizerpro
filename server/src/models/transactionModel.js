const db = require('../config/db');

class Transaction {
    static async create(data) {
        const { user_id, title, amount, type, category, date } = data;
        const [result] = await db.query(
            'INSERT INTO transactions (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, title, amount, type, category, date]
        );
        return { id: result.insertId, ...data };
    }

    static async getAllByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
            [userId]
        );
        return rows;
    }

    static async delete(id, userId) {
        const [result] = await db.query(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getStats(userId, month) {
        let query = `SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
             FROM transactions WHERE user_id = ?`;
        const params = [userId];

        if (month) {
            query += ` AND DATE_FORMAT(date, '%Y-%m') = ?`;
            params.push(month);
        }

        const [rows] = await db.query(query, params);
        return rows[0];
    }

    static async getCategoryStats(userId, month) {
        let query = `SELECT category, type, SUM(amount) as total 
             FROM transactions WHERE user_id = ?`;
        const params = [userId];

        if (month) {
            query += ` AND DATE_FORMAT(date, '%Y-%m') = ?`;
            params.push(month);
        }

        query += ` GROUP BY category, type`;

        const [rows] = await db.query(query, params);
        return rows;
    }
}

module.exports = Transaction;
