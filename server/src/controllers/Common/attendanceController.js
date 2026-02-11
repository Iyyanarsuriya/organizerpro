const Attendance = require('../../models/attendanceModel');
const AuditLog = require('../../models/auditLogModel');
const db = require('../../config/db');

// --- SHARED UTILS ---
const checkPastDateRestriction = (req, targetDate) => {
    if (!req.user.owner_id) return null;
    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date(targetDate).toISOString().split('T')[0];
    return checkDate < today ? "Child users cannot modify attendance for previous days." : null;
};

// --- SECTOR SPECIFIC CONTROLLERS ---

const HotelAttendanceController = {
    create: async (req, res) => {
        const attendance = await Attendance.create({ ...req.body, user_id: req.user.data_owner_id, created_by: req.user.username });
        res.status(201).json({ success: true, data: attendance });
    },
    quickMark: async (req, res) => {
        const result = await Attendance.quickMark({ ...req.body, user_id: req.user.data_owner_id, updated_by: req.user.username });
        res.status(result.updated ? 200 : 201).json({ success: true, data: result });
    }
};

const ManufacturingAttendanceController = {
    checkLock: async (userId, date) => {
        const month = new Date(date).getMonth() + 1;
        const year = new Date(date).getFullYear();
        const [locks] = await db.query(`SELECT id FROM manufacturing_attendance_locks WHERE user_id = ? AND month = ? AND year = ? AND unlocked_at IS NULL`, [userId, month, year]);
        return locks.length > 0;
    },
    create: async (req, res) => {
        if (await ManufacturingAttendanceController.checkLock(req.user.data_owner_id, req.body.date)) return res.status(403).json({ success: false, message: "Attendance is locked." });
        const attendance = await Attendance.create({ ...req.body, user_id: req.user.data_owner_id, created_by: req.user.username });
        res.status(201).json({ success: true, data: attendance });
    },
    quickMark: async (req, res) => {
        const { status, member_id, date } = req.body;
        if (['CL', 'SL', 'EL'].includes(status)) {
            const [member] = await db.query('SELECT cl_balance, sl_balance, el_balance FROM manufacturing_members WHERE id = ?', [member_id]);
            if (member.length > 0) {
                const field = `${status.toLowerCase()}_balance`;
                if (member[0][field] <= 0) return res.status(400).json({ success: false, message: `Insufficient ${status} balance.` });
                await db.query(`UPDATE manufacturing_members SET ${field} = ${field} - 1 WHERE id = ?`, [member_id]);
            }
        }
        const result = await Attendance.quickMark({ ...req.body, user_id: req.user.data_owner_id, updated_by: req.user.username });
        res.status(200).json({ success: true, data: result });
    }
};

const EducationAttendanceController = {
    checkLock: async (userId, date) => {
        const [locks] = await db.query(`SELECT id FROM education_attendance_locks WHERE user_id = ? AND date = ? AND is_locked = 1`, [userId, date]);
        return locks.length > 0;
    },
    create: async (req, res) => {
        if (await EducationAttendanceController.checkLock(req.user.data_owner_id, req.body.date)) return res.status(403).json({ success: false, message: "Attendance is locked." });
        const attendance = await Attendance.create({ ...req.body, user_id: req.user.data_owner_id, created_by: req.user.username });
        await AuditLog.create({ user_id: req.user.data_owner_id, action: 'CREATED_ATTENDANCE', module: 'attendance', details: `Created attendance for ${req.body.member_id}`, performed_by: req.user.id });
        res.status(201).json({ success: true, data: attendance });
    }
};

const ITAttendanceController = {
    create: async (req, res) => {
        const attendance = await Attendance.create({ ...req.body, user_id: req.user.data_owner_id, created_by: req.user.username });
        res.status(201).json({ success: true, data: attendance });
    }
};

// --- DISPATCHER HELPERS ---
const getSectorController = (sector) => {
    switch (sector) {
        case 'hotel': return HotelAttendanceController;
        case 'it': return ITAttendanceController;
        case 'education': return EducationAttendanceController;
        default: return ManufacturingAttendanceController;
    }
};

// --- CORE CONTROLLER FUNCTIONS (DISPATCHERS) ---

const createAttendance = async (req, res) => {
    try {
        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });
        return getSectorController(req.body.sector).create(req, res);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getAttendances = async (req, res) => {
    try {
        const sector = req.query.sector || (req.baseUrl.includes('education') ? 'education' :
            req.baseUrl.includes('manufacturing') ? 'manufacturing' :
                req.baseUrl.includes('it') ? 'it' :
                    req.baseUrl.includes('hotel') ? 'hotel' : 'manufacturing');

        const data = await Attendance.getAllByUserId(req.user.data_owner_id, { ...req.query, sector });
        res.status(200).json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateAttendance = async (req, res) => {
    try {
        const sector = req.body.sector || req.query.sector;
        const updated = await Attendance.update(req.params.id, req.user.data_owner_id, { ...req.body, updated_by: req.user.username });
        res.status(updated ? 200 : 404).json({ success: updated, message: updated ? "Updated" : "Not found" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteAttendance = async (req, res) => {
    try {
        const deleted = await Attendance.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        res.status(deleted ? 200 : 404).json({ success: deleted, message: deleted ? "Deleted" : "Not found" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getAttendanceStats = async (req, res) => {
    try {
        const sector = req.query.sector || (req.baseUrl.includes('education') ? 'education' :
            req.baseUrl.includes('manufacturing') ? 'manufacturing' :
                req.baseUrl.includes('it') ? 'it' :
                    req.baseUrl.includes('hotel') ? 'hotel' : 'manufacturing');

        const data = await Attendance.getStats(req.user.data_owner_id, { ...req.query, sector });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMemberSummary = async (req, res) => {
    try {
        const sector = req.query.sector || (req.baseUrl.includes('education') ? 'education' :
            req.baseUrl.includes('manufacturing') ? 'manufacturing' :
                req.baseUrl.includes('it') ? 'it' :
                    req.baseUrl.includes('hotel') ? 'hotel' : 'manufacturing');

        const data = await Attendance.getMemberSummary(req.user.data_owner_id, { ...req.query, sector });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const quickMarkAttendance = async (req, res) => {
    try {
        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });
        return getSectorController(req.body.sector).quickMark ? getSectorController(req.body.sector).quickMark(req, res) : HotelAttendanceController.quickMark(req, res);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const bulkMarkAttendance = async (req, res) => {
    try {
        const result = await Attendance.bulkMark({ ...req.body, user_id: req.user.data_owner_id, updated_by: req.user.username });
        res.status(200).json({ success: true, data: result });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// ... Holidays & Shifts (Simplified Dispatchers) ...
const getHolidays = async (req, res) => { try { res.json({ success: true, data: await Attendance.getHolidays(req.user.data_owner_id, req.query.sector) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
const createHoliday = async (req, res) => { try { res.json({ success: true, data: await Attendance.createHoliday({ ...req.body, user_id: req.user.data_owner_id }) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
const deleteHoliday = async (req, res) => { try { await Attendance.deleteHoliday(req.params.id, req.user.data_owner_id, req.query.sector); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
const getShifts = async (req, res) => { try { res.json({ success: true, data: await Attendance.getShifts(req.user.data_owner_id, req.query.sector) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
const createShift = async (req, res) => { try { res.json({ success: true, data: await Attendance.createShift({ ...req.body, user_id: req.user.data_owner_id }) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
const deleteShift = async (req, res) => { try { await Attendance.deleteShift(req.params.id, req.user.data_owner_id, req.query.sector); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };

// --- LOCKING ---
const lockAttendance = async (req, res) => {
    try {
        const sector = req.body.sector || (req.baseUrl.includes('education') ? 'education' :
            req.baseUrl.includes('manufacturing') ? 'manufacturing' :
                req.baseUrl.includes('it') ? 'it' :
                    req.baseUrl.includes('hotel') ? 'hotel' : 'manufacturing');

        const { month, year, date } = req.body;
        const userId = req.user.data_owner_id;
        if (sector === 'education') {
            // Upsert or Insert check 
            // With Education, we might just store date. If already locked?
            // Assuming simply insert or ignore duplicate
            await db.query('INSERT IGNORE INTO education_attendance_locks (user_id, date, is_locked, locked_by) VALUES (?, ?, 1, ?)', [userId, date, req.user.id]);
            // If ignore didn't insert, update
            await db.query('UPDATE education_attendance_locks SET is_locked = 1 WHERE user_id = ? AND date = ?', [userId, date]);
        }
        else if (sector === 'manufacturing') await db.query('INSERT INTO manufacturing_attendance_locks (user_id, month, year, locked_by) VALUES (?, ?, ?, ?)', [userId, month, year, req.user.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const unlockAttendance = async (req, res) => {
    try {
        const sector = req.body.sector || (req.baseUrl.includes('education') ? 'education' :
            req.baseUrl.includes('manufacturing') ? 'manufacturing' :
                req.baseUrl.includes('it') ? 'it' :
                    req.baseUrl.includes('hotel') ? 'hotel' : 'manufacturing');

        const { month, year, date, reason } = req.body;
        if (req.user.owner_id) return res.status(403).json({ success: false, message: "Only owner can unlock" });

        if (sector === 'education') {
            await db.query(`UPDATE education_attendance_locks SET is_locked = 0 WHERE user_id = ? AND date = ?`, [req.user.data_owner_id, date]);
        } else {
            // For now default other sectors might attempt this, but let's be safe
            if (sector !== 'manufacturing') {
                return res.status(400).json({ success: false, message: "Sector not supported for locking yet" });
            }
            const table = 'manufacturing_attendance_locks';
            await db.query(`UPDATE ${table} SET unlocked_by = ?, unlocked_at = NOW(), unlock_reason = ? WHERE user_id = ? AND month = ? AND year = ?`, [req.user.id, reason, req.user.data_owner_id, month, year]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getLockStatus = async (req, res) => {
    try {
        const sector = req.query.sector || (req.baseUrl.includes('education') ? 'education' :
            req.baseUrl.includes('manufacturing') ? 'manufacturing' :
                req.baseUrl.includes('it') ? 'it' :
                    req.baseUrl.includes('hotel') ? 'hotel' : 'manufacturing');

        const { month, year } = req.query; // Extract month and year from query
        const table = sector === 'education' ? 'education_attendance_locks' : 'manufacturing_attendance_locks';
        let locks;
        if (sector === 'education') {
            [locks] = await db.query(`SELECT * FROM ${table} WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`, [req.user.data_owner_id, month, year]);
        } else {
            // For now default other sectors might attempt this, but let's be safe
            if (sector !== 'manufacturing') {
                // Other sectors might not have locks yet
                return res.json({ success: true, data: [] });
            }
            console.log('getLockStatus manufacturing query:', table, month, year);
            [locks] = await db.query(`SELECT * FROM ${table} WHERE user_id = ? AND month = ? AND year = ?`, [req.user.data_owner_id, month, year]);
        }
        res.json({ success: true, data: locks });
    } catch (e) {
        console.error('getLockStatus error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = {
    createAttendance, getAttendances, updateAttendance, deleteAttendance, getAttendanceStats, getMemberSummary, quickMarkAttendance, bulkMarkAttendance,
    getHolidays, createHoliday, deleteHoliday, getShifts, createShift, deleteShift, lockAttendance, unlockAttendance, getLockStatus
};
