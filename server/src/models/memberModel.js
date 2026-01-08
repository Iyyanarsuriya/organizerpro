const db = require('../config/db');

class Member {
    static async create(data) {
        const { user_id, name, role, phone, email, status, wage_type, daily_wage, member_type } = data;
        const [result] = await db.query(
            'INSERT INTO members (user_id, name, role, phone, email, status, wage_type, daily_wage, member_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0, member_type || 'worker']
        );
        return { id: result.insertId, ...data };
    }

    static async getAllByUserId(userId, memberType = null) {
        let query = 'SELECT * FROM members WHERE user_id = ?';
        let params = [userId];
        if (memberType && memberType !== 'all') {
            query += ' AND member_type = ?';
            params.push(memberType);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getById(id, userId) {
        const [rows] = await db.query(
            'SELECT * FROM members WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    }

    static async update(id, userId, data) {
        const { name, role, phone, email, status, wage_type, daily_wage, member_type } = data;
        const [result] = await db.query(
            'UPDATE members SET name = ?, role = ?, phone = ?, email = ?, status = ?, wage_type = ?, daily_wage = ?, member_type = ? WHERE id = ? AND user_id = ?',
            [name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0, member_type || 'worker', id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.query(
            'DELETE FROM members WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getActiveMembers(userId, memberType = null) {
        let query = 'SELECT * FROM members WHERE user_id = ? AND status = "active"';
        let params = [userId];
        if (memberType && memberType !== 'all') {
            query += ' AND member_type = ?';
            params.push(memberType);
        }
        query += ' ORDER BY name ASC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getGuests(userId) {
        const query = `
            SELECT DISTINCT guest_name, 'guest' as member_type, 'active' as status, 0 as id 
            FROM transactions 
            WHERE user_id = ? AND member_id IS NULL AND guest_name IS NOT NULL AND guest_name != ''
            UNION
            SELECT DISTINCT guest_name, 'guest' as member_type, 'active' as status, 0 as id 
            FROM daily_work_logs 
            WHERE user_id = ? AND member_id IS NULL AND guest_name IS NOT NULL AND guest_name != ''
            ORDER BY guest_name ASC
        `;
        const [rows] = await db.query(query, [userId, userId]);
        return rows.map((row, index) => ({
            ...row,
            id: `guest-${index}`, // Generate temporary unique ID for frontend keys
            name: row.guest_name,
            role: 'Guest / Temp',
            phone: '-',
            email: '-',
            wage_type: 'daily',
            daily_wage: 0
        }));
    }
}

module.exports = Member;
