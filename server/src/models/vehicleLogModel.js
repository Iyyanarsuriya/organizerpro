const db = require('../config/db');

const TABLE_NAME = 'manufacturing_vehicle_logs';

const create = async (data) => {
    const { user_id, vehicle_name, vehicle_number, driver_name, in_time, out_time, start_km, end_km, expense_amount, income_amount, notes } = data;
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, vehicle_name, vehicle_number, driver_name, in_time, out_time, start_km, end_km, expense_amount, income_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, vehicle_name || null, vehicle_number, driver_name || null, in_time || null, out_time || null, start_km || null, end_km || null, expense_amount || 0, income_amount || 0, notes || null]
    );
    return { id: result.insertId, ...data };
};

const getAll = async (user_id) => {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE user_id = ? ORDER BY in_time DESC, created_at DESC`, [user_id]);
    return rows;
};

const update = async (id, data) => {
    const { vehicle_name, vehicle_number, driver_name, in_time, out_time, start_km, end_km, expense_amount, income_amount, notes } = data;
    await db.query(
        `UPDATE ${TABLE_NAME} SET vehicle_name = ?, vehicle_number = ?, driver_name = ?, in_time = ?, out_time = ?, start_km = ?, end_km = ?, expense_amount = ?, income_amount = ?, notes = ? WHERE id = ?`,
        [vehicle_name || null, vehicle_number, driver_name || null, in_time || null, out_time || null, start_km || null, end_km || null, expense_amount || 0, income_amount || 0, notes || null, id]
    );
    return { id, ...data };
};

const deleteResult = async (id) => {
    await db.query(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
};

module.exports = {
    create,
    getAll,
    update,
    delete: deleteResult
};
