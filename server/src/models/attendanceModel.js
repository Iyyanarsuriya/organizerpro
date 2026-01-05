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

        if (filters.date) {
            query += ' AND a.date = ?';
            params.push(filters.date);
        }

        if (filters.month) {
            query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?";
            params.push(filters.month);
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

        if (filters.month) {
            query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
            params.push(filters.month);
        }

        if (filters.projectId) {
            query += " AND project_id = ?";
            params.push(filters.projectId);
        }

        if (filters.workerId) {
            query += " AND worker_id = ?";
            params.push(filters.workerId);
        }

        query += " GROUP BY status";

        const [rows] = await db.query(query, params);
        return rows;
    }
}

module.exports = Attendance;
