const VehicleLog = require('../../models/vehicleLogModel');
const Transaction = require('../../models/transactionModel');

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


        // Auto-create expense if amount > 0
        if (newLog.expense_amount > 0) {
            try {
                // Determine date (use out_time or current date)
                const expenseDate = newLog.out_time ? new Date(newLog.out_time) : new Date();

                await Transaction.create({
                    user_id: req.user.data_owner_id,
                    title: `Vehicle Exp: ${newLog.vehicle_number}`,
                    amount: newLog.expense_amount,
                    type: 'expense',
                    category: 'Vehicle', // Ensure 'Vehicle' category exists or fallback to 'Other'
                    date: expenseDate,
                    sector: 'manufacturing',
                    description: `Auto-generated from Vehicle Log ID: ${newLog.id}. ${newLog.notes || ''}`
                });
            } catch (err) {
                console.error("Failed to auto-create vehicle expense:", err);
                // Don't fail the request, just log error
            }
        }

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
