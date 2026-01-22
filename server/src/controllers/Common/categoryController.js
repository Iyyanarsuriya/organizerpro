const Category = require('../../models/categoryModel');

exports.getCategories = async (req, res) => {
    try {
        const sector = req.query.sector || 'personal';
        let categories = await Category.getAllByUserId(req.user.data_owner_id, sector);

        // If no categories found, seed defaults and fetch again
        if (categories.length === 0) {
            await Category.seedDefaultCategories(req.user.data_owner_id, sector);
            categories = await Category.getAllByUserId(req.user.data_owner_id, sector);
        }

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { name, color, sector = 'personal' } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name is required' });

        const result = await Category.create({ user_id: req.user.data_owner_id, name, color, sector });
        res.status(201).json(result);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Category already exists' });
        }
        res.status(500).json({ error: 'Failed to add category' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const sector = req.query.sector || 'personal';
        const deleted = await Category.delete(req.params.id, req.user.data_owner_id, sector);
        if (!deleted) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
};
