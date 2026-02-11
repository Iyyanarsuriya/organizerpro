const db = require('../../config/db');

const LookupController = {
    getOptions: async (req, res) => {
        try {
            const { type } = req.query;
            const userId = req.user.data_owner_id;

            let query = "SELECT * FROM hotel_lookup_options WHERE user_id = ?";
            const params = [userId];

            if (type) {
                query += " AND type = ?";
                params.push(type);
            }

            query += " ORDER BY name ASC";

            const [rows] = await db.query(query, params);
            res.json({ data: rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    addOption: async (req, res) => {
        try {
            const { type, name } = req.body;
            const userId = req.user.data_owner_id;

            if (!type || !name) {
                return res.status(400).json({ error: "Type and name are required" });
            }

            const [result] = await db.query(
                "INSERT INTO hotel_lookup_options (user_id, type, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name",
                [userId, type, name]
            );

            res.status(201).json({ id: result.insertId, type, name });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteOption: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.data_owner_id;

            const [result] = await db.query(
                "DELETE FROM hotel_lookup_options WHERE id = ? AND user_id = ?",
                [id, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Option not found or access denied" });
            }

            res.json({ success: true, message: "Deleted" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = LookupController;
