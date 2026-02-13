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
    lockAttendance,
    unlockAttendance,
    getLockStatus: getLockedDates
} = require('../../controllers/Common/attendanceController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

// Middleware to inject sector
router.use((req, res, next) => {
    req.query = req.query || {};
    req.body = req.body || {};
    req.query.sector = 'education';
    req.body.sector = 'education';

    next();
});

router.post('/', createAttendance);
router.post('/quick', quickMarkAttendance);
router.post('/lock', requireOwner, lockAttendance);
router.post('/unlock', requireOwner, unlockAttendance);
router.get('/locked-dates', getLockedDates);
router.get('/', getAttendances);
router.get('/stats', getAttendanceStats);
router.get('/summary', getMemberSummary);
router.put('/:id', updateAttendance);
router.delete('/:id', requireOwner, deleteAttendance);


module.exports = router;
