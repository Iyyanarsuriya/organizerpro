const express = require('express');
const router = express.Router();
const leaveController = require('../../controllers/IT/leaveController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, leaveController.getLeaves);
router.post('/', authenticateToken, leaveController.createLeave);
router.patch('/:id/status', authenticateToken, leaveController.updateLeaveStatus);
router.delete('/:id', authenticateToken, leaveController.deleteLeave);

module.exports = router;
