const Attendance = require('../../models/attendanceModel');

const createAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.create({ ...req.body, user_id: req.user.data_owner_id, sector: 'hotel' });
        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const quickMarkAttendance = async (req, res) => {
    try {
        const result = await Attendance.quickMark({ ...req.body, user_id: req.user.data_owner_id, sector: 'hotel' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const bulkMarkAttendance = async (req, res) => {
    try {
        const result = await Attendance.bulkMark({ ...req.body, user_id: req.user.data_owner_id, sector: 'hotel' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAttendances = async (req, res) => {
    try {
        const attendances = await Attendance.getAllByUserId(req.user.data_owner_id, { ...req.query, sector: 'hotel' });
        res.status(200).json({ success: true, data: attendances });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAttendanceStats = async (req, res) => {
    try {
        const stats = await Attendance.getStats(req.user.data_owner_id, { ...req.query, sector: 'hotel' });
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMemberSummary = async (req, res) => {
    try {
        const summary = await Attendance.getMemberSummary(req.user.data_owner_id, { ...req.query, sector: 'hotel' });
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const updated = await Attendance.update(req.params.id, req.user.data_owner_id, { ...req.body, sector: 'hotel' });
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
        const deleted = await Attendance.delete(req.params.id, req.user.data_owner_id, 'hotel');
        if (deleted) {
            res.status(200).json({ success: true, message: "Attendance deleted" });
        } else {
            res.status(404).json({ success: false, message: "Attendance not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getHolidays = async (req, res) => {
    try {
        const holidays = await Attendance.getHolidays(req.user.data_owner_id, 'hotel');
        res.status(200).json({ success: true, data: holidays });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createHoliday = async (req, res) => {
    try {
        const holiday = await Attendance.createHoliday({ ...req.body, user_id: req.user.data_owner_id, sector: 'hotel' });
        res.status(201).json({ success: true, data: holiday });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteHoliday = async (req, res) => {
    try {
        const deleted = await Attendance.deleteHoliday(req.params.id, req.user.data_owner_id, 'hotel');
        if (deleted) {
            res.status(200).json({ success: true, message: "Holiday deleted" });
        } else {
            res.status(404).json({ success: false, message: "Holiday not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getShifts = async (req, res) => {
    try {
        const shifts = await Attendance.getShifts(req.user.data_owner_id, 'hotel');
        res.status(200).json({ success: true, data: shifts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createShift = async (req, res) => {
    try {
        const shift = await Attendance.createShift({ ...req.body, user_id: req.user.data_owner_id, sector: 'hotel' });
        res.status(201).json({ success: true, data: shift });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteShift = async (req, res) => {
    try {
        const deleted = await Attendance.deleteShift(req.params.id, req.user.data_owner_id, 'hotel');
        if (deleted) {
            res.status(200).json({ success: true, message: "Shift deleted" });
        } else {
            res.status(404).json({ success: false, message: "Shift not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createAttendance,
    quickMarkAttendance,
    bulkMarkAttendance,
    getAttendances,
    getAttendanceStats,
    getMemberSummary,
    updateAttendance,
    deleteAttendance,
    getHolidays,
    createHoliday,
    deleteHoliday,
    getShifts,
    createShift,
    deleteShift
};
