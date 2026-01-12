const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/public-key', pushController.getVapidPublicKey);
router.post('/subscribe', authenticateToken, pushController.subscribe);
router.post('/test', authenticateToken, pushController.sendTestNotification);

module.exports = router;
