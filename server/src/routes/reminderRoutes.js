const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/automated-missed-alert', reminderController.automatedMissedTaskJob);

router.use(authenticateToken); // Protect all following reminder routes

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.post('/send-missed-alert', reminderController.triggerMissedTaskEmail);

module.exports = router;
