const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    education: 'education_departments'
};

// --- EDUCATION SECTOR ---
const EducationDepartmentModel = {
    create: async (data) => {
        const { user_id, name } = data;
        const [res] = await db.query(`INSERT INTO education_departments (user_id, name) VALUES (?, ?)`, [user_id, name]);
        return { id: res.insertId, ...data };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM education_departments WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    // Currently only education has dedicated departments
    return EducationDepartmentModel;
};

// --- CORE DEPARTMENT FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector || 'education').create(data);
};

const getAllByUserId = async (userId, sector = 'education') => {
    return getSectorModel(sector).getAll(userId);
};

const deleteResult = async (id, userId, sector = 'education') => {
    const table = TABLE_MAP[sector] || TABLE_MAP.education;
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteResult
};
