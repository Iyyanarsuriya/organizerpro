const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken, requireOwner } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, teamController.getSubUsers);
router.post('/', authenticateToken, teamController.createSubUser);
router.delete('/:id', authenticateToken, requireOwner, teamController.deleteSubUser);

module.exports = router;
