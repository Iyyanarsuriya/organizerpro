const WorkType = require('../../models/workTypeModel');

const createWorkType = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        const workType = await WorkType.create(req.user.id, name);
        res.status(201).json({ success: true, data: workType });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, message: 'Work type already exists' });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

const getWorkTypes = async (req, res) => {
    try {
        const workTypes = await WorkType.getAll(req.user.id);
        res.status(200).json({ success: true, data: workTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteWorkType = async (req, res) => {
    try {
        const deleted = await WorkType.delete(req.params.id, req.user.id);
        if (deleted) {
            res.status(200).json({ success: true, message: 'Work type deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Work type not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createWorkType,
    getWorkTypes,
    deleteWorkType
};
