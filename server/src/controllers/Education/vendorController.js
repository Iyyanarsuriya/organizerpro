const Vendor = require('../../models/educationVendorModel');
const AuditLog = require('../../models/auditLogModel');

const createVendor = async (req, res) => {
    try {
        const vendor = await Vendor.create({
            ...req.body,
            user_id: req.user.data_owner_id
        });
        await AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'CREATED_VENDOR',
            module: 'vendor',
            details: `Created vendor: ${req.body.name}`,
            performed_by: req.user.id
        });
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.getAllByUserId(req.user.data_owner_id);
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateVendor = async (req, res) => {
    try {
        const updated = await Vendor.update(req.params.id, req.user.data_owner_id, req.body);
        if (updated) {
            await AuditLog.create({
                user_id: req.user.data_owner_id,
                action: 'UPDATED_VENDOR',
                module: 'vendor',
                details: `Updated vendor ID: ${req.params.id}`,
                performed_by: req.user.id
            });
            res.status(200).json({ success: true, message: "Vendor updated" });
        } else {
            res.status(404).json({ success: false, message: "Vendor not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteVendor = async (req, res) => {
    try {
        const deleted = await Vendor.delete(req.params.id, req.user.data_owner_id);
        if (deleted) {
            await AuditLog.create({
                user_id: req.user.data_owner_id,
                action: 'DELETED_VENDOR',
                module: 'vendor',
                details: `Deleted vendor ID: ${req.params.id}`,
                performed_by: req.user.id
            });
            res.status(200).json({ success: true, message: "Vendor deleted" });
        } else {
            res.status(404).json({ success: false, message: "Vendor not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createVendor,
    getVendors,
    updateVendor,
    deleteVendor
};
