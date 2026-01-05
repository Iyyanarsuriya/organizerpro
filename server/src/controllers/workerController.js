const Worker = require('../models/workerModel');

const createWorker = async (req, res) => {
    try {
        const worker = await Worker.create({ ...req.body, user_id: req.user.id });
        res.status(201).json({ success: true, data: worker });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getWorkers = async (req, res) => {
    try {
        const workers = await Worker.getAllByUserId(req.user.id);
        res.status(200).json({ success: true, data: workers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getActiveWorkers = async (req, res) => {
    try {
        const workers = await Worker.getActiveWorkers(req.user.id);
        res.status(200).json({ success: true, data: workers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateWorker = async (req, res) => {
    try {
        const updated = await Worker.update(req.params.id, req.user.id, req.body);
        if (updated) {
            res.status(200).json({ success: true, message: "Worker updated" });
        } else {
            res.status(404).json({ success: false, message: "Worker not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteWorker = async (req, res) => {
    try {
        const deleted = await Worker.delete(req.params.id, req.user.id);
        if (deleted) {
            res.status(200).json({ success: true, message: "Worker deleted" });
        } else {
            res.status(404).json({ success: false, message: "Worker not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createWorker,
    getWorkers,
    getActiveWorkers,
    updateWorker,
    deleteWorker
};
