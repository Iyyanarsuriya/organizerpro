const db = require('../config/db');

class Project {
    static async create(userId, name, description) {
        const [result] = await db.query(
            'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
            [userId, name, description]
        );
        return { id: result.insertId, user_id: userId, name, description };
    }

    static async getAllByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    static async delete(id, userId) {
        // Transactions with this project_id will have project_id set to NULL automatically due to SET NULL constraint,
        // or we can handle it explicitly if we want specific behavior.
        // For now, reliance on DB constraint is fine or we can let the user decide.
        // The migration set "ON DELETE SET NULL".
        const [result] = await db.query(
            'DELETE FROM projects WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Project;
