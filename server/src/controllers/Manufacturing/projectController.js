const Project = require('../../models/projectModel');

exports.getProjects = async (req, res) => {
    try {
        const { sector } = req.query;
        const projects = await Project.getAllByUserId(req.user.data_owner_id, sector);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { name, description, sector } = req.body;
        if (!name) return res.status(400).json({ message: 'Project name is required' });

        const newProject = await Project.create(req.user.data_owner_id, name, description, sector);
        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { sector } = req.query;
        const success = await Project.delete(id, req.user.data_owner_id, sector);
        if (!success) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error });
    }
};
