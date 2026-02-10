const MemberRole = require('../../models/memberRoleModel');

// --- SECTOR SPECIFIC CONTROLLERS ---

const ITMemberRoleController = {
    add: async (req, res) => {
        const result = await MemberRole.create(req.user.data_owner_id, req.body.name, 'it');
        res.status(201).json({ success: true, data: result });
    }
};

const DefaultMemberRoleController = {
    add: async (req, res) => {
        const sector = req.body.sector || 'manufacturing';
        const result = await MemberRole.create(req.user.data_owner_id, req.body.name, sector);
        res.status(201).json({ success: true, data: result });
    }
};

// --- DISPATCHER HELPERS ---
const getSectorController = (sector) => {
    return sector === 'it' ? ITMemberRoleController : DefaultMemberRoleController;
};

// --- CORE MEMBER ROLE FUNCTIONS ---

exports.getRoles = async (req, res) => {
    try {
        const roles = await MemberRole.getAllByUserId(req.user.data_owner_id, req.query.sector);
        res.json({ success: true, data: roles });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.addRole = async (req, res) => {
    try {
        if (!req.body.name) return res.status(400).json({ success: false, message: "Name required" });
        return getSectorController(req.body.sector).add(req, res);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteRole = async (req, res) => {
    try {
        const deleted = await MemberRole.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        res.json({ success: deleted, message: deleted ? "Deleted" : "Not found" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
