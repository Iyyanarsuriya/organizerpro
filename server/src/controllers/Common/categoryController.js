const Category = require('../../models/categoryModel');

// --- SECTOR SPECIFIC CONTROLLERS ---

const ITCategoryController = {
    add: async (req, res) => {
        const result = await Category.create({ user_id: req.user.data_owner_id, ...req.body, sector: 'it' });
        res.status(201).json(result);
    }
};

const DefaultCategoryController = {
    add: async (req, res) => {
        const sector = req.body.sector || 'personal';
        const result = await Category.create({ user_id: req.user.data_owner_id, ...req.body, sector });
        res.status(201).json(result);
    }
};

// --- DISPATCHER HELPERS ---
const getSectorController = (sector) => {
    return sector === 'it' ? ITCategoryController : DefaultCategoryController;
};

// --- CORE CATEGORY FUNCTIONS ---

exports.getCategories = async (req, res) => {
    try {
        const sector = req.query.sector || 'personal';
        let categories = await Category.getAllByUserId(req.user.data_owner_id, sector);
        if (categories.length === 0) {
            await Category.seedDefaultCategories(req.user.data_owner_id, sector);
            categories = await Category.getAllByUserId(req.user.data_owner_id, sector);
        }
        res.json({ data: categories });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.addCategory = async (req, res) => {
    try {
        if (!req.body.name) return res.status(400).json({ error: "Name required" });
        return getSectorController(req.body.sector).add(req, res);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteCategory = async (req, res) => {
    try {
        const success = await Category.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        res.json({ success, message: success ? "Deleted" : "Not found" });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
