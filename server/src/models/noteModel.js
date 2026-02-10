const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    manufacturing: 'manufacturing_notes',
    it: 'it_notes',
    education: 'education_notes',
    hotel: 'hotel_notes',
    personal: 'personal_notes'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.personal;

// --- IT SECTOR ---
const ITNoteModel = {
    create: async (data) => {
        const { user_id, title, content, color, is_pinned } = data;
        const [res] = await db.query(`INSERT INTO it_notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)`, [user_id, title, content || '', color || 'yellow', is_pinned || 0]);
        return { id: res.insertId, ...data };
    },
    update: async (id, data) => {
        const { title, content, color, is_pinned } = data;
        const [res] = await db.query(`UPDATE it_notes SET title=?, content=?, color=?, is_pinned=? WHERE id=?`, [title, content, color, is_pinned, id]);
        return res.affectedRows > 0;
    }
};

// --- HOTEL SECTOR ---
const HotelNoteModel = {
    create: async (data) => {
        const { user_id, title, content, color, is_pinned } = data;
        const [res] = await db.query(`INSERT INTO hotel_notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)`, [user_id, title, content || '', color || 'yellow', is_pinned || 0]);
        return { id: res.insertId, ...data };
    },
    update: async (id, data) => {
        const { title, content, color, is_pinned } = data;
        const [res] = await db.query(`UPDATE hotel_notes SET title=?, content=?, color=?, is_pinned=? WHERE id=?`, [title, content, color, is_pinned, id]);
        return res.affectedRows > 0;
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingNoteModel = {
    create: async (data) => {
        const { user_id, title, content, color, is_pinned } = data;
        const [res] = await db.query(`INSERT INTO manufacturing_notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)`, [user_id, title, content || '', color || 'yellow', is_pinned || 0]);
        return { id: res.insertId, ...data };
    },
    update: async (id, data) => {
        const { title, content, color, is_pinned } = data;
        const [res] = await db.query(`UPDATE manufacturing_notes SET title=?, content=?, color=?, is_pinned=? WHERE id=?`, [title, content, color, is_pinned, id]);
        return res.affectedRows > 0;
    }
};

// --- EDUCATION SECTOR ---
const EducationNoteModel = {
    create: async (data) => {
        const { user_id, title, content, color, is_pinned } = data;
        const [res] = await db.query(`INSERT INTO education_notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)`, [user_id, title, content || '', color || 'yellow', is_pinned || 0]);
        return { id: res.insertId, ...data };
    },
    update: async (id, data) => {
        const { title, content, color, is_pinned } = data;
        const [res] = await db.query(`UPDATE education_notes SET title=?, content=?, color=?, is_pinned=? WHERE id=?`, [title, content, color, is_pinned, id]);
        return res.affectedRows > 0;
    }
};

// --- PERSONAL SECTOR ---
const PersonalNoteModel = {
    create: async (data) => {
        const { user_id, title, content, color, is_pinned } = data;
        const [res] = await db.query(`INSERT INTO personal_notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)`, [user_id, title, content || '', color || 'yellow', is_pinned || 0]);
        return { id: res.insertId, ...data };
    },
    update: async (id, data) => {
        const { title, content, color, is_pinned } = data;
        const [res] = await db.query(`UPDATE personal_notes SET title=?, content=?, color=?, is_pinned=? WHERE id=?`, [title, content, color, is_pinned, id]);
        return res.affectedRows > 0;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelNoteModel;
        case 'it': return ITNoteModel;
        case 'education': return EducationNoteModel;
        case 'manufacturing': return ManufacturingNoteModel;
        default: return PersonalNoteModel;
    }
};

// --- CORE NOTE FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector).create(data);
};

const findAllByUserId = async (userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC`, [userId]);
    return rows;
};

const findById = async (id, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return rows[0];
};

const update = async (id, data) => {
    return getSectorModel(data.sector).update(id, data);
};

const deleteResult = async (id, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
};

module.exports = {
    create,
    findAllByUserId,
    findById,
    update,
    delete: deleteResult
};
