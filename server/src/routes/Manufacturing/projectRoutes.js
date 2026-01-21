const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/Manufacturing/projectController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.delete('/:id', requireOwner, projectController.deleteProject);

module.exports = router;
