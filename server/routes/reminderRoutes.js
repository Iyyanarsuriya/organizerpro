const express = require('express');
const router = express.Router();
const reminderController = require('../Controllers/reminderController');
const authenticateToken = require('../Middleware/authMiddleware');

router.use(authenticateToken); // Protect all reminder routes

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.post('/send-missed-alert', reminderController.triggerMissedTaskEmail);

module.exports = router;
