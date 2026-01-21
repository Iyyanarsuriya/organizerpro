const express = require('express');
const router = express.Router();
const controller = require('../../controllers/Common/expenseCategoryController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', controller.getExpenseCategories);
router.post('/', controller.createExpenseCategory);
router.delete('/:id', requireOwner, controller.deleteExpenseCategory);

module.exports = router;
