const Timesheet = require('../../models/timesheetModel');

const getTimesheets = async (req, res) => {
    try {
        const timesheets = await Timesheet.getAll(req.user.id, { sector: 'it', ...req.query });
        res.status(200).json({ success: true, data: timesheets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createTimesheet = async (req, res) => {
    try {
        const result = await Timesheet.create({ user_id: req.user.id, sector: 'it', ...req.body });
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTimesheetStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const result = await Timesheet.updateStatus(req.params.id, status, 'it');
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTimesheet = async (req, res) => {
    try {
        await Timesheet.remove(req.params.id, 'it');
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getTimesheets,
    createTimesheet,
    updateTimesheetStatus,
    deleteTimesheet
};
