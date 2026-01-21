const MemberRole = require('../../models/memberRoleModel');

exports.getRoles = async (req, res) => {
    try {
        const roles = await MemberRole.getAllByUserId(req.user.id);
        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addRole = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Role name is required' });

        const role = await MemberRole.create(req.user.id, name);
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
        const deleted = await MemberRole.delete(req.params.id, req.user.id);
        if (deleted) {
            res.json({ success: true, message: 'Role deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Role not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
