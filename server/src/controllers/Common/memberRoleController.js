const MemberRole = require('../../models/memberRoleModel');

exports.getRoles = async (req, res) => {
    try {
        const { sector } = req.query;
        const roles = await MemberRole.getAllByUserId(req.user.data_owner_id, sector);
        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addRole = async (req, res) => {
    try {
        const { name, sector } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Role name is required' });

        const role = await MemberRole.create(req.user.data_owner_id, name, sector);
        res.status(201).json({ success: true, data: role });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Role already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { sector } = req.query;
        const deleted = await MemberRole.delete(req.params.id, req.user.data_owner_id, sector);
        if (deleted) {
            res.json({ success: true, message: 'Role deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Role not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
