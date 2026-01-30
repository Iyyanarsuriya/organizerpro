const Leave = require('../../models/leaveModel');

const getLeaves = async (req, res) => {
    try {
        const leaves = await Leave.getAll(req.user.id, { sector: 'it', ...req.query });
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createLeave = async (req, res) => {
    try {
        const result = await Leave.create({ user_id: req.user.id, sector: 'it', ...req.body });
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const result = await Leave.updateStatus(req.params.id, status, 'it');
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteLeave = async (req, res) => {
    try {
        await Leave.remove(req.params.id, 'it');
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getLeaves,
    createLeave,
    updateLeaveStatus,
    deleteLeave
};
