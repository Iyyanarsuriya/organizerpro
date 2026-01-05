const Attendance = require('../models/attendanceModel');

const createAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.create({ ...req.body, user_id: req.user.id });
        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAttendances = async (req, res) => {
    try {
        const filters = {
            projectId: req.query.projectId,
            workerId: req.query.workerId,
            date: req.query.date,
            month: req.query.month
        };
        const attendances = await Attendance.getAllByUserId(req.user.id, filters);
        res.status(200).json({ success: true, data: attendances });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const updated = await Attendance.update(req.params.id, req.user.id, req.body);
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
        const deleted = await Attendance.delete(req.params.id, req.user.id);
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
        const stats = await Attendance.getStats(req.user.id, {
            month: req.query.month,
            projectId: req.query.projectId,
            workerId: req.query.workerId
        });
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createAttendance,
    getAttendances,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats
};
