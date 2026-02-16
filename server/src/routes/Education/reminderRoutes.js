const express = require('express');
const router = express.Router();
const reminderController = require('../../controllers/Education/reminderController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', requireOwner, reminderController.deleteReminder);
router.post('/send-missed-alert', reminderController.sendMissedAlert);

module.exports = router;
