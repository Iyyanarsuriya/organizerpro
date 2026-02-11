const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: 'it_transactions',
    education: 'education_transactions',
    hotel: 'hotel_transactions',
    manufacturing: 'manufacturing_transactions',
    personal: 'personal_transactions'
};

const getTableName = (sector) => TABLE_MAP[sector] || TABLE_MAP.personal;

// Helper to sanitize date
const sanitizeDate = (date) => {
    if (!date) return date;
    if (typeof date === 'string') {
        if (date.length === 10) return date + ' 12:00:00';
        if (date.includes('T')) return date.replace('T', ' ').slice(0, 19);
    }
    if (date instanceof Date) {
        return date.toISOString().replace('T', ' ').slice(0, 19);
    }
    return date;
};

// --- IT SECTOR ---
const ITTransactionModel = {
    create: async (data) => {
        const { user_id, title, amount, type, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, description } = data;
        const [res] = await db.query(
            `INSERT INTO it_transactions (user_id, title, amount, type, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, description) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, title, amount, type, category_id, sanitizeDate(date), project_id, member_id, guest_name, payment_status || 'completed', quantity || 1, unit_price || 0, description]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { title, amount, type, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, description } = data;
        const [res] = await db.query(
            `UPDATE it_transactions SET title=?, amount=?, type=?, category_id=?, date=?, project_id=?, member_id=?, guest_name=?, payment_status=?, quantity=?, unit_price=?, description=? WHERE id=? AND user_id=?`,
            [title, amount, type, category_id, sanitizeDate(date), project_id, member_id, guest_name, payment_status || 'completed', quantity || 1, unit_price || 0, description, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, filters) => {
        let query = `
            SELECT t.*, CASE WHEN t.member_id IS NOT NULL THEN w.name ELSE t.guest_name END as member_name,
            w.member_type, c.name as category_name, p.name as project_name
            FROM it_transactions t 
            LEFT JOIN it_members w ON t.member_id = w.id
            LEFT JOIN it_projects p ON t.project_id = p.id
            LEFT JOIN it_categories c ON t.category_id = c.id
            WHERE t.user_id = ?`;
        const params = [userId];
        // ... build filters (omitted for brevity in template, will implement full logic)
        return await executeFilteredQuery(query, params, filters);
    }
};

// --- HOTEL SECTOR ---
const HotelTransactionModel = {
    create: async (data) => {
        const { user_id, title, amount, type, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, description, payment_mode, property_type, unit_id, booking_id, vendor_id, income_source, attachment_url } = data;
        const [res] = await db.query(
            `INSERT INTO hotel_transactions (user_id, title, amount, type, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, description, payment_mode, property_type, unit_id, booking_id, vendor_id, income_source, attachment_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, title, amount, type, category_id, sanitizeDate(date), project_id, member_id, guest_name, payment_status || 'completed', quantity || 1, unit_price || 0, description, payment_mode || 'Cash', property_type || 'Hotel', unit_id, booking_id, vendor_id, income_source, attachment_url]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { title, amount, type, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, description, payment_mode, property_type, unit_id, booking_id, vendor_id, income_source, attachment_url } = data;
        const [res] = await db.query(
            `UPDATE hotel_transactions SET title=?, amount=?, type=?, category_id=?, date=?, project_id=?, member_id=?, guest_name=?, payment_status=?, quantity=?, unit_price=?, description=?, payment_mode=?, property_type=?, unit_id=?, booking_id=?, vendor_id=?, income_source=?, attachment_url=? WHERE id=? AND user_id=?`,
            [title, amount, type, category_id, sanitizeDate(date), project_id, member_id, guest_name, payment_status || 'completed', quantity || 1, unit_price || 0, description, payment_mode, property_type, unit_id, booking_id, vendor_id, income_source, attachment_url, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, filters) => {
        let query = `
            SELECT t.*, 
            CASE WHEN t.member_id IS NOT NULL THEN w.name ELSE t.guest_name END as member_name,
            c.name as category_name, 
            u.unit_number as room_number,
            v.name as vendor_name,
            b.status as booking_status
            FROM hotel_transactions t 
            LEFT JOIN hotel_members w ON t.member_id = w.id
            LEFT JOIN hotel_categories c ON t.category_id = c.id
            LEFT JOIN hotel_units u ON t.unit_id = u.id
            LEFT JOIN hotel_vendors v ON t.vendor_id = v.id
            LEFT JOIN hotel_bookings b ON t.booking_id = b.id
            WHERE t.user_id = ?`;
        const params = [userId];
        return await executeFilteredQuery(query, params, filters);
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingTransactionModel = {
    create: async (data) => {
        const { user_id, title, amount, type, category, date, project_id, member_id, guest_name, payment_status, quantity, unit_price } = data;
        const [res] = await db.query(
            `INSERT INTO manufacturing_transactions (user_id, title, amount, type, category, date, project_id, member_id, guest_name, payment_status, quantity, unit_price) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, title, amount, type, category || 'Other', sanitizeDate(date), project_id, member_id, guest_name, payment_status || 'completed', quantity || 1, unit_price || 0]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { title, amount, type, category, date, project_id, member_id, guest_name, payment_status, quantity, unit_price } = data;
        const [res] = await db.query(
            `UPDATE manufacturing_transactions SET title=?, amount=?, type=?, category=?, date=?, project_id=?, member_id=?, guest_name=?, payment_status=?, quantity=?, unit_price=? WHERE id=? AND user_id=?`,
            [title, amount, type, category, sanitizeDate(date), project_id, member_id, guest_name, payment_status || 'completed', quantity || 1, unit_price || 0, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, filters) => {
        let query = `
            SELECT t.*, CASE WHEN t.member_id IS NOT NULL THEN w.name ELSE t.guest_name END as member_name,
            w.member_type, p.name as project_name
            FROM manufacturing_transactions t 
            LEFT JOIN manufacturing_members w ON t.member_id = w.id
            LEFT JOIN manufacturing_projects p ON t.project_id = p.id
            WHERE t.user_id = ?`;
        const params = [userId];
        return await executeFilteredQuery(query, params, filters);
    }
};

// --- EDUCATION SECTOR ---
const EducationTransactionModel = {
    create: async (data) => {
        const { user_id, title, amount, type, category_id, date, member_id, guest_name, payment_status, quantity, unit_price, description, vendor_id, department_id, approval_status, approved_by, payment_mode, bill_image, remarks } = data;
        const [res] = await db.query(
            `INSERT INTO education_transactions (user_id, title, amount, type, category_id, date, member_id, guest_name, payment_status, quantity, unit_price, description, vendor_id, department_id, approval_status, approval_by, payment_mode, bill_image, remarks) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, title, amount, type, category_id, sanitizeDate(date), member_id, guest_name, payment_status, quantity, unit_price, description, vendor_id, department_id, approval_status || 'approved', approved_by, payment_mode || 'Cash', bill_image, remarks]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { title, amount, type, category_id, date, member_id, guest_name, payment_status, quantity, unit_price, description, vendor_id, department_id, approval_status, approved_by, payment_mode, bill_image, remarks } = data;
        const [res] = await db.query(
            `UPDATE education_transactions SET title=?, amount=?, type=?, category_id=?, date=?, member_id=?, guest_name=?, payment_status=?, quantity=?, unit_price=?, description=?, vendor_id=?, department_id=?, approval_status=?, approval_by=?, payment_mode=?, bill_image=?, remarks=? WHERE id=? AND user_id=?`,
            [title, amount, type, category_id, sanitizeDate(date), member_id, guest_name, payment_status || 'completed', quantity || 1, unit_price || 0, description, vendor_id, department_id, approval_status, approved_by, payment_mode, bill_image, remarks, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, filters) => {
        let query = `
            SELECT t.*, CASE WHEN t.member_id IS NOT NULL THEN w.name ELSE t.guest_name END as member_name,
            w.member_type, c.name as category_name, d.name as department_name, v.name as vendor_name
            FROM education_transactions t 
            LEFT JOIN education_members w ON t.member_id = w.id
            LEFT JOIN education_categories c ON t.category_id = c.id
            LEFT JOIN education_departments d ON t.department_id = d.id
            LEFT JOIN education_vendors v ON t.vendor_id = v.id
            WHERE t.user_id = ?`;
        const params = [userId];
        return await executeFilteredQuery(query, params, filters);
    }
};

// --- PERSONAL (DEFAULT) SECTOR ---
const PersonalTransactionModel = {
    create: async (data) => {
        const { user_id, title, amount, type, category, date } = data;
        const [res] = await db.query(
            `INSERT INTO personal_transactions (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, title, amount, type, category, sanitizeDate(date)]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { title, amount, type, category, date } = data;
        const [res] = await db.query(
            `UPDATE personal_transactions SET title=?, amount=?, type=?, category=?, date=? WHERE id=? AND user_id=?`,
            [title, amount, type, category, sanitizeDate(date), id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, filters) => {
        let query = `SELECT * FROM personal_transactions t WHERE t.user_id = ?`;
        const params = [userId];
        return await executeFilteredQuery(query, params, filters);
    }
};

// --- SHARED QUERY EXECUTIONER ---
const executeFilteredQuery = async (query, params, filters) => {
    if (filters.projectId) { query += ' AND t.project_id = ?'; params.push(filters.projectId); }
    if (filters.memberId) {
        if (filters.memberId === 'guest') query += ' AND t.member_id IS NULL AND t.guest_name IS NOT NULL';
        else { query += ' AND t.member_id = ?'; params.push(filters.memberId); }
    }
    if (filters.memberType && filters.memberType !== 'all') { query += ' AND (t.member_id IN (SELECT id FROM ' + getTableName(filters.sector).replace('transactions', 'members') + ' WHERE member_type = ?) OR (t.member_id IS NULL AND ? = "guest"))'; params.push(filters.memberType, filters.memberType); }
    if (filters.period) {
        if (filters.period.length === 10) { query += " AND DATE(t.date) = ?"; params.push(filters.period); }
        else if (filters.period.length === 7) { query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?"; params.push(filters.period); }
    }
    if (filters.startDate && filters.endDate) { query += " AND DATE(t.date) BETWEEN ? AND ?"; params.push(filters.startDate, filters.endDate); }

    // Hotel specific filters
    if (filters.propertyType) { query += ' AND t.property_type = ?'; params.push(filters.propertyType); }
    if (filters.paymentMode) { query += ' AND t.payment_mode = ?'; params.push(filters.paymentMode); }
    if (filters.unitId) { query += ' AND t.unit_id = ?'; params.push(filters.unitId); }
    if (filters.bookingId) { query += ' AND t.booking_id = ?'; params.push(filters.bookingId); }
    if (filters.vendorId) { query += ' AND t.vendor_id = ?'; params.push(filters.vendorId); }
    if (filters.categoryId) { query += ' AND t.category_id = ?'; params.push(filters.categoryId); }

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT 500';
    const [rows] = await db.query(query, params);
    return rows;
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelTransactionModel;
        case 'it': return ITTransactionModel;
        case 'education': return EducationTransactionModel;
        case 'manufacturing': return ManufacturingTransactionModel;
        default: return PersonalTransactionModel;
    }
};

// --- CORE TRANSACTION FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector).create(data);
};

const getAllByUserId = async (userId, filters = {}) => {
    return getSectorModel(filters.sector).getAll(userId, filters);
};

const update = async (id, userId, data) => {
    return getSectorModel(data.sector).update(id, userId, data);
};

const deleteTransaction = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

const getStats = async (userId, period, projectId, startDate, endDate, memberId, filters = {}) => {
    const table = getTableName(filters.sector);
    let query = `SELECT SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income, SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense FROM ${table} t WHERE t.user_id = ?`;
    const params = [userId];
    // Simple filter application for stats
    if (period) { query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?"; params.push(period); }
    if (projectId && table !== 'personal_transactions') { query += " AND t.project_id = ?"; params.push(projectId); }
    const [rows] = await db.query(query, params);
    return rows[0];
};

module.exports = {
    create,
    getAllByUserId,
    update,
    delete: deleteTransaction,
    getStats,
    getLifetimeStats: async () => ({ total_income: 0, total_expense: 0 }), // Placeholder to match old API
    getCategoryStats: async (userId, period, projectId, startDate, endDate, memberId, filters = {}) => {
        const sector = filters.sector || 'personal';
        const table = getTableName(sector);

        let query = "";
        let params = [userId];

        if (sector === 'personal' || sector === 'manufacturing') {
            // Category is a string column
            query = `SELECT category, type, SUM(amount) as total FROM ${table} WHERE user_id = ?`;
        } else {
            // Category is a join (IT, Hotel, Education)
            const catTable = table.replace('_transactions', '_categories');
            query = `SELECT c.name as category, t.type, SUM(t.amount) as total 
                      FROM ${table} t 
                      LEFT JOIN ${catTable} c ON t.category_id = c.id 
                      WHERE t.user_id = ?`;
        }

        // Apply filters
        if (startDate && endDate) {
            query += " AND DATE(date) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        } else if (period) {
            query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
            params.push(period);
        }

        if (projectId && table !== 'personal_transactions') {
            query += " AND project_id = ?";
            params.push(projectId);
        }

        // Grouping
        if (sector === 'personal' || sector === 'manufacturing') {
            query += " GROUP BY category, type";
        } else {
            query += " GROUP BY c.name, t.type"; // Use t.type alias
        }

        const [rows] = await db.query(query, params);
        return rows;
    },
    getMemberExpenseSummary: async () => [] // Simplified
};
