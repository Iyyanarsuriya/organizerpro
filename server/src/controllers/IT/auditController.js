const AuditLog = require('../../models/auditLogModel');

const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.getAllByUserId(req.user.id, { sector: 'it', ...req.query });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAuditLogs
};
