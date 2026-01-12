const express = require('express');
const router = express.Router();
const {
    createMember,
    getMembers,
    getActiveMembers,
    updateMember,
    deleteMember
} = require('../controllers/memberController');
const { authenticateToken, requireOwner } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', createMember);
router.get('/', getMembers);
router.get('/active', getActiveMembers);
router.put('/:id', updateMember);
router.delete('/:id', requireOwner, deleteMember);
router.get('/guests/all', require('../controllers/memberController').getGuests);

module.exports = router;
