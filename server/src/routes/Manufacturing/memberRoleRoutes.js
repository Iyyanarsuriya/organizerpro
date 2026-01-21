const express = require('express');
const router = express.Router();
const memberRoleController = require('../../controllers/Manufacturing/memberRoleController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', memberRoleController.getRoles);
router.post('/', memberRoleController.addRole);
router.delete('/:id', requireOwner, memberRoleController.deleteRole);

module.exports = router;
