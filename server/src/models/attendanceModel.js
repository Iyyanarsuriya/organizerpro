const db = require('../config/db');

class Attendance {
    static async create(data) {
        const { user_id, subject, status, date, note, project_id, member_id, permission_duration, permission_start_time, permission_end_time, permission_reason } = data;
        const [result] = await db.query(
            'INSERT INTO attendance (user_id, subject, status, date, note, project_id, member_id, permission_duration, permission_start_time, permission_end_time, permission_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, subject, status, date, note, project_id || null, member_id || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null]
        );
        return { id: result.insertId, ...data };
    }

    static async getAllByUserId(userId, filters = {}) {
        let query = `SELECT a.*, p.name as project_name, w.name as member_name 
                     FROM attendance a 
                     LEFT JOIN projects p ON a.project_id = p.id 
                     LEFT JOIN members w ON a.member_id = w.id 
                     WHERE a.user_id = ?`;
        const params = [userId];

        if (filters.projectId) {
            query += ' AND a.project_id = ?';
            params.push(filters.projectId);
        }

        if (filters.memberId) {
            query += ' AND a.member_id = ?';
            params.push(filters.memberId);
        }

        if (filters.period) {
            if (filters.period.length === 10) {
                // YYYY-MM-DD (Day)
                query += " AND DATE(a.date) = ?";
                params.push(filters.period);
            } else if (filters.period.length === 8 && filters.period.includes('W')) {
                // YYYY-Www (Week)
                query += " AND DATE_FORMAT(a.date, '%x-W%v') = ?";
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
        const { subject, status, date, note, project_id, member_id, permission_duration, permission_start_time, permission_end_time, permission_reason } = data;
        const [result] = await db.query(
            'UPDATE attendance SET subject = ?, status = ?, date = ?, note = ?, project_id = ?, member_id = ?, permission_duration = ?, permission_start_time = ?, permission_end_time = ?, permission_reason = ? WHERE id = ? AND user_id = ?',
            [subject, status, date, note, project_id || null, member_id || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null, id, userId]
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
            } else if (filters.period.length === 8 && filters.period.includes('W')) {
                query += " AND DATE_FORMAT(date, '%x-W%v') = ?";
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

        if (filters.memberId) {
            query += " AND member_id = ?";
            params.push(filters.memberId);
        }

        query += " GROUP BY status";

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getMemberSummary(userId, filters = {}) {
        let query = `
            SELECT 
                w.id,
                w.name,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
                COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
                COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) as half_day,
                COUNT(CASE WHEN a.status = 'permission' THEN 1 END) as permission,
                COUNT(a.id) as total
            FROM members w
            LEFT JOIN attendance a ON w.id = a.member_id
        `;
        const params = [];
        let joinConditions = [];

        if (filters.period) {
            if (filters.period.length === 10) {
                joinConditions.push("DATE(a.date) = ?");
                params.push(filters.period);
            } else if (filters.period.length === 8 && filters.period.includes('W')) {
                joinConditions.push("DATE_FORMAT(a.date, '%x-W%v') = ?");
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

    static async quickMark(data) {
        const { user_id, member_id, date, status, project_id, subject, note, permission_duration, permission_start_time, permission_end_time, permission_reason } = data;

        // Find existing record for this member on this date and project
        let checkQuery = 'SELECT id FROM attendance WHERE user_id = ? AND member_id = ? AND DATE(date) = ?';
        const checkParams = [user_id, member_id, date];

        if (project_id) {
            checkQuery += ' AND project_id = ?';
            checkParams.push(project_id);
        } else {
            checkQuery += ' AND project_id IS NULL';
        }

        const [existing] = await db.query(checkQuery, checkParams);

        if (existing.length > 0) {
            // Update existing record
            await db.query(
                'UPDATE attendance SET status = COALESCE(?, status), note = COALESCE(?, note), permission_duration = COALESCE(?, permission_duration), permission_start_time = COALESCE(?, permission_start_time), permission_end_time = COALESCE(?, permission_end_time), permission_reason = COALESCE(?, permission_reason) WHERE id = ?',
                [status || null, note || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null, existing[0].id]
            );
            return { id: existing[0].id, ...data, updated: true };
        } else {
            // Create new record
            const [result] = await db.query(
                'INSERT INTO attendance (user_id, member_id, date, status, project_id, subject, note, permission_duration, permission_start_time, permission_end_time, permission_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [user_id, member_id, date, status, project_id || null, subject || 'Daily Attendance', note || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null]
            );
            return { id: result.insertId, ...data, created: true };
        }
    }
}

module.exports = Attendance;
