const db = require('../config/db');

class Attendance {
    static async create(data) {
        const { user_id, subject, status, date, note, project_id, worker_id } = data;
        const [result] = await db.query(
            'INSERT INTO attendance (user_id, subject, status, date, note, project_id, worker_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, subject, status, date, note, project_id || null, worker_id || null]
        );
        return { id: result.insertId, ...data };
    }

    static async getAllByUserId(userId, filters = {}) {
        let query = `SELECT a.*, p.name as project_name, w.name as worker_name 
                     FROM attendance a 
                     LEFT JOIN projects p ON a.project_id = p.id 
                     LEFT JOIN workers w ON a.worker_id = w.id 
                     WHERE a.user_id = ?`;
        const params = [userId];

        if (filters.projectId) {
            query += ' AND a.project_id = ?';
            params.push(filters.projectId);
        }

        if (filters.workerId) {
            query += ' AND a.worker_id = ?';
            params.push(filters.workerId);
        }

        if (filters.period) {
            if (filters.period.length === 10) {
                // YYYY-MM-DD (Day)
                query += " AND DATE(a.date) = ?";
                params.push(filters.period);
            } else if (filters.period.length === 7) {
                // YYYY-MM (Month)
                query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?";
                params.push(filters.period);
            } else if (filters.period.length === 4) {
                // YYYY (Year)
                query += " AND DATE_FORMAT(a.date, '%Y') = ?";
                params.push(filters.period);
            }
        }

        if (filters.startDate && filters.endDate) {
            query += " AND DATE(a.date) BETWEEN ? AND ?";
            params.push(filters.startDate, filters.endDate);
        }

        query += ' ORDER BY a.date DESC, a.created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async update(id, userId, data) {
        const { subject, status, date, note, project_id, worker_id } = data;
        const [result] = await db.query(
            'UPDATE attendance SET subject = ?, status = ?, date = ?, note = ?, project_id = ?, worker_id = ? WHERE id = ? AND user_id = ?',
            [subject, status, date, note, project_id || null, worker_id || null, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.query(
            'DELETE FROM attendance WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getStats(userId, filters = {}) {
        let query = `
            SELECT 
                status, 
                COUNT(*) as count 
            FROM attendance 
            WHERE user_id = ?
        `;
        const params = [userId];

        if (filters.period) {
            if (filters.period.length === 10) {
                query += " AND DATE(date) = ?";
                params.push(filters.period);
            } else if (filters.period.length === 7) {
                query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
                params.push(filters.period);
            } else if (filters.period.length === 4) {
                query += " AND DATE_FORMAT(date, '%Y') = ?";
                params.push(filters.period);
            }
        }

        if (filters.startDate && filters.endDate) {
            query += " AND DATE(date) BETWEEN ? AND ?";
            params.push(filters.startDate, filters.endDate);
        }

        if (filters.workerId) {
            query += " AND worker_id = ?";
            params.push(filters.workerId);
        }

        query += " GROUP BY status";

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getWorkerSummary(userId, filters = {}) {
        let query = `
            SELECT 
                w.id,
                w.name,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
                COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
                COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) as half_day,
                COUNT(a.id) as total
            FROM workers w
            LEFT JOIN attendance a ON w.id = a.worker_id
        `;
        const params = [];
        let joinConditions = [];

        if (filters.period) {
            if (filters.period.length === 10) {
                joinConditions.push("DATE(a.date) = ?");
                params.push(filters.period);
            } else if (filters.period.length === 7) {
                joinConditions.push("DATE_FORMAT(a.date, '%Y-%m') = ?");
                params.push(filters.period);
            } else if (filters.period.length === 4) {
                joinConditions.push("DATE_FORMAT(a.date, '%Y') = ?");
                params.push(filters.period);
            }
        }

        if (filters.startDate && filters.endDate) {
            joinConditions.push("DATE(a.date) BETWEEN ? AND ?");
            params.push(filters.startDate, filters.endDate);
        }

        if (filters.projectId) {
            joinConditions.push("a.project_id = ?");
            params.push(filters.projectId);
        }

        if (joinConditions.length > 0) {
            query += " AND " + joinConditions.join(' AND ');
        }

        query += " WHERE w.user_id = ? AND w.status = 'active'";
        params.push(userId);

        query += " GROUP BY w.id, w.name ORDER BY w.name ASC";

        const [rows] = await db.query(query, params);
        return rows;
    }
}

module.exports = Attendance;
