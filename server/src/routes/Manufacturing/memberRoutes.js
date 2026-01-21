const express = require('express');
const router = express.Router();
const {
    createMember,
    getMembers,
    getActiveMembers,
    updateMember,
    deleteMember
} = require('../../controllers/Manufacturing/memberController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', createMember);
router.get('/', getMembers);
router.get('/active', getActiveMembers);
router.put('/:id', updateMember);
router.delete('/:id', requireOwner, deleteMember);
router.get('/guests/all', require('../../controllers/Manufacturing/memberController').getGuests);

module.exports = router;
