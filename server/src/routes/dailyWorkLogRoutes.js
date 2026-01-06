const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
    createWorkLog,
    getWorkLogs,
    getMonthlyTotal,
    updateWorkLog,
    deleteWorkLog
} = require('../controllers/dailyWorkLogController');

router.post('/', authenticateToken, createWorkLog);
router.get('/', authenticateToken, getWorkLogs);
router.get('/monthly-total', authenticateToken, getMonthlyTotal);
router.put('/:id', authenticateToken, updateWorkLog);
router.delete('/:id', authenticateToken, deleteWorkLog);

module.exports = router;
