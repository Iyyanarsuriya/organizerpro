const express = require('express');
const router = express.Router();
const workTypeController = require('../controllers/workTypeController');
const { authenticateToken, requireOwner } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', workTypeController.createWorkType);
router.get('/', workTypeController.getWorkTypes);
router.delete('/:id', requireOwner, workTypeController.deleteWorkType);

module.exports = router;
