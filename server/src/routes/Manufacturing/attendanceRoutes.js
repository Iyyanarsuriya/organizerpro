const express = require('express');
const router = express.Router();
const {
    createAttendance,
    getAttendances,
    updateAttendance,
    deleteAttendance,
    getAttendanceStats,
    getMemberSummary,
    quickMarkAttendance,
    bulkMarkAttendance,
    getHolidays,
    createHoliday,
    deleteHoliday,
    getShifts,
    createShift,
    deleteShift
} = require('../../controllers/Manufacturing/attendanceController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', createAttendance);
router.post('/quick', quickMarkAttendance);
router.post('/bulk', bulkMarkAttendance);
router.get('/', getAttendances);
router.get('/stats', getAttendanceStats);
router.get('/summary', getMemberSummary);

// Calendar & Shifts
router.get('/holidays', getHolidays);
router.post('/holidays', createHoliday);
router.delete('/holidays/:id', deleteHoliday);
router.get('/shifts', getShifts);
router.post('/shifts', createShift);
router.delete('/shifts/:id', deleteShift);

router.put('/:id', updateAttendance);
router.delete('/:id', requireOwner, deleteAttendance);

module.exports = router;
