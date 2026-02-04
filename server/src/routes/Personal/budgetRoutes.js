const express = require('express');
const router = express.Router();
const budgetController = require('../../controllers/Personal/budgetController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', budgetController.getBudgets);
router.post('/', budgetController.setBudget);
router.delete('/:id', budgetController.deleteBudget);
router.get('/status', budgetController.getBudgetStatus);

module.exports = router;
