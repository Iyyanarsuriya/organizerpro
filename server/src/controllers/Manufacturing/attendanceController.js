const Attendance = require('../../models/attendanceModel');

const createAttendance = async (req, res) => {
    try {
        if (req.user.owner_id) {
            const today = new Date().toISOString().split('T')[0];
            if (req.body.date < today) {
                return res.status(403).json({ success: false, message: "Child users cannot add attendance for previous days." });
            }
        }
        const attendance = await Attendance.create({ ...req.body, user_id: req.user.data_owner_id });
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
        if (req.user.owner_id) {
            const today = new Date().toISOString().split('T')[0];
            const existing = await Attendance.findById(req.params.id);
            if (!existing) {
                return res.status(404).json({ success: false, message: "Attendance not found" });
            }
            const recordDate = new Date(existing.date).toISOString().split('T')[0];
            if (recordDate < today) {
                return res.status(403).json({ success: false, message: "Child users cannot edit attendance from previous days." });
            }
            if (req.body.date && req.body.date < today) {
                return res.status(403).json({ success: false, message: "Child users cannot move attendance to previous days." });
            }
        }
        const updated = await Attendance.update(req.params.id, req.user.data_owner_id, req.body);
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
            const today = new Date().toISOString().split('T')[0];
            const existing = await Attendance.findById(req.params.id, req.query.sector);
            if (!existing) {
                return res.status(404).json({ success: false, message: "Attendance not found" });
            }
            const recordDate = new Date(existing.date).toISOString().split('T')[0];
            if (recordDate < today) {
                return res.status(403).json({ success: false, message: "Child users cannot delete attendance from previous days." });
            }
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
        if (req.user.owner_id) {
            const today = new Date().toISOString().split('T')[0];
            // Quickmark uses the date provided in the body to find/create the record
            if (req.body.date < today) {
                return res.status(403).json({ success: false, message: "Child users cannot mark/edit attendance for previous days." });
            }
        }
        const attendance = await Attendance.quickMark({
            ...req.body,
            user_id: req.user.data_owner_id
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
