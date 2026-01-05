const express = require('express');
const router = express.Router();
const {
    createMember,
    getMembers,
    getActiveMembers,
    updateMember,
    deleteMember
} = require('../controllers/memberController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', createMember);
router.get('/', getMembers);
router.get('/active', getActiveMembers);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

module.exports = router;
