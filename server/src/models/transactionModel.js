const db = require('../config/db');

class Transaction {
    static async create(data) {
        const { user_id, title, amount, type, category, date, project_id } = data;
        const [result] = await db.query(
            'INSERT INTO transactions (user_id, title, amount, type, category, date, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, title, amount, type, category, date, project_id || null]
        );
        return { id: result.insertId, ...data };
    }

    static async getAllByUserId(userId, filters = {}) {
        let query = 'SELECT t.*, p.name as project_name FROM transactions t LEFT JOIN projects p ON t.project_id = p.id WHERE t.user_id = ?';
        const params = [userId];

        if (filters.projectId) {
            query += ' AND t.project_id = ?';
            params.push(filters.projectId);
        }

        if (filters.period) {
            if (filters.period.length === 10) {
                // YYYY-MM-DD (Day)
                query += " AND DATE(t.date) = ?";
                params.push(filters.period);
            } else if (filters.period.length === 8 && filters.period.includes('W')) {
                // YYYY-Www (Week)
                query += " AND DATE_FORMAT(t.date, '%Y-W%u') = ?";
                params.push(filters.period);
            } else if (filters.period.length === 7) {
                // YYYY-MM (Month)
                query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?";
                params.push(filters.period);
            } else if (filters.period.length === 4) {
                // YYYY (Year)
                query += " AND DATE_FORMAT(t.date, '%Y') = ?";
                params.push(filters.period);
            }
        }

        if (filters.startDate && filters.endDate) {
            query += " AND DATE(t.date) BETWEEN ? AND ?";
            params.push(filters.startDate, filters.endDate);
        }

        query += ' ORDER BY t.date DESC, t.created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async update(id, userId, data) {
        const { title, amount, type, category, date, project_id } = data;
        const [result] = await db.query(
            'UPDATE transactions SET title = ?, amount = ?, type = ?, category = ?, date = ?, project_id = ? WHERE id = ? AND user_id = ?',
            [title, amount, type, category, date, project_id || null, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.query(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getStats(userId, period, projectId, startDate, endDate) {
        let query = `SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
             FROM transactions WHERE user_id = ?`;
        const params = [userId];

        if (period) {
            if (period.length === 10) {
                query += " AND DATE(date) = ?";
                params.push(period);
            } else if (period.length === 8 && period.includes('W')) {
                query += " AND DATE_FORMAT(date, '%Y-W%u') = ?";
                params.push(period);
            } else if (period.length === 7) {
                query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
                params.push(period);
            } else if (period.length === 4) {
                query += " AND DATE_FORMAT(date, '%Y') = ?";
                params.push(period);
            }
        }

        if (startDate && endDate) {
            query += " AND DATE(date) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        if (projectId) {
            query += ` AND project_id = ?`;
            params.push(projectId);
        }

        const [rows] = await db.query(query, params);
        return rows[0];
    }

    static async getCategoryStats(userId, period, projectId, startDate, endDate) {
        let query = `SELECT category, type, SUM(amount) as total 
             FROM transactions WHERE user_id = ?`;
        const params = [userId];

        if (period) {
            if (period.length === 10) {
                query += " AND DATE(date) = ?";
                params.push(period);
            } else if (period.length === 8 && period.includes('W')) {
                query += " AND DATE_FORMAT(date, '%Y-W%u') = ?";
                params.push(period);
            } else if (period.length === 7) {
                query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
                params.push(period);
            } else if (period.length === 4) {
                query += " AND DATE_FORMAT(date, '%Y') = ?";
                params.push(period);
            }
        }

        if (startDate && endDate) {
            query += " AND DATE(date) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        if (projectId) {
            query += ` AND project_id = ?`;
            params.push(projectId);
        }

        query += ` GROUP BY category, type`;

        const [rows] = await db.query(query, params);
        return rows;
    }
}

module.exports = Transaction;
