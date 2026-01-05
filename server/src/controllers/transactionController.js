const Transaction = require('../models/transactionModel');

exports.getTransactions = async (req, res) => {
    try {
        const { projectId, memberId, period, startDate, endDate } = req.query;
        const transactions = await Transaction.getAllByUserId(req.user.id, { projectId, memberId, period, startDate, endDate });
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createTransaction = async (req, res) => {
    const { title, amount, type, category, date, project_id, member_id } = req.body;
    try {
        const newTransaction = await Transaction.create({
            user_id: req.user.id,
            title,
            amount,
            type,
            category,
            date,
            project_id,
            member_id
        });
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { title, amount, type, category, date, project_id, member_id } = req.body;
    try {
        const success = await Transaction.update(id, req.user.id, {
            title,
            amount,
            type,
            category,
            date,
            project_id,
            member_id
        });
        if (!success) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Transaction updated' });
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
        const { period, projectId, memberId, startDate, endDate } = req.query;
        // Note: 'period' can now be YYYY-MM or YYYY.
        const summary = await Transaction.getStats(req.user.id, period, projectId, startDate, endDate, memberId);
        const categories = await Transaction.getCategoryStats(req.user.id, period, projectId, startDate, endDate, memberId);
        const lifetime = await Transaction.getLifetimeStats(req.user.id, projectId, memberId);
        const memberProjects = memberId ? await Transaction.getMemberProjectStats(req.user.id, memberId) : null;
        res.json({ summary, categories, lifetime, memberProjects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
