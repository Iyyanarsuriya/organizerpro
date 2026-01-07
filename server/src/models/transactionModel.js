const db = require('../config/db');

class Transaction {
    static async create(data) {
        const { user_id, title, amount, type, category, date, project_id, member_id } = data;
        const [result] = await db.query(
            'INSERT INTO transactions (user_id, title, amount, type, category, date, project_id, member_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, title, amount, type, category, date, project_id || null, member_id || null]
        );
        return { id: result.insertId, ...data };
    }

    static async getAllByUserId(userId, filters = {}) {
        let query = `SELECT t.*, p.name as project_name, w.name as member_name 
                    FROM transactions t 
                    LEFT JOIN projects p ON t.project_id = p.id 
                    LEFT JOIN members w ON t.member_id = w.id
                    WHERE t.user_id = ?`;
        const params = [userId];

        if (filters.projectId) {
            query += ' AND t.project_id = ?';
            params.push(filters.projectId);
        }

        if (filters.memberId) {
            query += ' AND t.member_id = ?';
            params.push(filters.memberId);
        }

        if (filters.memberType && filters.memberType !== 'all') {
            query += ' AND w.member_type = ?';
            params.push(filters.memberType);
        }

        if (filters.period) {
            if (filters.period.length === 10) {
                // YYYY-MM-DD (Day)
                query += " AND DATE(t.date) = ?";
                params.push(filters.period);
            } else if (filters.period.length === 8 && filters.period.includes('W')) {
                // YYYY-Www (Week)
                query += " AND DATE_FORMAT(t.date, '%x-W%v') = ?";
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
        const { title, amount, type, category, date, project_id, member_id } = data;
        const [result] = await db.query(
            'UPDATE transactions SET title = ?, amount = ?, type = ?, category = ?, date = ?, project_id = ?, member_id = ? WHERE id = ? AND user_id = ?',
            [title, amount, type, category, date, project_id || null, member_id || null, id, userId]
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

    static async getStats(userId, period, projectId, startDate, endDate, memberId, filters = {}) {
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
                query += " AND DATE_FORMAT(date, '%x-W%v') = ?";
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

        if (memberId) {
            query += ` AND member_id = ?`;
            params.push(memberId);
        }

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query = query.replace('FROM transactions', 'FROM transactions t');
            query = query.replace('WHERE user_id = ?', 'INNER JOIN members m ON t.member_id = m.id WHERE t.user_id = ?');
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }

        const [rows] = await db.query(query, params);
        return rows[0];
    }

    static async getLifetimeStats(userId, projectId, memberId, filters = {}) {
        let query = `SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
             FROM transactions WHERE user_id = ?`;
        const params = [userId];

        if (projectId) {
            query += ` AND project_id = ?`;
            params.push(projectId);
        }

        if (memberId) {
            query += ` AND member_id = ?`;
            params.push(memberId);
        }

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query = query.replace('FROM transactions', 'FROM transactions t');
            query = query.replace('WHERE user_id = ?', 'INNER JOIN members m ON t.member_id = m.id WHERE t.user_id = ?');
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }

        const [rows] = await db.query(query, params);
        return rows[0];
    }

    static async getMemberProjectStats(userId, memberId) {
        let query = `SELECT p.name as project_name, SUM(t.amount) as total
                    FROM transactions t
                    JOIN projects p ON t.project_id = p.id
                    WHERE t.user_id = ? AND t.member_id = ? AND t.type = 'expense'
                    GROUP BY t.project_id`;
        const [rows] = await db.query(query, [userId, memberId]);
        return rows;
    }

    static async getCategoryStats(userId, period, projectId, startDate, endDate, memberId, filters = {}) {
        let query = `SELECT category, type, SUM(amount) as total 
             FROM transactions WHERE user_id = ?`;
        const params = [userId];

        if (period) {
            if (period.length === 10) {
                query += " AND DATE(date) = ?";
                params.push(period);
            } else if (period.length === 8 && period.includes('W')) {
                query += " AND DATE_FORMAT(date, '%x-W%v') = ?";
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

        if (memberId) {
            query += ` AND member_id = ?`;
            params.push(memberId);
        }

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query = query.replace('FROM transactions', 'FROM transactions t');
            query = query.replace('WHERE user_id = ?', 'INNER JOIN members m ON t.member_id = m.id WHERE t.user_id = ?');
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }

        query += ` GROUP BY category, type`;

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getMemberExpenseSummary(userId, period, projectId, startDate, endDate, filters = {}) {
        let query = `SELECT m.name as member_name, SUM(t.amount) as total 
                    FROM transactions t
                    JOIN members m ON t.member_id = m.id
                    WHERE t.user_id = ? AND t.type = 'expense'`;
        const params = [userId];

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }

        if (period) {
            if (period.length === 10) {
                query += " AND DATE(t.date) = ?";
                params.push(period);
            } else if (period.length === 8 && period.includes('W')) {
                query += " AND DATE_FORMAT(t.date, '%x-W%v') = ?";
                params.push(period);
            } else if (period.length === 7) {
                query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?";
                params.push(period);
            } else if (period.length === 4) {
                query += " AND DATE_FORMAT(t.date, '%Y') = ?";
                params.push(period);
            }
        }

        if (startDate && endDate) {
            query += " AND DATE(t.date) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        if (projectId) {
            query += ` AND t.project_id = ?`;
            params.push(projectId);
        }

        query += ` GROUP BY t.member_id`;

        const [rows] = await db.query(query, params);
        return rows;
    }
}

module.exports = Transaction;
