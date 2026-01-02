const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.get('/stats', transactionController.getTransactionStats);

module.exports = router;
