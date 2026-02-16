const express = require('express');
const router = express.Router();
const reminderController = require('../../controllers/Manufacturing/reminderController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', requireOwner, reminderController.deleteReminder);

module.exports = router;
