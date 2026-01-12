const VehicleLog = require('../models/vehicleLogModel');

exports.getVehicleLogs = async (req, res) => {
    try {
        const logs = await VehicleLog.getAll(req.user.data_owner_id);
        res.json(logs);
    } catch (error) {
        console.error("Error fetching vehicle logs:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createVehicleLog = async (req, res) => {
    try {
        const data = { ...req.body, user_id: req.user.data_owner_id };
        const newLog = await VehicleLog.create(data);
        res.status(201).json(newLog);
    } catch (error) {
        console.error("Error creating vehicle log:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateVehicleLog = async (req, res) => {
    try {
        const updatedLog = await VehicleLog.update(req.params.id, req.body);
        res.json(updatedLog);
    } catch (error) {
        console.error("Error updating vehicle log:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteVehicleLog = async (req, res) => {
    try {
        await VehicleLog.delete(req.params.id);
        res.json({ message: 'Log deleted' });
    } catch (error) {
        console.error("Error deleting vehicle log:", error);
        res.status(500).json({ message: error.message });
    }
};
