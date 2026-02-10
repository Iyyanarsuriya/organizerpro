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
    deleteShift,
    lockAttendance,
    unlockAttendance,
    getLockStatus
} = require('../../controllers/Common/attendanceController');
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

// Attendance Locking
router.post('/lock', lockAttendance);
router.post('/unlock', unlockAttendance);
router.get('/lock-status', getLockStatus);

router.put('/:id', updateAttendance);
router.delete('/:id', requireOwner, deleteAttendance);

module.exports = router;
