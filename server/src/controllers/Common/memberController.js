const Member = require('../../models/memberModel');

// --- SECTOR SPECIFIC CONTROLLERS ---

const HotelMemberController = {
    create: async (req, res) => {
        const member = await Member.create({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: member });
    }
};

const ManufacturingMemberController = {
    create: async (req, res) => {
        const member = await Member.create({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: member });
    }
};

const EducationMemberController = {
    create: async (req, res) => {
        const member = await Member.create({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: member });
    }
};

const ITMemberController = {
    create: async (req, res) => {
        const member = await Member.create({ ...req.body, user_id: req.user.data_owner_id });
        res.status(201).json({ success: true, data: member });
    }
};

// --- DISPATCHER HELPERS ---
const getSectorController = (sector) => {
    switch (sector) {
        case 'hotel': return HotelMemberController;
        case 'it': return ITMemberController;
        case 'education': return EducationMemberController;
        default: return ManufacturingMemberController;
    }
};

// --- CORE MEMBER FUNCTIONS (DISPATCHERS) ---

const createMember = async (req, res) => {
    try {
        return getSectorController(req.body.sector).create(req, res);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getMembers = async (req, res) => {
    try {
        const { memberType, sector } = req.query;
        const members = await Member.getAllByUserId(req.user.data_owner_id, memberType, sector);
        res.status(200).json({ success: true, data: members });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getActiveMembers = async (req, res) => {
    try {
        const { memberType, sector } = req.query;
        const members = await Member.getActiveMembers(req.user.data_owner_id, memberType, sector);
        res.status(200).json({ success: true, data: members });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateMember = async (req, res) => {
    try {
        const updated = await Member.update(req.params.id, req.user.data_owner_id, req.body);
        res.status(updated ? 200 : 404).json({ success: updated, message: updated ? "Updated" : "Not found" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteMember = async (req, res) => {
    try {
        const deleted = await Member.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        res.status(deleted ? 200 : 404).json({ success: deleted, message: deleted ? "Deleted" : "Not found" });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getGuests = async (req, res) => {
    try {
        const guests = await Member.getGuests(req.user.data_owner_id, req.query.sector);
        res.status(200).json({ success: true, data: guests });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = {
    createMember,
    getMembers,
    getActiveMembers,
    updateMember,
    deleteMember,
    getGuests
};
