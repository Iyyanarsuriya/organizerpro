const express = require('express');
const router = express.Router();
const reminderController = require('../../controllers/Personal/reminderController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

// Middleware to FORCE sector injection for ALL requests on this route
// This ensures that even if the client forgets to send ?sector=education, it is always set.
router.use((req, res, next) => {
    req.query.sector = 'education';
    if (req.body) {
        req.body.sector = 'education';
    }
    next();
});

router.use(authenticateToken); // Protect all reminder routes

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', requireOwner, reminderController.deleteReminder);

module.exports = router;
