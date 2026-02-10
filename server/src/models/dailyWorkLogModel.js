const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    manufacturing: 'manufacturing_work_logs'
};

// --- MANUFACTURING SECTOR ---
const ManufacturingWorkLogModel = {
    create: async (data) => {
        const { user_id, member_id, guest_name, date, units_produced, rate_per_unit, work_type, notes } = data;
        const [res] = await db.query(
            `INSERT INTO manufacturing_work_logs (user_id, member_id, guest_name, date, units_produced, rate_per_unit, work_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, member_id || null, guest_name || null, date, units_produced || 0, rate_per_unit || 0, work_type || 'production', notes || null]
        );
        return { id: res.insertId, ...data };
    },
    getByRange: async (userId, startDate, endDate, memberId) => {
        let query = `
            SELECT dwl.*, 
            CASE WHEN dwl.member_id IS NOT NULL THEN m.name ELSE dwl.guest_name END as member_name,
            m.wage_type 
            FROM manufacturing_work_logs dwl
            LEFT JOIN manufacturing_members m ON dwl.member_id = m.id
            WHERE dwl.user_id = ?
        `;
        const params = [userId];
        if (startDate && endDate) { query += ' AND dwl.date BETWEEN ? AND ?'; params.push(startDate, endDate); }
        if (memberId) { query += ' AND dwl.member_id = ?'; params.push(memberId); }
        query += ' ORDER BY dwl.date DESC, member_name ASC';
        const [rows] = await db.query(query, params);
        return rows;
    },
    getMonthlyTotal: async (userId, year, month, memberId) => {
        let query = `
            SELECT dwl.member_id, dwl.guest_name,
            CASE WHEN dwl.member_id IS NOT NULL THEN m.name ELSE dwl.guest_name END as member_name,
            SUM(dwl.units_produced) as total_units, SUM(dwl.total_amount) as total_earnings, COUNT(*) as days_worked
            FROM manufacturing_work_logs dwl
            LEFT JOIN manufacturing_members m ON dwl.member_id = m.id
            WHERE dwl.user_id = ? AND YEAR(dwl.date) = ? AND MONTH(dwl.date) = ?
        `;
        const params = [userId, year, month];
        if (memberId) { query += ' AND dwl.member_id = ?'; params.push(memberId); }
        query += ' GROUP BY dwl.member_id, dwl.guest_name, m.name';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    // Currently only manufacturing has piece-rate work logs
    return ManufacturingWorkLogModel;
};

// --- CORE WORK LOG FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector || 'manufacturing').create(data);
};

const getByUserIdAndDateRange = async (userId, startDate, endDate, memberId = null, sector = 'manufacturing') => {
    return getSectorModel(sector).getByRange(userId, startDate, endDate, memberId);
};

const getMonthlyTotal = async (userId, year, month, memberId = null, sector = 'manufacturing') => {
    return getSectorModel(sector).getMonthlyTotal(userId, year, month, memberId);
};

const update = async (id, userId, data) => {
    const { units_produced, rate_per_unit, work_type, notes } = data;
    const [result] = await db.query(
        `UPDATE manufacturing_work_logs SET units_produced = ?, rate_per_unit = ?, work_type = ?, notes = ? WHERE id = ? AND user_id = ?`,
        [units_produced, rate_per_unit, work_type || 'production', notes || null, id, userId]
    );
    return result.affectedRows > 0;
};

const deleteResult = async (id, userId) => {
    const [result] = await db.query(`DELETE FROM manufacturing_work_logs WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

const getByMemberAndDate = async (memberId, date, userId) => {
    const [rows] = await db.query(`SELECT * FROM manufacturing_work_logs WHERE member_id = ? AND date = ? AND user_id = ?`, [memberId, date, userId]);
    return rows[0];
};

module.exports = {
    create,
    getByUserIdAndDateRange,
    getMonthlyTotal,
    update,
    delete: deleteResult,
    getByMemberAndDate
};
