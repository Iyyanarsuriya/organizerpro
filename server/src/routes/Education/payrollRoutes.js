const express = require('express');
const router = express.Router();
const payrollController = require('../../controllers/Education/payrollController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/generate', requireOwner, payrollController.generatePayroll);
router.get('/', payrollController.getPayrolls);
router.put('/:id/approve', requireOwner, payrollController.approvePayroll);
router.post('/:id/pay', requireOwner, payrollController.payPayroll);

module.exports = router;
