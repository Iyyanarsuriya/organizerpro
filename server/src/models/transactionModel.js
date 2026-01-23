const db = require('../config/db');

// Helper to determine table name
const getTableName = (sector) => {
    if (!sector) return 'personal_transactions';
    if (sector === 'it') return 'it_transactions';
    return sector === 'manufacturing' ? 'manufacturing_transactions' : 'personal_transactions';
};

const create = async (data) => {
    const { user_id, title, amount, type, category, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, sector, description } = data;
    const table = getTableName(sector);

    // Force date to noon to avoid timezone boundary shifts
    let finalDate = date;
    if (typeof finalDate === 'string' && finalDate.length === 10) {
        finalDate = finalDate + ' 12:00:00';
    }

    let query, params;

    if (table === 'manufacturing_transactions' || table === 'it_transactions') {
        const columns = ['user_id', 'title', 'amount', 'type', 'category', 'date', 'project_id', 'member_id', 'guest_name', 'payment_status', 'quantity', 'unit_price'];
        const values = [user_id, title, amount, type, category, finalDate, project_id || null, member_id || null, guest_name || null, payment_status || 'completed', quantity || 1, unit_price || 0];

        if (table === 'it_transactions') {
            columns.push('description');
            values.push(description || null);
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

    if (table === 'manufacturing_transactions' || table === 'it_transactions') {
        const projectTable = table === 'manufacturing_transactions' ? 'manufacturing_projects' : 'it_projects';
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : 'it_members';

        query = `SELECT t.*, p.name as project_name, 
                CASE 
                    WHEN t.member_id IS NOT NULL THEN w.name 
                    ELSE t.guest_name 
                END as member_name,
                w.member_type
                FROM ${table} t 
                LEFT JOIN ${projectTable} p ON t.project_id = p.id 
                LEFT JOIN ${memberTable} w ON t.member_id = w.id
                WHERE t.user_id = ?`;

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
    const { title, amount, type, category, date, project_id, member_id, guest_name, payment_status, quantity, unit_price, sector, description } = data;
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
        query = `UPDATE ${table} SET title = ?, amount = ?, type = ?, category = ?, date = ?, project_id = ?, member_id = ?, guest_name = ?, payment_status = ?, quantity = ?, unit_price = ?, description = ? WHERE id = ? AND user_id = ?`;
        params = [title, amount, type, category, finalDate, project_id || null, member_id || null, guest_name || null, payment_status || 'completed', quantity || 1, unit_price || 0, description || null, id, userId];
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
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
            FROM ${table} WHERE user_id = ?`;
    const params = [userId];

    if (period) {
        if (period.length === 10) {
            query += " AND DATE(date) = ?";
            params.push(period);
        } else if (period.length === 8 && period.includes('W')) {
            query += " AND DATE_FORMAT(date, '%x-W%v') = ?";
            params.push(period);
        } else if (period.length === 7) {
            query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
            params.push(period);
        } else if (period.length === 4) {
            query += " AND DATE_FORMAT(date, '%Y') = ?";
            params.push(period);
        }
    }

    if (startDate && endDate) {
        query += " AND DATE(date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    if (table === 'manufacturing_transactions' || table === 'it_transactions') {
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : 'it_members';

        if (projectId) {
            query += ` AND project_id = ?`;
            params.push(projectId);
        }

        if (memberId) {
            query += ` AND member_id = ?`;
            params.push(memberId);
        }

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query = query.replace(`FROM ${table}`, `FROM ${table} t`);
            query = query.replace('WHERE user_id = ?', `INNER JOIN ${memberTable} m ON t.member_id = m.id WHERE t.user_id = ?`);
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }
    }

    const [rows] = await db.query(query, params);
    return rows[0];
};

const getLifetimeStats = async (userId, projectId, memberId, filters = {}) => {
    const table = getTableName(filters.sector);
    if (table !== 'manufacturing_transactions' && table !== 'it_transactions') return { total_income: 0, total_expense: 0 };

    let query = `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
            FROM ${table} WHERE user_id = ?`;
    const params = [userId];

    if (projectId) {
        query += ` AND project_id = ?`;
        params.push(projectId);
    }

    if (memberId) {
        query += ` AND member_id = ?`;
        params.push(memberId);
    }

    if (filters && filters.memberType && filters.memberType !== 'all') {
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : 'it_members';
        query = query.replace(`FROM ${table}`, `FROM ${table} t`);
        query = query.replace('WHERE user_id = ?', `INNER JOIN ${memberTable} m ON t.member_id = m.id WHERE t.user_id = ?`);
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
    let query = `SELECT category, type, SUM(amount) as total 
            FROM ${table} WHERE user_id = ?`;
    const params = [userId];

    if (period) {
        if (period.length === 10) {
            query += " AND DATE(date) = ?";
            params.push(period);
        } else if (period.length === 8 && period.includes('W')) {
            query += " AND DATE_FORMAT(date, '%x-W%v') = ?";
            params.push(period);
        } else if (period.length === 7) {
            query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
            params.push(period);
        } else if (period.length === 4) {
            query += " AND DATE_FORMAT(date, '%Y') = ?";
            params.push(period);
        }
    }

    if (startDate && endDate) {
        query += " AND DATE(date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    if (table === 'manufacturing_transactions' || table === 'it_transactions') {
        const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : 'it_members';

        if (projectId) {
            query += ` AND project_id = ?`;
            params.push(projectId);
        }

        if (memberId) {
            query += ` AND member_id = ?`;
            params.push(memberId);
        }

        if (filters && filters.memberType && filters.memberType !== 'all') {
            query = query.replace(`FROM ${table}`, `FROM ${table} t`);
            query = query.replace('WHERE user_id = ?', `INNER JOIN ${memberTable} m ON t.member_id = m.id WHERE t.user_id = ?`);
            query += ' AND m.member_type = ?';
            params.push(filters.memberType);
        }
    }

    query += ` GROUP BY category, type`;

    const [rows] = await db.query(query, params);
    return rows;
};

const getMemberExpenseSummary = async (userId, period, projectId, startDate, endDate, filters = {}) => {
    const table = getTableName(filters.sector);
    const memberTable = table === 'manufacturing_transactions' ? 'manufacturing_members' : (table === 'it_transactions' ? 'it_members' : 'manufacturing_members');

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
