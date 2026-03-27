const Leave = require('../../models/leaveModel');

const getLeaves = async (req, res) => {
    try {
        const leaves = await Leave.getAll(req.user.data_owner_id, { sector: 'it', ...req.query });
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createLeave = async (req, res) => {
    try {
        const { start_date, end_date } = req.body;
        
        // Basic date validation to prevent SQL errors (500)
        if (isNaN(new Date(start_date).getTime()) || isNaN(new Date(end_date).getTime())) {
            return res.status(400).json({ success: false, message: "Invalid date format" });
        }

        const result = await Leave.create({ 
            user_id: req.user.data_owner_id, 
            sector: 'it', 
            ...req.body 
        });

        // Write to IT audit log
        const AuditLog = require('../../models/auditLogModel');
        AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'LEAVE_REQUESTED',
            module: 'Leaves',
            details: `${req.body.leave_type} Leave requested for member ${req.body.member_id} from ${start_date} to ${end_date}`,
            performed_by: req.user.id,
            sector: 'it'
        }).catch(() => {});

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
