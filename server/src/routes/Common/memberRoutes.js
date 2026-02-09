const express = require('express');
const router = express.Router();
const {
    createMember,
    getMembers,
    getActiveMembers,
    updateMember,
    deleteMember
} = require('../../controllers/Common/memberController');
const { authenticateToken, requireOwner } = require('../../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', createMember);
router.get('/', getMembers);
router.get('/active', getActiveMembers);
router.put('/:id', updateMember);
router.delete('/:id', requireOwner, deleteMember);
router.get('/guests/all', require('../../controllers/Common/memberController').getGuests);

module.exports = router;
