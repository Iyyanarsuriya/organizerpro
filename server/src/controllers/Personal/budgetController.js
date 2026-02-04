const Budget = require('../../models/budgetModel');
const Transaction = require('../../models/transactionModel'); // For calculating current spend

exports.getBudgets = async (req, res) => {
    try {
        const { period, month, year } = req.query;
        const budgets = await Budget.getAllByUserId(req.user.data_owner_id, period, month, year);
        res.json(budgets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.setBudget = async (req, res) => {
    const { category, amount_limit, period, month, year } = req.body;
    try {
        const result = await Budget.create({
            user_id: req.user.data_owner_id,
            category,
            amount_limit,
            period,
            month,
            year
        });
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteBudget = async (req, res) => {
    const { id } = req.params;
    try {
        const success = await Budget.delete(id, req.user.data_owner_id);
        if (!success) return res.status(404).json({ error: 'Budget not found' });
        res.json({ message: 'Budget deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getBudgetStatus = async (req, res) => {
    // Return budgets WITH current spend
    try {
        console.log("getBudgetStatus Request Query:", req.query);
        let { month, year } = req.query;
        const now = new Date();

        // Default to current month/year if not provided or if string "null" is passed
        // Ensure strictly integer parsing
        let targetMonth = month && month !== 'null' ? parseInt(month) : (now.getMonth() + 1);
        let targetYear = year && year !== 'null' ? parseInt(year) : now.getFullYear();

        if (isNaN(targetMonth)) targetMonth = now.getMonth() + 1;
        if (isNaN(targetYear)) targetYear = now.getFullYear();

        console.log(`Calculating Budget Status for User: ${req.user.data_owner_id}, Month: ${targetMonth}, Year: ${targetYear}`);

        const userId = req.user.data_owner_id;

        // 1. Get Budgets
        // fetch all monthly budgets for user
        const budgets = await Budget.getAllByUserId(userId, 'monthly', targetMonth, targetYear);
        console.log(`Found ${budgets.length} budgets.`);

        // 2. Get Spends for this month (group by category)
        // Construct YYYY-MM-DD
        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        // Last day of month
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

        console.log(`Fetching stats for range: ${startDate} to ${endDate}`);

        const stats = await Transaction.getCategoryStats(userId, null, null, startDate, endDate, null, { sector: 'personal' });
        console.log(`Found stats for ${stats.length} categories.`);

        // 3. Merge
        const status = budgets.map(b => {
            const spendEntry = stats.find(s => s.category === b.category && s.type === 'expense');
            const spent = spendEntry ? Number(spendEntry.total) : 0;
            return {
                ...b,
                spent,
                remaining: Number(b.amount_limit) - spent,
                percentage: (spent / Number(b.amount_limit)) * 100
            };
        });

        res.json(status);
    } catch (error) {
        console.error("Budget Status Critical Error:", error);
        // Send a simple error response to avoid JSON serialization issues with complex error objects
        res.status(500).json({
            error: "Internal Server Error",
            details: error.message,
            stack: error.stack ? error.stack.split('\n')[0] : 'No stack'
        });
    }
};
