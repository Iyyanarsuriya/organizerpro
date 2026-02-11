const express = require('express');
const router = express.Router();
const lookupController = require('../../controllers/Hotel/lookupController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', lookupController.getOptions);
router.post('/', lookupController.addOption);
router.delete('/:id', requireOwner, lookupController.deleteOption);

module.exports = router;
