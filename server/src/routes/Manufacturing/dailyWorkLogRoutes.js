const express = require('express');
const router = express.Router();
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');
const dailyWorkLogController = require('../../controllers/Manufacturing/dailyWorkLogController');



router.post('/', authenticateToken, dailyWorkLogController.createWorkLog);
router.get('/', authenticateToken, dailyWorkLogController.getWorkLogs);
router.get('/monthly-total', authenticateToken, dailyWorkLogController.getMonthlyTotal);
router.put('/:id', authenticateToken, dailyWorkLogController.updateWorkLog);
router.delete('/:id', authenticateToken, requireOwner, dailyWorkLogController.deleteWorkLog);

module.exports = router;
