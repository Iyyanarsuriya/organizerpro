const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseCategoryController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', controller.getExpenseCategories);
router.post('/', controller.createExpenseCategory);
router.delete('/:id', controller.deleteExpenseCategory);

module.exports = router;
