const Attendance = require('../../models/attendanceModel');

const checkPastDateRestriction = (req, targetDate) => {
    // If user is a Data Owner (Admin/Owner), they have no restrictions
    // req.user.owner_id is NULL for Owners/Admins
    // req.user.owner_id is SET for Sub-users (Staff, Managers)
    if (!req.user.owner_id) return null;

    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date(targetDate).toISOString().split('T')[0];

    if (checkDate < today) {
        return "Child users cannot modify attendance for previous days.";
    }
    return null;
};

const createAttendance = async (req, res) => {
    try {
        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });

        const attendance = await Attendance.create({
            ...req.body,
            user_id: req.user.data_owner_id,
            created_by: req.user.username // Add creator
        });
        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAttendances = async (req, res) => {
    try {
        const filters = {
            projectId: req.query.projectId,
            memberId: req.query.memberId,
            period: req.query.period,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            role: req.query.role,
            sector: req.query.sector
        };
        const attendances = await Attendance.getAllByUserId(req.user.data_owner_id, filters);
        res.status(200).json({ success: true, data: attendances });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAttendance = async (req, res) => {
    try {
        // Get existing record first
        const existing = await Attendance.findById(req.params.id, req.query.sector || req.body.sector);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Attendance not found" });
        }

        // Check if attendance is locked
        const isLocked = await checkLock(req.user.data_owner_id, existing.date);
        if (isLocked && req.user.owner_id) {
            return res.status(403).json({
                success: false,
                message: 'Attendance is locked for this period. Only owner can unlock.'
            });
        }

        // For updates, we must check BOTH the existing record's date (cannot edit past record)
        // AND the new date (cannot move record to past)
        if (req.user.owner_id) {
            // Check 1: Cannot edit a record that belongs to the past
            const existingRestriction = checkPastDateRestriction(req, existing.date);
            if (existingRestriction) return res.status(403).json({ success: false, message: existingRestriction });

            // Check 2: Cannot change the date to a past date
            if (req.body.date) {
                const newDateRestriction = checkPastDateRestriction(req, req.body.date);
                if (newDateRestriction) return res.status(403).json({ success: false, message: newDateRestriction });
            }
        }

        const updated = await Attendance.update(req.params.id, req.user.data_owner_id, {
            ...req.body,
            updated_by: req.user.username // Add updater
        });
        if (updated) {
            res.status(200).json({ success: true, message: "Attendance updated" });
        } else {
            res.status(404).json({ success: false, message: "Attendance not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        // Get existing record first
        const existing = await Attendance.findById(req.params.id, req.query.sector);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Attendance not found" });
        }

        // Check if attendance is locked
        const isLocked = await checkLock(req.user.data_owner_id, existing.date);
        if (isLocked && req.user.owner_id) {
            return res.status(403).json({
                success: false,
                message: 'Attendance is locked for this period. Only owner can unlock.'
            });
        }

        if (req.user.owner_id) {
            const restriction = checkPastDateRestriction(req, existing.date);
            if (restriction) return res.status(403).json({ success: false, message: restriction });
        }

        const deleted = await Attendance.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        if (deleted) {
            res.status(200).json({ success: true, message: "Attendance deleted" });
        } else {
            res.status(404).json({ success: false, message: "Attendance not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAttendanceStats = async (req, res) => {
    try {
        const stats = await Attendance.getStats(req.user.data_owner_id, {
            period: req.query.period,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            projectId: req.query.projectId,
            memberId: req.query.memberId,
            role: req.query.role,
            sector: req.query.sector
        });
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMemberSummary = async (req, res) => {
    try {
        const filters = {
            period: req.query.period,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            projectId: req.query.projectId
        };
        const summary = await Attendance.getMemberSummary(req.user.data_owner_id, {
            period: req.query.period,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            projectId: req.query.projectId,
            sector: req.query.sector
        });
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const quickMarkAttendance = async (req, res) => {
    try {
        const db = require('../../config/db');
        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });

        // Check leave balance if status is CL, SL, or EL
        if (['CL', 'SL', 'EL'].includes(req.body.status)) {
            const [member] = await db.query(
                'SELECT cl_balance, sl_balance, el_balance FROM manufacturing_members WHERE id = ?',
                [req.body.member_id]
            );

            if (member.length === 0) {
                return res.status(404).json({ success: false, message: 'Member not found' });
            }

            const balanceField = `${req.body.status.toLowerCase()}_balance`;
            const currentBalance = member[0][balanceField];

            if (currentBalance <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient ${req.body.status} balance. Current balance: ${currentBalance} days`
                });
            }

            // Deduct balance (will be restored if attendance is deleted)
            await db.query(
                `UPDATE manufacturing_members SET ${balanceField} = ${balanceField} - 1 WHERE id = ?`,
                [req.body.member_id]
            );
        }

        const attendance = await Attendance.quickMark({
            ...req.body,
            user_id: req.user.data_owner_id,
            updated_by: req.user.username // Pass as updated_by (model uses it for create too as fallback)
        });
        res.status(attendance.updated ? 200 : 201).json({ success: true, data: attendance });
    } catch (error) {
        console.error('Quick mark attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const bulkMarkAttendance = async (req, res) => {
    try {
        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });

        const result = await Attendance.bulkMark({
            ...req.body,
            user_id: req.user.data_owner_id,
            updated_by: req.user.username
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getHolidays = async (req, res) => {
    try {
        const holidays = await Attendance.getHolidays(req.user.data_owner_id, req.query.sector);
        res.status(200).json({ success: true, data: holidays });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createHoliday = async (req, res) => {
    try {
        const result = await Attendance.createHoliday({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: result });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteHoliday = async (req, res) => {
    try {
        await Attendance.deleteHoliday(req.params.id, req.user.data_owner_id, req.query.sector);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getShifts = async (req, res) => {
    try {
        const shifts = await Attendance.getShifts(req.user.data_owner_id, req.query.sector);
        res.status(200).json({ success: true, data: shifts });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createShift = async (req, res) => {
    try {
        const result = await Attendance.createShift({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: result });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteShift = async (req, res) => {
    try {
        await Attendance.deleteShift(req.params.id, req.user.data_owner_id, req.query.sector);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// Attendance Locking Functions
const checkLock = async (userId, date) => {
    const db = require('../../config/db');
    const month = new Date(date).getMonth() + 1;
    const year = new Date(date).getFullYear();

    const [locks] = await db.query(
        'SELECT * FROM manufacturing_attendance_locks WHERE user_id = ? AND month = ? AND year = ? AND unlocked_at IS NULL',
        [userId, month, year]
    );

    return locks.length > 0;
};

const lockAttendance = async (req, res) => {
    try {
        const db = require('../../config/db');
        const { month, year } = req.body;

        // Check if already locked
        const [existing] = await db.query(
            'SELECT * FROM manufacturing_attendance_locks WHERE user_id = ? AND month = ? AND year = ?',
            [req.user.data_owner_id, month, year]
        );

        if (existing.length > 0 && !existing[0].unlocked_at) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already locked for this period'
            });
        }

        // Create lock
        await db.query(
            'INSERT INTO manufacturing_attendance_locks (user_id, month, year, locked_by) VALUES (?, ?, ?, ?)',
            [req.user.data_owner_id, month, year, req.user.id]
        );

        res.status(200).json({
            success: true,
            message: `Attendance locked for ${month}/${year}`
        });
    } catch (error) {
        console.error('Lock attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const unlockAttendance = async (req, res) => {
    try {
        const db = require('../../config/db');

        // Only owner can unlock
        if (req.user.owner_id) {
            return res.status(403).json({
                success: false,
                message: 'Only owner can unlock attendance'
            });
        }

        const { month, year, reason } = req.body;

        await db.query(
            'UPDATE manufacturing_attendance_locks SET unlocked_by = ?, unlocked_at = NOW(), unlock_reason = ? WHERE user_id = ? AND month = ? AND year = ?',
            [req.user.id, reason, req.user.data_owner_id, month, year]
        );

        res.status(200).json({
            success: true,
            message: `Attendance unlocked for ${month}/${year}`
        });
    } catch (error) {
        console.error('Unlock attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLockStatus = async (req, res) => {
    try {
        const db = require('../../config/db');
        const { month, year } = req.query;

        const [locks] = await db.query(
            'SELECT * FROM manufacturing_attendance_locks WHERE user_id = ? AND month = ? AND year = ?',
            [req.user.data_owner_id, month, year]
        );

        res.status(200).json({
            success: true,
            data: locks.length > 0 ? locks[0] : null,
            isLocked: locks.length > 0 && !locks[0].unlocked_at
        });
    } catch (error) {
        console.error('Get lock status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createAttendance,
    getAttendances,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getMemberSummary,
    quickMarkAttendance,
    bulkMarkAttendance,
    getHolidays,
    createHoliday,
    deleteHoliday,
    getShifts,
    createShift,
    deleteShift,
    lockAttendance,
    unlockAttendance,
    getLockStatus,
    checkLock
};
