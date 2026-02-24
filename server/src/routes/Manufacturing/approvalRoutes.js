const express = require('express');
const router = express.Router();
const ApprovalController = require('../../controllers/Manufacturing/approvalController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', ApprovalController.getAllApprovals);
router.post('/', ApprovalController.createApproval);
router.put('/:id', ApprovalController.updateApprovalStatus);
router.delete('/:id', ApprovalController.deleteApproval);

module.exports = router;
