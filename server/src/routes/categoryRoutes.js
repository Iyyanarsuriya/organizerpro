const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireOwner } = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect all category routes

router.get('/', categoryController.getCategories);
router.post('/', categoryController.addCategory);
router.delete('/:id', requireOwner, categoryController.deleteCategory);

module.exports = router;
