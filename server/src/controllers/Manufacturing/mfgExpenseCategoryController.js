const ExpenseCategory = require('../../models/expenseCategoryModel');

exports.getExpenseCategories = async (req, res) => {
    try {
        const categories = await ExpenseCategory.getAllByUserId(req.user.data_owner_id, 'manufacturing');
        res.json({ data: categories });
    } catch (error) {
        console.error("Error fetching manufacturing expense categories:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createExpenseCategory = async (req, res) => {
    try {
        const { name, type } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const newCategory = await ExpenseCategory.create({
            user_id: req.user.data_owner_id,
            name,
            type,
            sector: 'manufacturing'
        });
        res.status(201).json({ data: newCategory });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Category already exists' });
        }
        console.error("Error creating manufacturing expense category:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteExpenseCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await ExpenseCategory.delete(id, req.user.data_owner_id, 'manufacturing');
        if (!success) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error("Error deleting manufacturing expense category:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
