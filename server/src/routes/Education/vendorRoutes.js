const express = require('express');
const router = express.Router();
const vendorController = require('../../controllers/Education/vendorController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', vendorController.getVendors);
router.post('/', requireOwner, vendorController.createVendor);
router.put('/:id', requireOwner, vendorController.updateVendor);
router.delete('/:id', requireOwner, vendorController.deleteVendor);

module.exports = router;
