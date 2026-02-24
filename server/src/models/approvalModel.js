const db = require('../config/db');

const getTables = (sector) => {
    return `${sector}_approvals`;
};

const ApprovalModel = {
    getAll: async (userId, sector, filters = {}) => {
        const table = getTables(sector);
        let query = `SELECT * FROM ${table} WHERE user_id = ?`;
        const params = [userId];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters.entity_type) {
            query += ' AND entity_type = ?';
            params.push(filters.entity_type);
        }

        query += ' ORDER BY created_at DESC';
        try {
            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') return [];
            throw error;
        }
    },

    create: async (userId, sector, data) => {
        const table = getTables(sector);
        const { entity_type, entity_id, amount, title, description, requested_by, required_level } = data;
        const [res] = await db.query(
            `INSERT INTO ${table} (user_id, entity_type, entity_id, amount, title, description, requested_by, required_level) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, entity_type, entity_id, amount || 0, title, description, requested_by, required_level || 1]
        );
        return { id: res.insertId, ...data };
    },

    updateStatus: async (id, userId, sector, data) => {
        const table = getTables(sector);
        const { status, approved_by, rejection_reason, approver_comments } = data;
        let query = `UPDATE ${table} SET status = ?, approver_comments = ?`;
        const params = [status, approver_comments || null];

        if (status === 'approved') {
            query += `, approved_by = ?, approved_at = NOW()`;
            params.push(approved_by);
        } else if (status === 'rejected') {
            query += `, rejection_reason = ?`;
            params.push(rejection_reason || null);
        }

        query += ` WHERE id = ? AND user_id = ?`;
        params.push(id, userId);

        const [res] = await db.query(query, params);
        return res.affectedRows > 0;
    },

    delete: async (id, userId, sector) => {
        const table = getTables(sector);
        const [res] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
        return res.affectedRows > 0;
    }
};

module.exports = ApprovalModel;
