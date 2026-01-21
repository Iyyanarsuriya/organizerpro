const express = require('express');
const router = express.Router();
const noteController = require('../../controllers/Personal/noteController');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
