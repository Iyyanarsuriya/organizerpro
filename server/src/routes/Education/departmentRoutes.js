const express = require('express');
const router = express.Router();
const departmentController = require('../../controllers/Education/departmentController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, departmentController.getDepartments);
router.post('/', authenticateToken, departmentController.createDepartment);
router.delete('/:id', authenticateToken, departmentController.deleteDepartment);

module.exports = router;
