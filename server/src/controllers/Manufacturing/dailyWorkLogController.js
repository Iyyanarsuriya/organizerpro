const DailyWorkLog = require('../../models/dailyWorkLogModel');

const createWorkLog = async (req, res) => {
    try {
        if (!req.body.member_id && !req.body.guest_name) {
            return res.status(400).json({ success: false, message: 'Member or Guest Name is required' });
        }
        const workLog = await DailyWorkLog.create({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: workLog });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, message: 'Work log already exists for this member on this date' });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

const getWorkLogs = async (req, res) => {
    try {
        const { startDate, endDate, memberId } = req.query;
        const workLogs = await DailyWorkLog.getByUserIdAndDateRange(
            req.user.data_owner_id,
            startDate,
            endDate,
            memberId
        );
        res.status(200).json({ success: true, data: workLogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMonthlyTotal = async (req, res) => {
    try {
        const { year, month, memberId } = req.query;
        const totals = await DailyWorkLog.getMonthlyTotal(
            req.user.data_owner_id,
            year,
            month,
            memberId
        );
        res.status(200).json({ success: true, data: totals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateWorkLog = async (req, res) => {
    try {
        const updated = await DailyWorkLog.update(req.params.id, req.user.data_owner_id, req.body);
        if (updated) {
            res.status(200).json({ success: true, message: 'Work log updated' });
        } else {
            res.status(404).json({ success: false, message: 'Work log not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteWorkLog = async (req, res) => {
    try {
        const deleted = await DailyWorkLog.delete(req.params.id, req.user.data_owner_id);
        if (deleted) {
            res.status(200).json({ success: true, message: 'Work log deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Work log not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createWorkLog,
    getWorkLogs,
    getMonthlyTotal,
    updateWorkLog,
    deleteWorkLog
};
