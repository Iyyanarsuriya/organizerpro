const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    manufacturing: 'manufacturing_vehicle_logs'
};

// --- MANUFACTURING SECTOR ---
const ManufacturingVehicleLogModel = {
    create: async (data) => {
        const { user_id, vehicle_name, vehicle_number, driver_name, in_time, out_time, start_km, end_km, expense_amount, income_amount, notes } = data;
        const [res] = await db.query(
            `INSERT INTO manufacturing_vehicle_logs (user_id, vehicle_name, vehicle_number, driver_name, in_time, out_time, start_km, end_km, expense_amount, income_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, vehicle_name || null, vehicle_number, driver_name || null, in_time || null, out_time || null, start_km || null, end_km || null, expense_amount || 0, income_amount || 0, notes || null]
        );
        return { id: res.insertId, ...data };
    },
    getAllByUserId: async (user_id) => {
        const [rows] = await db.query(`SELECT * FROM manufacturing_vehicle_logs WHERE user_id = ? ORDER BY in_time DESC, created_at DESC`, [user_id]);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    // Currently only manufacturing has dedicated vehicle logs
    return ManufacturingVehicleLogModel;
};

// --- CORE VEHICLE LOG FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector || 'manufacturing').create(data);
};

const getAllByUserId = async (user_id, sector = 'manufacturing') => {
    return getSectorModel(sector).getAllByUserId(user_id);
};

const updateResult = async (id, data) => {
    const { vehicle_name, vehicle_number, driver_name, in_time, out_time, start_km, end_km, expense_amount, income_amount, notes } = data;
    await db.query(
        `UPDATE manufacturing_vehicle_logs SET vehicle_name = ?, vehicle_number = ?, driver_name = ?, in_time = ?, out_time = ?, start_km = ?, end_km = ?, expense_amount = ?, income_amount = ?, notes = ? WHERE id = ?`,
        [vehicle_name || null, vehicle_number, driver_name || null, in_time || null, out_time || null, start_km || null, end_km || null, expense_amount || 0, income_amount || 0, notes || null, id]
    );
    return { id, ...data };
};

const deleteResult = async (id) => {
    await db.query(`DELETE FROM manufacturing_vehicle_logs WHERE id = ?`, [id]);
};

module.exports = {
    create,
    getAll: getAllByUserId,
    update: updateResult,
    delete: deleteResult
};
