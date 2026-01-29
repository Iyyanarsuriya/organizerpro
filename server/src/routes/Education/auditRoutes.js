const express = require('express');
const router = express.Router();
const auditLogModel = require('../../models/auditLogModel');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', requireOwner, async (req, res) => {
    try {
        const logs = await auditLogModel.getAllByUserId(req.user.data_owner_id, req.query);
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
