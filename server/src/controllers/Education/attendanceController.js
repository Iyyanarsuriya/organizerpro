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
            created_by: req.user.username
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
            department: req.query.department, // Support department filter
            sector: 'education' // Enforce education sector
        };

        // Reuse the generic getAllByUserId but filtered for education sector naturally via sector param
        const attendances = await Attendance.getAllByUserId(req.user.data_owner_id, filters);
        res.status(200).json({ success: true, data: attendances });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAttendance = async (req, res) => {
    try {
        if (req.user.owner_id) {
            const existing = await Attendance.findById(req.params.id, 'education');
            if (!existing) {
                return res.status(404).json({ success: false, message: "Attendance not found" });
            }
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
            const existing = await Attendance.findById(req.params.id, 'education');
            if (!existing) {
                return res.status(404).json({ success: false, message: "Attendance not found" });
            }
            const restriction = checkPastDateRestriction(req, existing.date);
            if (restriction) return res.status(403).json({ success: false, message: restriction });
        }

        const deleted = await Attendance.delete(req.params.id, req.user.data_owner_id, 'education');
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
            projectId: req.query.projectId, // Kept for generic compatibility but likely unused
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
        const restriction = checkPastDateRestriction(req, req.body.date);
        if (restriction) return res.status(403).json({ success: false, message: restriction });

        const attendance = await Attendance.quickMark({
            ...req.body,
            user_id: req.user.data_owner_id,
            sector: 'education',
            updated_by: req.user.username
        });
        res.status(attendance.updated ? 200 : 201).json({ success: true, data: attendance });
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
    quickMarkAttendance
};
