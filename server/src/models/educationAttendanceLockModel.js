const db = require('../config/db');

const TABLE_NAME = 'education_attendance_locks';

const isLocked = async (userId, date) => {
    const [rows] = await db.query(
        `SELECT is_locked FROM ${TABLE_NAME} WHERE user_id = ? AND date = ?`,
        [userId, date]
    );
    return rows.length > 0 ? rows[0].is_locked === 1 : false;
};

const lockDate = async (userId, date, lockedBy) => {
    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (user_id, date, is_locked, locked_by) 
         VALUES (?, ?, 1, ?) 
         ON DUPLICATE KEY UPDATE is_locked = 1, locked_by = ?, locked_at = CURRENT_TIMESTAMP`,
        [userId, date, lockedBy, lockedBy]
    );
    return result.affectedRows > 0;
};

const unlockDate = async (userId, date, unlockedBy) => {
    const [result] = await db.query(
        `UPDATE ${TABLE_NAME} SET is_locked = 0, locked_by = ? WHERE user_id = ? AND date = ?`,
        [unlockedBy, userId, date]
    );
    return result.affectedRows > 0;
};

const getLockedDates = async (userId, month, year) => {
    const [rows] = await db.query(
        `SELECT date FROM ${TABLE_NAME} WHERE user_id = ? AND is_locked = 1 AND MONTH(date) = ? AND YEAR(date) = ?`,
        [userId, month, year]
    );
    return rows.map(r => r.date);
};

module.exports = {
    isLocked,
    lockDate,
    unlockDate,
    getLockedDates
};
