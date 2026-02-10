const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_projects',
    education: 'education_projects',
    hotel: 'hotel_projects',
    manufacturing: 'manufacturing_projects'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.manufacturing;

// --- IT SECTOR ---
const ITProjectModel = {
    create: async (userId, name, description) => {
        const [res] = await db.query(
            `INSERT INTO it_projects (user_id, name, description) VALUES (?, ?, ?)`,
            [userId, name, description || null]
        );
        return { id: res.insertId, user_id: userId, name, description };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM it_projects WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows;
    }
};

// --- HOTEL SECTOR ---
const HotelProjectModel = {
    create: async (userId, name, description, status) => {
        const [res] = await db.query(
            `INSERT INTO hotel_projects (user_id, name, description, status) VALUES (?, ?, ?, ?)`,
            [userId, name, description || null, status || 'ongoing']
        );
        return { id: res.insertId, user_id: userId, name, description, status };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM hotel_projects WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingProjectModel = {
    create: async (userId, name, description) => {
        const [res] = await db.query(
            `INSERT INTO manufacturing_projects (user_id, name, description) VALUES (?, ?, ?)`,
            [userId, name, description || null]
        );
        return { id: res.insertId, user_id: userId, name, description };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM manufacturing_projects WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows;
    }
};

// --- EDUCATION SECTOR ---
const EducationProjectModel = {
    create: async (userId, name, description) => {
        const [res] = await db.query(
            `INSERT INTO education_projects (user_id, name, description) VALUES (?, ?, ?)`,
            [userId, name, description || null]
        );
        return { id: res.insertId, user_id: userId, name, description };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM education_projects WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelProjectModel;
        case 'it': return ITProjectModel;
        case 'education': return EducationProjectModel;
        default: return ManufacturingProjectModel;
    }
};

// --- CORE PROJECT FUNCTIONS (DISPATCHERS) ---
const create = async (userId, name, description, sector, status) => {
    return getSectorModel(sector).create(userId, name, description, status);
};

const getAllByUserId = async (userId, sector) => {
    return getSectorModel(sector).getAll(userId);
};

const deleteProject = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteProject
};
