const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    manufacturing: 'manufacturing_work_types'
};

// --- MANUFACTURING SECTOR ---
const ManufacturingWorkTypeModel = {
    create: async (userId, name) => {
        const [res] = await db.query(`INSERT INTO manufacturing_work_types (user_id, name) VALUES (?, ?)`, [userId, name]);
        return { id: res.insertId, name, user_id: userId };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM manufacturing_work_types WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    // Currently only manufacturing has dedicated work types (for piece-rate)
    return ManufacturingWorkTypeModel;
};

// --- CORE WORK TYPE FUNCTIONS (DISPATCHERS) ---
const create = async (userId, name, sector = 'manufacturing') => {
    return getSectorModel(sector).create(userId, name);
};

const getAll = async (userId, sector = 'manufacturing') => {
    return getSectorModel(sector).getAll(userId);
};

const deleteResult = async (id, userId, sector = 'manufacturing') => {
    const table = TABLE_MAP[sector] || TABLE_MAP.manufacturing;
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAll,
    delete: deleteResult
};
