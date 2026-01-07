const Member = require('../models/memberModel');

const createMember = async (req, res) => {
    try {
        const member = await Member.create({ ...req.body, user_id: req.user.id });
        res.status(201).json({ success: true, data: member });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMembers = async (req, res) => {
    try {
        const { memberType } = req.query;
        const members = await Member.getAllByUserId(req.user.id, memberType);
        res.status(200).json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getActiveMembers = async (req, res) => {
    try {
        const { memberType } = req.query;
        const members = await Member.getActiveMembers(req.user.id, memberType);
        res.status(200).json({ success: true, data: members });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateMember = async (req, res) => {
    try {
        const updated = await Member.update(req.params.id, req.user.id, req.body);
        if (updated) {
            res.status(200).json({ success: true, message: "Member updated" });
        } else {
            res.status(404).json({ success: false, message: "Member not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMember = async (req, res) => {
    try {
        const deleted = await Member.delete(req.params.id, req.user.id);
        if (deleted) {
            res.status(200).json({ success: true, message: "Member deleted" });
        } else {
            res.status(404).json({ success: false, message: "Member not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createMember,
    getMembers,
    getActiveMembers,
    updateMember,
    deleteMember
};
