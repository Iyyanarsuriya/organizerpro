const express = require('express');
const router = express.Router();
const vendorController = require('../../controllers/Hotel/vendorController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', vendorController.getVendors);
router.post('/', vendorController.createVendor);
router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
