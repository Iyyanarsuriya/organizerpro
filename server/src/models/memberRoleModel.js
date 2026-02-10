const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_member_roles',
    education: 'education_member_roles',
    hotel: 'hotel_member_roles',
    manufacturing: 'manufacturing_member_roles'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.manufacturing;

// --- IT SECTOR ---
const ITMemberRoleModel = {
    create: async (userId, name) => {
        const [res] = await db.query(`INSERT INTO it_member_roles (user_id, name) VALUES (?, ?)`, [userId, name]);
        return { id: res.insertId, user_id: userId, name };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM it_member_roles WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    }
};

// --- HOTEL SECTOR ---
const HotelMemberRoleModel = {
    create: async (userId, name) => {
        const [res] = await db.query(`INSERT INTO hotel_member_roles (user_id, name) VALUES (?, ?)`, [userId, name]);
        return { id: res.insertId, user_id: userId, name };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM hotel_member_roles WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingMemberRoleModel = {
    create: async (userId, name) => {
        const [res] = await db.query(`INSERT INTO manufacturing_member_roles (user_id, name) VALUES (?, ?)`, [userId, name]);
        return { id: res.insertId, user_id: userId, name };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM manufacturing_member_roles WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    }
};

// --- EDUCATION SECTOR ---
const EducationMemberRoleModel = {
    create: async (userId, name) => {
        const [res] = await db.query(`INSERT INTO education_member_roles (user_id, name) VALUES (?, ?)`, [userId, name]);
        return { id: res.insertId, user_id: userId, name };
    },
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM education_member_roles WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelMemberRoleModel;
        case 'it': return ITMemberRoleModel;
        case 'education': return EducationMemberRoleModel;
        default: return ManufacturingMemberRoleModel;
    }
};

// --- CORE MEMBER ROLE FUNCTIONS (DISPATCHERS) ---
const create = async (userId, name, sector) => {
    return getSectorModel(sector).create(userId, name);
};

const getAllByUserId = async (userId, sector) => {
    return getSectorModel(sector).getAll(userId);
};

const deleteResult = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAllByUserId,
    delete: deleteResult
};
