const Category = require('../../models/categoryModel');

exports.getCategories = async (req, res) => {
    try {
        const sector = 'education';
        let categories = await Category.getAllByUserId(req.user.data_owner_id, sector);
        if (categories.length === 0) {
            await Category.seedDefaultCategories(req.user.data_owner_id, sector);
            categories = await Category.getAllByUserId(req.user.data_owner_id, sector);
        }
        res.json({ data: categories });
    } catch (error) {
        console.error("Error in Education getCategories:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const sector = 'education';
        if (!req.body.name) return res.status(400).json({ error: "Name required" });

        const result = await Category.create({
            user_id: req.user.data_owner_id,
            name: req.body.name,
            color: req.body.color || '#2d5bff',
            sector
        });
        res.status(201).json(result);
    } catch (error) {
        console.error("Error in Education addCategory:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const sector = 'education';
        const success = await Category.delete(req.params.id, req.user.data_owner_id, sector);
        res.json({ success, message: success ? "Deleted" : "Not found" });
    } catch (error) {
        console.error("Error in Education deleteCategory:", error);
        res.status(500).json({ error: error.message });
    }
};
