const db = require('../config/db');

const TABLE_NAME = 'education_payroll';

const create = async (data) => {
    const {
        user_id, member_id, month, year, working_days, present_days, absent_days,
        half_days, lop_days, cl_used, sl_used, el_used, base_salary, net_salary,
        bonus, deductions, status, payment_mode
    } = data;

    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} 
        (user_id, member_id, month, year, working_days, present_days, absent_days, half_days, lop_days, cl_used, sl_used, el_used, base_salary, net_salary, bonus, deductions, status, payment_mode) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        working_days = VALUES(working_days), present_days = VALUES(present_days), absent_days = VALUES(absent_days), 
        half_days = VALUES(half_days), lop_days = VALUES(lop_days), cl_used = VALUES(cl_used), sl_used = VALUES(sl_used), 
        el_used = VALUES(el_used), base_salary = VALUES(base_salary), net_salary = VALUES(net_salary), 
        bonus = VALUES(bonus), deductions = VALUES(deductions), status = VALUES(status), payment_mode = VALUES(payment_mode)`,
        [user_id, member_id, month, year, working_days, present_days, absent_days, half_days, lop_days, cl_used, sl_used, el_used, base_salary, net_salary, bonus, deductions, status || 'draft', payment_mode || 'Cash']
    );
    return { id: result.insertId || null, ...data };
};

const getAllByUserId = async (userId, filters = {}) => {
    let query = `
        SELECT p.*, m.name as member_name, m.staff_id, m.department, m.role as designation
        FROM ${TABLE_NAME} p
        JOIN education_members m ON p.member_id = m.id
        WHERE p.user_id = ?
    `;
    const params = [userId];

    if (filters.month) {
        query += ' AND p.month = ?';
        params.push(filters.month);
    }
    if (filters.year) {
        query += ' AND p.year = ?';
        params.push(filters.year);
    }
    if (filters.status) {
        query += ' AND p.status = ?';
        params.push(filters.status);
    }

    query += ' ORDER BY m.name ASC';
    const [rows] = await db.query(query, params);
    return rows;
};

const updateStatus = async (id, userId, status, extras = {}) => {
    let query = `UPDATE ${TABLE_NAME} SET status = ?`;
    const params = [status];

    if (status === 'paid') {
        query += ', paid_at = CURRENT_TIMESTAMP, is_locked = 1';
    }
    if (extras.transaction_id) {
        query += ', transaction_id = ?';
        params.push(extras.transaction_id);
    }

    query += ' WHERE id = ? AND user_id = ?';
    params.push(id, userId);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
};

const getSummary = async (userId, month, year) => {
    const [rows] = await db.query(
        `SELECT 
            SUM(net_salary) as total_salary, 
            COUNT(*) as staff_count,
            SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END) as paid_salary,
            SUM(CASE WHEN status != 'paid' THEN net_salary ELSE 0 END) as pending_salary
         FROM ${TABLE_NAME} 
         WHERE user_id = ? AND month = ? AND year = ?`,
        [userId, month, year]
    );
    return rows[0];
};

module.exports = {
    create,
    getAllByUserId,
    updateStatus,
    getSummary
};
