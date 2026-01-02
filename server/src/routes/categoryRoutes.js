const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Protect all category routes

router.get('/', categoryController.getCategories);
router.post('/', categoryController.addCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
