const Project = require('../../models/projectModel');

// --- SECTOR SPECIFIC CONTROLLERS ---

const HotelProjectController = {
    create: async (req, res) => {
        const { name, description, status } = req.body;
        const result = await Project.create(req.user.data_owner_id, name, description, 'hotel', status);
        res.status(201).json({ success: true, data: result });
    }
};

const DefaultProjectController = {
    create: async (req, res) => {
        const { name, description, sector } = req.body;
        const result = await Project.create(req.user.data_owner_id, name, description, sector);
        res.status(201).json({ success: true, data: result });
    }
};

// --- DISPATCHER HELPERS ---
const getSectorController = (sector) => {
    return sector === 'hotel' ? HotelProjectController : DefaultProjectController;
};

// --- CORE PROJECT FUNCTIONS ---

exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.getAllByUserId(req.user.data_owner_id, req.query.sector);
        res.json({ success: true, data: projects });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createProject = async (req, res) => {
    try {
        if (!req.body.name) return res.status(400).json({ success: false, message: "Name required" });
        return getSectorController(req.body.sector).create(req, res);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteProject = async (req, res) => {
    try {
        const success = await Project.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        res.json({ success, message: success ? "Deleted" : "Not found" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
