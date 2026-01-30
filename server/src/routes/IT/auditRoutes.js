const express = require('express');
const router = express.Router();
const auditController = require('../../controllers/IT/auditController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, auditController.getAuditLogs);

module.exports = router;
