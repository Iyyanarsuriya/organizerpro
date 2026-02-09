const Project = require('../../models/projectModel');

exports.getProjects = async (req, res) => {
    try {
        const { sector } = req.query;
        const projects = await Project.getAllByUserId(req.user.data_owner_id, sector);
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching projects', error: error.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { name, description, sector, status } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Project name is required' });

        const newProject = await Project.create(req.user.data_owner_id, name, description, sector, status);
        res.status(201).json({ success: true, data: newProject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating project', error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { sector } = req.query;
        const success = await Project.delete(id, req.user.data_owner_id, sector);
        if (!success) return res.status(404).json({ success: false, message: 'Project not found' });
        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting project', error: error.message });
    }
};
