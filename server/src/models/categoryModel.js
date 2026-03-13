const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_reminder_categories', // Updated to specific reminder categories table
    education: 'education_reminder_categories', // Updated to specific reminder categories table
    hotel: 'hotel_reminder_categories', // Updated to specific reminder categories table
    manufacturing: 'manufacturing_reminder_categories', // Updated to specific reminder categories table
    personal: 'personal_reminder_categories'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.personal;

// --- IT SECTOR ---
const ITCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM it_reminder_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO it_reminder_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'General', color: '#64748b' }
        ];
        for (const cat of defaults) await ITCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- HOTEL SECTOR ---
const HotelCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM hotel_reminder_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO hotel_reminder_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'General', color: '#64748b' }
        ];
        for (const cat of defaults) await HotelCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM manufacturing_reminder_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO manufacturing_reminder_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'General', color: '#64748b' }
        ];
        for (const cat of defaults) await ManufacturingCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- EDUCATION SECTOR ---
const EducationCategoryModel = {
    getAll: async (userId) => {
        const [rows] = await db.query(`SELECT * FROM education_reminder_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO education_reminder_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'General', color: '#64748b' }
        ];
        for (const cat of defaults) await EducationCategoryModel.create({ user_id: userId, name: cat.name, color: cat.color });
    }
};

// --- PERSONAL (DEFAULT) SECTOR ---
const PersonalCategoryModel = {
    getAll: async (userId) => {
        let [rows] = await db.query(`SELECT * FROM personal_reminder_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        const hasGeneral = rows.some(r => r.name === 'General');
        if (rows.length === 0 || !hasGeneral) {
            await PersonalCategoryModel.seed(userId);
            [rows] = await db.query(`SELECT * FROM personal_reminder_categories WHERE user_id = ? ORDER BY name ASC`, [userId]);
        }
        return rows;
    },
    create: async (data) => {
        const { user_id, name, color } = data;
        const [res] = await db.query(`INSERT INTO personal_reminder_categories (user_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name`, [user_id, name, color || '#2d5bff']);
        return { id: res.insertId, ...data };
    },
    seed: async (userId) => {
        const defaults = [
            { name: 'General', color: '#64748b' }
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
        case 'manufacturing': return ManufacturingCategoryModel;
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
