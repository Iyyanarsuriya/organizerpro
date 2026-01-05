const express = require('express');
const router = express.Router();
const {
    createWorker,
    getWorkers,
    getActiveWorkers,
    updateWorker,
    deleteWorker
} = require('../controllers/workerController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', createWorker);
router.get('/', getWorkers);
router.get('/active', getActiveWorkers);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;
