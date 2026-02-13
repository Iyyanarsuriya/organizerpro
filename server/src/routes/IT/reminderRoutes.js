const express = require('express');
const router = express.Router();
const reminderController = require('../../controllers/Personal/reminderController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

// Middleware to FORCE sector injection for ALL requests on this route
router.use((req, res, next) => {
    req.query.sector = 'it';
    if (req.body) {
        req.body.sector = 'it';
    }
    next();
});

router.use(authenticateToken);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', requireOwner, reminderController.deleteReminder);

module.exports = router;
