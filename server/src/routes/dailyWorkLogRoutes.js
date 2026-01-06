const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const dailyWorkLogController = require('../controllers/dailyWorkLogController');



router.post('/', authenticateToken, dailyWorkLogController.createWorkLog);
router.get('/', authenticateToken, dailyWorkLogController.getWorkLogs);
router.get('/monthly-total', authenticateToken, dailyWorkLogController.getMonthlyTotal);
router.put('/:id', authenticateToken, dailyWorkLogController.updateWorkLog);
router.delete('/:id', authenticateToken, dailyWorkLogController.deleteWorkLog);

module.exports = router;
