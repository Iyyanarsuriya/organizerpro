const db = require('../config/db');

class Note {
    static async create({ user_id, title, content, color, is_pinned }) {
        const [result] = await db.query(
            'INSERT INTO notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)',
            [user_id, title, content || '', color || 'yellow', is_pinned || false]
        );
        return { id: result.insertId, user_id, title, content, color, is_pinned };
    }

    static async findAllByUserId(userId) {
        const [rows] = await db.query('SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC', [userId]);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
        return rows[0];
    }

    static async update(id, { title, content, color, is_pinned }) {
        const [result] = await db.query(
            'UPDATE notes SET title = ?, content = ?, color = ?, is_pinned = ? WHERE id = ?',
            [title, content, color, is_pinned, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM notes WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Note;
