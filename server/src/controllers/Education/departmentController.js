const Department = require('../../models/departmentModel');

exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.getAllByUserId(req.user.data_owner_id, req.query.sector);
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const department = await Department.create({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: department });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Department already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        await Department.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        res.json({ success: true, message: 'Department deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
