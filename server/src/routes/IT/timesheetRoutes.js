const express = require('express');
const router = express.Router();
const timesheetController = require('../../controllers/IT/timesheetController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, timesheetController.getTimesheets);
router.post('/', authenticateToken, timesheetController.createTimesheet);
router.patch('/:id/status', authenticateToken, timesheetController.updateTimesheetStatus);
router.delete('/:id', authenticateToken, timesheetController.deleteTimesheet);

module.exports = router;
