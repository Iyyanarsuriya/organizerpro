const Attendance = require('../../models/attendanceModel');
const AttendanceLock = require('../../models/educationAttendanceLockModel');
const AuditLog = require('../../models/auditLogModel');

const checkPastDateRestriction = (req, targetDate) => {
    if (!req.user.owner_id) return null;
    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date(targetDate).toISOString().split('T')[0];
    if (checkDate < today) {
        return "Child users cannot modify attendance for previous days.";
    }
    return null;
};

const checkAttendanceLock = async (userId, date) => {
    const isLocked = await AttendanceLock.isLocked(userId, date);
    if (isLocked) {
        return "Attendance for this date is locked and cannot be modified.";
    }
    return null;
};

const createAttendance = async (req, res) => {
    try {
        const lockRestriction = await checkAttendanceLock(req.user.data_owner_id, req.body.date);
        if (lockRestriction) return res.status(403).json({ success: false, message: lockRestriction });

        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });

        const attendance = await Attendance.create({
            ...req.body,
            user_id: req.user.data_owner_id,
            created_by: req.user.username
        });

        await AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'CREATED_ATTENDANCE',
            module: 'attendance',
            details: `Created attendance for ${req.body.member_id} on ${req.body.date}`,
            performed_by: req.user.id
        });

        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAttendances = async (req, res) => {
    try {
        const filters = {
            memberId: req.query.memberId,
            period: req.query.period,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            role: req.query.role,
            department: req.query.department,
            sector: 'education'
        };
        const attendances = await Attendance.getAllByUserId(req.user.data_owner_id, filters);
        res.status(200).json({ success: true, data: attendances });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const existing = await Attendance.findById(req.params.id, 'education');
        if (!existing) return res.status(404).json({ success: false, message: "Attendance not found" });

        const lockRestriction = await checkAttendanceLock(req.user.data_owner_id, existing.date);
        if (lockRestriction && req.user.role !== 'owner' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: lockRestriction });
        }

        if (req.user.owner_id) {
            const existingRestriction = checkPastDateRestriction(req, existing.date);
            if (existingRestriction) return res.status(403).json({ success: false, message: existingRestriction });

            if (req.body.date) {
                const newDateRestriction = checkPastDateRestriction(req, req.body.date);
                if (newDateRestriction) return res.status(403).json({ success: false, message: newDateRestriction });
            }
        }

        const updated = await Attendance.update(req.params.id, req.user.data_owner_id, {
            ...req.body,
            sector: 'education',
            updated_by: req.user.username
        });

        if (updated) {
            await AuditLog.create({
                user_id: req.user.data_owner_id,
                action: 'UPDATED_ATTENDANCE',
                module: 'attendance',
                details: `Updated attendance ID ${req.params.id} for ${existing.member_name} on ${existing.date}`,
                performed_by: req.user.id
            });
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
        const existing = await Attendance.findById(req.params.id, 'education');
        if (!existing) return res.status(404).json({ success: false, message: "Attendance not found" });

        const lockRestriction = await checkAttendanceLock(req.user.data_owner_id, existing.date);
        if (lockRestriction && req.user.role !== 'owner' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: lockRestriction });
        }

        if (req.user.owner_id) {
            const restriction = checkPastDateRestriction(req, existing.date);
            if (restriction) return res.status(403).json({ success: false, message: restriction });
        }

        const deleted = await Attendance.delete(req.params.id, req.user.data_owner_id, 'education');
        if (deleted) {
            await AuditLog.create({
                user_id: req.user.data_owner_id,
                action: 'DELETED_ATTENDANCE',
                module: 'attendance',
                details: `Deleted attendance for ${existing.member_name} on ${existing.date}`,
                performed_by: req.user.id
            });
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
            memberId: req.query.memberId,
            role: req.query.role,
            department: req.query.department,
            sector: 'education'
        });
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMemberSummary = async (req, res) => {
    try {
        const summary = await Attendance.getMemberSummary(req.user.data_owner_id, {
            period: req.query.period,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            projectId: req.query.projectId,
            department: req.query.department,
            sector: 'education'
        });
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const quickMarkAttendance = async (req, res) => {
    try {
        const lockRestriction = await checkAttendanceLock(req.user.data_owner_id, req.body.date);
        if (lockRestriction) return res.status(403).json({ success: false, message: lockRestriction });

        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });

        const attendance = await Attendance.quickMark({
            ...req.body,
            user_id: req.user.data_owner_id,
            sector: 'education',
            updated_by: req.user.username
        });

        await AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'QUICK_MARK_ATTENDANCE',
            module: 'attendance',
            details: `Quick marked ${req.body.status} for ${req.body.member_id} on ${req.body.date}`,
            performed_by: req.user.id
        });

        res.status(attendance.updated ? 200 : 201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const lockAttendance = async (req, res) => {
    try {
        await AttendanceLock.lockDate(req.user.data_owner_id, req.body.date, req.user.id);
        await AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'LOCKED_ATTENDANCE',
            module: 'attendance',
            details: `Locked attendance for ${req.body.date}`,
            performed_by: req.user.id
        });
        res.status(200).json({ success: true, message: "Attendance locked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const unlockAttendance = async (req, res) => {
    try {
        await AttendanceLock.unlockDate(req.user.data_owner_id, req.body.date, req.user.id);
        await AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'UNLOCKED_ATTENDANCE',
            module: 'attendance',
            details: `Unlocked attendance for ${req.body.date}`,
            performed_by: req.user.id
        });
        res.status(200).json({ success: true, message: "Attendance unlocked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLockedDates = async (req, res) => {
    try {
        const dates = await AttendanceLock.getLockedDates(req.user.data_owner_id, req.query.month, req.query.year);
        res.status(200).json({ success: true, data: dates });
    } catch (error) {
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
    lockAttendance,
    unlockAttendance,
    getLockedDates
};

