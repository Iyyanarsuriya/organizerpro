const express = require('express');
const router = express.Router();
const teamController = require('../../controllers/Hotel/teamController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, teamController.getSubUsers);
router.post('/', authenticateToken, teamController.createSubUser);
router.delete('/:id', authenticateToken, teamController.deleteSubUser);

module.exports = router;
