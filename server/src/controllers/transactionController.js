const Transaction = require('../models/transactionModel');

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.getAllByUserId(req.user.id);
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createTransaction = async (req, res) => {
    const { title, amount, type, category, date } = req.body;
    try {
        const newTransaction = await Transaction.create({
            user_id: req.user.id,
            title,
            amount,
            type,
            category,
            date
        });
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const success = await Transaction.delete(id, req.user.id);
        if (!success) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getTransactionStats = async (req, res) => {
    try {
        const { month } = req.query;
        const summary = await Transaction.getStats(req.user.id, month);
        const categories = await Transaction.getCategoryStats(req.user.id, month);
        res.json({ summary, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
