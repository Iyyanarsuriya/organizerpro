const db = require('../config/db');

const TABLE_NAME = 'manufacturing_work_logs';
const MEMBERS_TABLE = 'manufacturing_members';

const create = async (data) => {
    const { user_id, member_id, guest_name, date, units_produced, rate_per_unit, work_type, notes } = data;
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, member_id, guest_name, date, units_produced, rate_per_unit, work_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, member_id || null, guest_name || null, date, units_produced || 0, rate_per_unit || 0, work_type || 'production', notes || null]
    );
    return { id: result.insertId, ...data };
};

const getByUserIdAndDateRange = async (userId, startDate, endDate, memberId = null) => {
    let query = `
        SELECT dwl.*, 
        CASE 
            WHEN dwl.member_id IS NOT NULL THEN m.name 
            ELSE dwl.guest_name 
        END as member_name,
        m.wage_type 
        FROM ${TABLE_NAME} dwl
        LEFT JOIN ${MEMBERS_TABLE} m ON dwl.member_id = m.id
        WHERE dwl.user_id = ?
    `;
    const params = [userId];

    if (startDate && endDate) {
        query += ' AND dwl.date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    if (memberId) {
        query += ' AND dwl.member_id = ?';
        params.push(memberId);
    }

    query += ' ORDER BY dwl.date DESC, member_name ASC';

    const [rows] = await db.query(query, params);
    return rows;
};

const getMonthlyTotal = async (userId, year, month, memberId = null) => {
    let query = `
        SELECT 
            dwl.member_id,
            dwl.guest_name,
            CASE 
                WHEN dwl.member_id IS NOT NULL THEN m.name 
                ELSE dwl.guest_name 
            END as member_name,
            SUM(dwl.units_produced) as total_units,
            SUM(dwl.total_amount) as total_earnings,
            COUNT(*) as days_worked
        FROM ${TABLE_NAME} dwl
        LEFT JOIN ${MEMBERS_TABLE} m ON dwl.member_id = m.id
        WHERE dwl.user_id = ?
        AND YEAR(dwl.date) = ?
        AND MONTH(dwl.date) = ?
    `;
    const params = [userId, year, month];

    if (memberId) {
        query += ' AND dwl.member_id = ?';
        params.push(memberId);
    }

    query += ' GROUP BY dwl.member_id, dwl.guest_name, m.name';

    const [rows] = await db.query(query, params);
    return rows;
};

const update = async (id, userId, data) => {
    const { units_produced, rate_per_unit, work_type, notes } = data;
    const [result] = await db.query(
        `UPDATE ${TABLE_NAME} SET units_produced = ?, rate_per_unit = ?, work_type = ?, notes = ? WHERE id = ? AND user_id = ?`,
        [units_produced, rate_per_unit, work_type || 'production', notes || null, id, userId]
    );
    return result.affectedRows > 0;
};

const deleteResult = async (id, userId) => {
    const [result] = await db.query(
        `DELETE FROM ${TABLE_NAME} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

const getByMemberAndDate = async (memberId, date, userId) => {
    const [rows] = await db.query(
        `SELECT * FROM ${TABLE_NAME} WHERE member_id = ? AND date = ? AND user_id = ?`,
        [memberId, date, userId]
    );
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
