const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_categories',
    education: 'education_categories',
    hotel: 'hotel_categories', // Added hotel categories to the map
    personal: 'personal_categories'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.personal;

// --- IT SECTOR ---
const ITCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM it_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO it_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'Development', color: '#2d5bff' },
            { name: 'Testing', color: '#00d1a0' },
            { name: 'Infrastructure', color: '#64748b' },
            { name: 'Meeting', color: '#f59e0b' },
            { name: 'Client Call', color: '#ef4444' }
        ];
        for (const cat of defaults) await ITCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- HOTEL SECTOR ---
const HotelCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM hotel_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO hotel_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'Room Service', color: '#2d5bff' },
            { name: 'Maintenance', color: '#f59e0b' },
            { name: 'Housekeeping', color: '#00d1a0' },
            { name: 'Kitchen', color: '#ef4444' }
        ];
        for (const cat of defaults) await HotelCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- EDUCATION SECTOR ---
const EducationCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM education_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO education_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'Tuition', color: '#2d5bff' },
            { name: 'Exam Fees', color: '#8b5cf6' },
            { name: 'Library', color: '#00d1a0' },
            { name: 'Stationery', color: '#f59e0b' }
        ];
        for (const cat of defaults) await EducationCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- PERSONAL (DEFAULT) SECTOR ---
const PersonalCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM personal_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO personal_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'General', color: '#64748b' },
            { name: 'Work', color: '#2d5bff' },
            { name: 'Personal', color: '#00d1a0' },
            { name: 'Health', color: '#ef4444' },
            { name: 'Study', color: '#8b5cf6' },
            { name: 'Finance', color: '#f59e0b' }
        ];
        for (const cat of defaults) await PersonalCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelCategoryModel;
        case 'it': return ITCategoryModel;
        case 'education': return EducationCategoryModel;
        default: return PersonalCategoryModel;
    }
};

// --- CORE CATEGORY FUNCTIONS (DISPATCHERS) ---
const getAllByUserId = async (userId, sector = 'personal') => {
    return getSectorModel(sector).getAll(userId);
};

const create = async (categoryData) => {
    return getSectorModel(categoryData.sector).create(categoryData);
};

const deleteResult = async (id, userId, sector = 'personal') => {
    const table = getTableName(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

const seedDefaultCategories = async (userId, sector = 'personal') => {
    return getSectorModel(sector).seed(userId);
};

module.exports = {
    getAllByUserId,
    create,
    delete: deleteResult,
    seedDefaultCategories
};
