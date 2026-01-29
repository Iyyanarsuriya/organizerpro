const db = require('../config/db');

// Helper to determine table name
const getTableName = (sector) => {
    if (!sector) return 'personal_transactions';
    if (sector === 'it') return 'it_transactions';
    if (sector === 'education') return 'education_transactions';
    return sector === 'manufacturing' ? 'manufacturing_transactions' : 'personal_transactions';
};

const create = async (data) => {
    const { user_id, title, amount, type, category, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, sector, description,
        vendor_id, department_id, approval_status, approved_by, payment_mode, bill_image, remarks } = data;
    const table = getTableName(sector);

    // Force date to noon to avoid timezone boundary shifts
    let finalDate = date;
    if (typeof finalDate === 'string' && finalDate.length === 10) {
        finalDate = finalDate + ' 12:00:00';
    }

    let query, params;

    if (table === 'manufacturing_transactions' || table === 'it_transactions' || table === 'education_transactions') {
        const columns = ['user_id', 'title', 'amount', 'type', 'date', 'member_id', 'guest_name', 'payment_status', 'quantity', 'unit_price'];
        const values = [user_id, title, amount, type, finalDate, member_id || null, guest_name || null, payment_status || 'completed', quantity || 1, unit_price || 0];

        if (table !== 'education_transactions') {
            columns.push('project_id');
            values.push(project_id || null);
        }

        if (table === 'it_transactions' || table === 'education_transactions') {
            columns.push('category_id', 'description');
            values.push(category_id || null, description || null);
        } else {
            columns.push('category');
            values.push(category || 'Other');
        }

        if (table === 'education_transactions') {
            columns.push('vendor_id', 'department_id', 'approval_status', 'approval_by', 'payment_mode', 'bill_image', 'remarks');
            values.push(vendor_id || null, department_id || null, approval_status || 'approved', approved_by || null, payment_mode || 'Cash', bill_image || null, remarks || null);
        }

        query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
        params = values;
    } else {
        // Personal
        query = `INSERT INTO ${table} (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)`;
        params = [user_id, title, amount, type, category, finalDate];
    }

    const [result] = await db.query(query, params);
    return { id: result.insertId, ...data };
};

const getAllByUserId = async (userId, filters = {}) => {
    const table = getTableName(filters.sector);
    let query;
    const params = [userId];

    if (table === 'manufacturing_transactions' || table === 'it_transactions' || table === 'education_transactions') {
        const projectTable = table === 'manufacturing_transactions' ? 'manufacturing_projects' : (table === 'it_transactions' ? 'it_projects' : null);
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : (table === 'it_transactions' ? 'it_members' : 'education_members');
        const categoryTable = table === 'it_transactions' ? 'it_categories' : (table === 'education_transactions' ? 'education_categories' : null);

        let selectFields = `t.*, 
                CASE 
                    WHEN t.member_id IS NOT NULL THEN w.name 
                    ELSE t.guest_name 
                END as member_name,
                w.member_type${categoryTable ? ', c.name as category_name' : ''}`;

        if (table === 'education_transactions') {
            selectFields += `, d.name as department_name, v.name as vendor_name`;
        }

        if (projectTable) {
            selectFields += `, p.name as project_name`;
        }

        query = `SELECT ${selectFields}
                FROM ${table} t 
                LEFT JOIN ${memberTable} w ON t.member_id = w.id`;

        if (projectTable) {
            query += ` LEFT JOIN ${projectTable} p ON t.project_id = p.id`;
        }

        if (categoryTable) {
            query += ` LEFT JOIN ${categoryTable} c ON t.category_id = c.id`;
        }

        if (table === 'education_transactions') {
            query += ` LEFT JOIN education_departments d ON t.department_id = d.id`;
            query += ` LEFT JOIN education_vendors v ON t.vendor_id = v.id`;
        }

        query += ` WHERE t.user_id = ?`;

        if (filters.projectId) {
            query += ' AND t.project_id = ?';
            params.push(filters.projectId);
        }

        if (filters.memberId) {
            if (filters.memberId === 'guest') {
                query += ' AND t.member_id IS NULL AND t.guest_name IS NOT NULL';
            } else {
                query += ' AND t.member_id = ?';
                params.push(filters.memberId);
            }
        }

        if (filters.memberType && filters.memberType !== 'all') {
            query += ' AND (w.member_type = ? OR (t.member_id IS NULL AND ? = "guest"))';
            params.push(filters.memberType, filters.memberType);
        }

        if (filters.guestName) {
            query += ' AND t.guest_name = ?';
            params.push(filters.guestName);
        }

        if (filters.approval_status) {
            query += ' AND t.approval_status = ?';
            params.push(filters.approval_status);
        }

        if (filters.department_id) {
            query += ' AND t.department_id = ?';
            params.push(filters.department_id);
        }

    } else {
        // Personal
        query = `SELECT t.* FROM ${table} t WHERE t.user_id = ?`;
    }


    if (filters.period) {
        if (filters.period.length === 10) {
            // YYYY-MM-DD (Day)
            query += " AND DATE(t.date) = ?";
            params.push(filters.period);
        } else if (filters.period.length === 8 && filters.period.includes('W')) {
            // YYYY-Www (Week)
            query += " AND DATE_FORMAT(t.date, '%x-W%v') = ?";
            params.push(filters.period);
        } else if (filters.period.length === 7) {
            // YYYY-MM (Month)
            query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?";
            params.push(filters.period);
        } else if (filters.period.length === 4) {
            // YYYY (Year)
            query += " AND DATE_FORMAT(t.date, '%Y') = ?";
            params.push(filters.period);
        }
    }

    if (filters.startDate && filters.endDate) {
        query += " AND DATE(t.date) BETWEEN ? AND ?";
        params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
};

const update = async (id, userId, data) => {
    const { title, amount, type, category, category_id, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, sector, description,
        vendor_id, department_id, approval_status, approved_by, payment_mode, bill_image, remarks } = data;
    const table = getTableName(sector);

    // Force date to noon to avoid timezone boundary shifts
    let finalDate = date;
    if (typeof finalDate === 'string' && finalDate.length === 10) {
        finalDate = finalDate + ' 12:00:00';
    }

    let query, params;
    if (table === 'manufacturing_transactions') {
        query = `UPDATE ${table} SET title = ?, amount = ?, type = ?, category = ?, date = ?, project_id = ?, member_id = ?, guest_name = ?, payment_status = ?, quantity = ?, unit_price = ? WHERE id = ? AND user_id = ?`;
        params = [title, amount, type, category, finalDate, project_id || null, member_id || null, guest_name || null, payment_status || 'completed', quantity || 1, unit_price || 0, id, userId];
    } else if (table === 'it_transactions') {
        query = `UPDATE ${table} SET title = ?, amount = ?, type = ?, category_id = ?, date = ?, project_id = ?, member_id = ?, guest_name = ?, payment_status = ?, quantity = ?, unit_price = ?, description = ? WHERE id = ? AND user_id = ?`;
        params = [title, amount, type, category_id || null, finalDate, project_id || null, member_id || null, guest_name || null, payment_status || 'completed', quantity || 1, unit_price || 0, description || null, id, userId];
    } else if (table === 'education_transactions') {
        query = `UPDATE ${table} SET title = ?, amount = ?, type = ?, category_id = ?, date = ?, member_id = ?, guest_name = ?, payment_status = ?, quantity = ?, unit_price = ?, description = ?, 
                 vendor_id = ?, department_id = ?, approval_status = ?, approval_by = ?, payment_mode = ?, bill_image = ?, remarks = ? 
                 WHERE id = ? AND user_id = ?`;
        params = [title, amount, type, category_id || null, finalDate, member_id || null, guest_name || null, payment_status || 'completed', quantity || 1, unit_price || 0, description || null,
            vendor_id || null, department_id || null, approval_status || 'approved', approved_by || null, payment_mode || 'Cash', bill_image || null, remarks || null, id, userId];
    } else {
        query = `UPDATE ${table} SET title = ?, amount = ?, type = ?, category = ?, date = ? WHERE id = ? AND user_id = ?`;
        params = [title, amount, type, category, finalDate, id, userId];
    }

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
};


const deleteTransaction = async (id, userId, sector) => { // Renamed from 'delete' to avoid reserved word issues if any, but exported as 'delete'
    const table = getTableName(sector);
    const [result] = await db.query(
        `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

const getStats = async (userId, period, projectId, startDate, endDate, memberId, filters = {}) => {
    const table = getTableName(filters.sector);
    let query = `SELECT 
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
            FROM ${table} t WHERE t.user_id = ?`;
    const params = [userId];

    if (period) {
        if (period.length === 10) {
            query += " AND DATE(t.date) = ?";
            params.push(period);
        } else if (period.length === 8 && period.includes('W')) {
            query += " AND DATE_FORMAT(t.date, '%x-W%v') = ?";
            params.push(period);
        } else if (period.length === 7) {
            query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?";
            params.push(period);
        } else if (period.length === 4) {
            query += " AND DATE_FORMAT(t.date, '%Y') = ?";
            params.push(period);
        }
    }

    if (startDate && endDate) {
        query += " AND DATE(t.date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    if (table === 'manufacturing_transactions' || table === 'it_transactions' || table === 'education_transactions') {
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : (table === 'it_transactions' ? 'it_members' : 'education_members');

        if (projectId && table !== 'education_transactions') {
            query += ` AND t.project_id = ?`;
            params.push(projectId);
        }

        if (memberId) {
            query += ` AND t.member_id = ?`;
            params.push(memberId);
        }

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query = query.replace(`FROM ${table} t`, `FROM ${table} t INNER JOIN ${memberTable} m ON t.member_id = m.id`);
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }
    }

    const [rows] = await db.query(query, params);
    return rows[0];
};

const getLifetimeStats = async (userId, projectId, memberId, filters = {}) => {
    const table = getTableName(filters.sector);
    if (table !== 'manufacturing_transactions' && table !== 'it_transactions' && table !== 'education_transactions') return { total_income: 0, total_expense: 0 };

    let query = `SELECT 
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
            FROM ${table} t WHERE t.user_id = ?`;
    const params = [userId];

    if (projectId) {
        query += ` AND t.project_id = ?`;
        params.push(projectId);
    }

    if (memberId) {
        query += ` AND t.member_id = ?`;
        params.push(memberId);
    }

    if (filters && filters.memberType && filters.memberType !== 'all') {
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : (table === 'it_transactions' ? 'it_members' : 'education_members');
        query = query.replace(`FROM ${table} t`, `FROM ${table} t INNER JOIN ${memberTable} m ON t.member_id = m.id`);
        query += ' AND m.member_type = ?';
        params.push(filters.memberType);
    }

    const [rows] = await db.query(query, params);
    return rows[0];
};

const getMemberProjectStats = async (userId, memberId) => {
    let query = `SELECT p.name as project_name, SUM(t.amount) as total
                FROM manufacturing_transactions t
                JOIN manufacturing_projects p ON t.project_id = p.id
                WHERE t.user_id = ? AND t.member_id = ? AND t.type = 'expense'
                GROUP BY t.project_id`;
    const [rows] = await db.query(query, [userId, memberId]);
    return rows;
};

const getCategoryStats = async (userId, period, projectId, startDate, endDate, memberId, filters = {}) => {
    const table = getTableName(filters.sector);
    let query;
    const params = [userId];

    if (table === 'it_transactions' || table === 'education_transactions') {
        const catTable = table === 'it_transactions' ? 'it_categories' : 'education_categories';
        query = `SELECT c.name as category, t.type, SUM(t.amount) as total 
                 FROM ${table} t 
                 LEFT JOIN ${catTable} c ON t.category_id = c.id 
                 WHERE t.user_id = ?`;
    } else {
        query = `SELECT t.category, t.type, SUM(t.amount) as total 
                 FROM ${table} t WHERE t.user_id = ?`;
    }

    if (period) {
        if (period.length === 10) {
            query += " AND DATE(t.date) = ?";
            params.push(period);
        } else if (period.length === 8 && period.includes('W')) {
            query += " AND DATE_FORMAT(t.date, '%x-W%v') = ?";
            params.push(period);
        } else if (period.length === 7) {
            query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?";
            params.push(period);
        } else if (period.length === 4) {
            query += " AND DATE_FORMAT(t.date, '%Y') = ?";
            params.push(period);
        }
    }

    if (startDate && endDate) {
        query += " AND DATE(t.date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    if (table === 'manufacturing_transactions' || table === 'it_transactions' || table === 'education_transactions') {
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : (table === 'it_transactions' ? 'it_members' : 'education_members');

        if (projectId && table !== 'education_transactions') {
            query += ` AND t.project_id = ?`;
            params.push(projectId);
        }

        if (memberId) {
            query += ` AND t.member_id = ?`;
            params.push(memberId);
        }

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query = query.replace(`FROM ${table} t`, `FROM ${table} t INNER JOIN ${memberTable} m ON t.member_id = m.id`);
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }
    }

    if (table === 'it_transactions' || table === 'education_transactions') {
        query += ` GROUP BY c.name, t.type`;
    } else {
        query += ` GROUP BY t.category, t.type`;
    }

    const [rows] = await db.query(query, params);
    return rows;
};

const getMemberExpenseSummary = async (userId, period, projectId, startDate, endDate, filters = {}) => {
    const table = getTableName(filters.sector);
    const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : (table === 'it_transactions' ? 'it_members' : 'education_members');

    let query = `SELECT m.name as member_name, SUM(t.amount) as total 
                FROM ${table} t
                JOIN ${memberTable} m ON t.member_id = m.id
                WHERE t.user_id = ? AND t.type = 'expense'`;
    const params = [userId];

    if (filters && filters.memberType && filters.memberType !== 'all') {
        query += ' AND m.member_type = ?';
        params.push(filters.memberType);
    }

    if (period) {
        if (period.length === 10) {
            query += " AND DATE(t.date) = ?";
            params.push(period);
        } else if (period.length === 8 && period.includes('W')) {
            query += " AND DATE_FORMAT(t.date, '%x-W%v') = ?";
            params.push(period);
        } else if (period.length === 7) {
            query += " AND DATE_FORMAT(t.date, '%Y-%m') = ?";
            params.push(period);
        } else if (period.length === 4) {
            query += " AND DATE_FORMAT(t.date, '%Y') = ?";
            params.push(period);
        }
    }

    if (startDate && endDate) {
        query += " AND DATE(t.date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    if (projectId) {
        query += ` AND t.project_id = ?`;
        params.push(projectId);
    }

    query += ` GROUP BY t.member_id`;

    const [rows] = await db.query(query, params);
    return rows;
};

module.exports = {
    create,
    getAllByUserId,
    update,
    delete: deleteTransaction,
    getStats,
    getLifetimeStats,
    getMemberProjectStats,
    getCategoryStats,
    getMemberExpenseSummary
};
