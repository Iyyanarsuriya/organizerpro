const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/IT/reminderCategoryController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.addCategory);
router.delete('/:id', requireOwner, categoryController.deleteCategory);

module.exports = router;
