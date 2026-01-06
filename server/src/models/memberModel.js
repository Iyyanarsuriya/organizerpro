const db = require('../config/db');

class Member {
    static async create(data) {
        const { user_id, name, role, phone, email, status, wage_type, daily_wage } = data;
        const [result] = await db.query(
            'INSERT INTO members (user_id, name, role, phone, email, status, wage_type, daily_wage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0]
        );
        return { id: result.insertId, ...data };
    }

    static async getAllByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM members WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
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
        const { name, role, phone, email, status, wage_type, daily_wage } = data;
        const [result] = await db.query(
            'UPDATE members SET name = ?, role = ?, phone = ?, email = ?, status = ?, wage_type = ?, daily_wage = ? WHERE id = ? AND user_id = ?',
            [name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0, id, userId]
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

    static async getActiveMembers(userId) {
        const [rows] = await db.query(
            'SELECT * FROM members WHERE user_id = ? AND status = "active" ORDER BY name ASC',
            [userId]
        );
        return rows;
    }
}

module.exports = Member;
