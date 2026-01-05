const express = require('express');
const router = express.Router();
const {
    createAttendance,
    getAttendances,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getWorkerSummary
} = require('../controllers/attendanceController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', createAttendance);
router.get('/', getAttendances);
router.get('/stats', getAttendanceStats);
router.get('/summary', getWorkerSummary);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;
