const Approval = require('../../models/approvalModel');
const db = require('../../config/db');

const ApprovalController = {
    getAllApprovals: async (req, res) => {
        try {
            const approvals = await Approval.getAll(req.user.data_owner_id, 'manufacturing', req.query);
            res.status(200).json({ success: true, data: approvals });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    createApproval: async (req, res) => {
        try {
            const data = { ...req.body, requested_by: req.user.username };
            const approval = await Approval.create(req.user.data_owner_id, 'manufacturing', data);
            res.status(201).json({ success: true, data: approval });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateApprovalStatus: async (req, res) => {
        try {
            const data = { ...req.body, approved_by: req.user.username };
            const updated = await Approval.updateStatus(req.params.id, req.user.data_owner_id, 'manufacturing', data);
            res.status(updated ? 200 : 404).json({ success: updated, message: updated ? "Approval updated" : "Not found" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    deleteApproval: async (req, res) => {
        try {
            const deleted = await Approval.delete(req.params.id, req.user.data_owner_id, 'manufacturing');
            res.status(deleted ? 200 : 404).json({ success: deleted, message: deleted ? "Approval deleted" : "Not found" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = ApprovalController;
