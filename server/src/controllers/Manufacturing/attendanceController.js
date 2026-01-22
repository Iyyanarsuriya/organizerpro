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
        // For updates, we must check BOTH the existing record's date (cannot edit past record)
        // AND the new date (cannot move record to past)
        if (req.user.owner_id) {
            const existing = await Attendance.findById(req.params.id, req.query.sector || req.body.sector);
            if (!existing) {
                return res.status(404).json({ success: false, message: "Attendance not found" });
            }

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
        if (req.user.owner_id) {
            const existing = await Attendance.findById(req.params.id, req.query.sector);
            if (!existing) {
                return res.status(404).json({ success: false, message: "Attendance not found" });
            }
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
        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });

        const attendance = await Attendance.quickMark({
            ...req.body,
            user_id: req.user.data_owner_id,
            updated_by: req.user.username // Pass as updated_by (model uses it for create too as fallback)
        });
        res.status(attendance.updated ? 200 : 201).json({ success: true, data: attendance });
    } catch (error) {
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

module.exports = {
    createAttendance,
    getAttendances,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getMemberSummary,
    quickMarkAttendance,
    bulkMarkAttendance
};
