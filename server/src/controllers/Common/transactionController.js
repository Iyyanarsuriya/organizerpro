const Transaction = require('../../models/transactionModel');

// --- SECTOR SPECIFIC HANDLERS ---

const EducationTransactionHandler = {
    create: async (req) => {
        const { title, amount, type, category_id, date, member_id, sector, description, guest_name, payment_status, quantity, unit_price, vendor_id, department_id, approval_status, approved_by, payment_mode, bill_image, remarks } = req.body;
        return await Transaction.create({
            user_id: req.user.data_owner_id, title, amount, type, date, sector, description, guest_name, payment_status, quantity, unit_price,
            category_id: (category_id === 'None' || category_id === '') ? null : category_id,
            member_id: (member_id === 'None' || member_id === '') ? null : member_id,
            vendor_id: (vendor_id === 'None' || vendor_id === '') ? null : vendor_id,
            department_id: (department_id === 'None' || department_id === '') ? null : department_id,
            approval_status, approved_by, payment_mode, bill_image, remarks
        });
    }
};

const HotelTransactionHandler = {
    create: async (req) => {
        const { title, amount, type, category_id, date, member_id, sector, description, guest_name, payment_status, quantity, unit_price, vendor_id, unit_id, booking_id, property_type, payment_mode, income_source, attachment_url } = req.body;
        return await Transaction.create({
            user_id: req.user.data_owner_id, title, amount, type, date, sector, description, guest_name, payment_status, quantity, unit_price,
            category_id: (category_id === 'None' || category_id === '') ? null : category_id,
            member_id: (member_id === 'None' || member_id === '') ? null : member_id,
            vendor_id: (vendor_id === 'None' || vendor_id === '') ? null : vendor_id,
            unit_id: (unit_id === 'None' || unit_id === '') ? null : unit_id,
            booking_id: (booking_id === 'None' || booking_id === '') ? null : booking_id,
            property_type, payment_mode, income_source, attachment_url
        });
    }
};

const DefaultTransactionHandler = {
    create: async (req) => {
        const { title, amount, type, category, category_id, date, project_id, member_id, sector, description, guest_name, payment_status, quantity, unit_price } = req.body;
        return await Transaction.create({
            user_id: req.user.data_owner_id, title, amount, type, category, date, sector, description, guest_name, payment_status, quantity, unit_price,
            category_id: (category_id === 'None' || category_id === '') ? null : category_id,
            project_id: (project_id === 'None' || project_id === '') ? null : project_id,
            member_id: (member_id === 'None' || member_id === '') ? null : member_id
        });
    }
};

// --- DISPATCHER HELPERS ---
const getSectorHandler = (sector) => {
    if (sector === 'education') return EducationTransactionHandler;
    if (sector === 'hotel') return HotelTransactionHandler;
    return DefaultTransactionHandler;
};

// --- EXPORTED CONTROLLER FUNCTIONS ---

exports.getTransactions = async (req, res) => {
    try {
        const { projectId, memberId, memberType, period, startDate, endDate, sector } = req.query;
        const transactions = await Transaction.getAllByUserId(req.user.data_owner_id, { projectId, memberId, memberType, period, startDate, endDate, sector });
        res.json({ data: transactions });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.createTransaction = async (req, res) => {
    try {
        const result = await getSectorHandler(req.body.sector).create(req);
        res.status(201).json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateTransaction = async (req, res) => {
    try {
        const success = await Transaction.update(req.params.id, req.user.data_owner_id, req.body);
        res.status(success ? 200 : 404).json({ message: success ? "Updated" : "Not found" });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const success = await Transaction.delete(req.params.id, req.user.data_owner_id, req.query.sector);
        res.status(success ? 200 : 404).json({ message: success ? "Deleted" : "Not found" });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTransactionStats = async (req, res) => {
    try {
        const { period, projectId, memberId, memberType, startDate, endDate, sector } = req.query;
        const filters = { memberType, sector };
        const summary = await Transaction.getStats(req.user.data_owner_id, period, projectId, startDate, endDate, memberId, filters);
        const categories = await Transaction.getCategoryStats(req.user.data_owner_id, period, projectId, startDate, endDate, memberId, filters);
        res.json({ data: { summary, categories } });
    } catch (error) { res.status(500).json({ error: error.message }); }
};
