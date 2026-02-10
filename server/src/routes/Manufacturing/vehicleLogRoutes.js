const express = require('express');
const router = express.Router();
const vehicleLogController = require('../../controllers/Manufacturing/vehicleLogController');
const { authenticateToken: protect, requireOwner } = require('../../middlewares/authMiddleware');

router.get('/', protect, vehicleLogController.getVehicleLogs);
router.post('/', protect, vehicleLogController.createVehicleLog);
router.put('/:id', protect, vehicleLogController.updateVehicleLog);
router.delete('/:id', protect, requireOwner, vehicleLogController.deleteVehicleLog);

module.exports = router;
