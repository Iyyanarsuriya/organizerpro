const db = require('../config/db');

// --- SECTOR MAP ---
const TABLE_MAP = {
    it: { members: 'it_members', projects: 'it_projects' },
    education: { members: 'education_members', projects: null },
    hotel: { members: 'hotel_members', projects: 'hotel_projects' },
    manufacturing: { members: 'manufacturing_members', projects: 'manufacturing_projects' }
};

const getTables = (sector) => TABLE_MAP[sector] || TABLE_MAP.manufacturing;

// --- IT SECTOR ---
const ITMemberModel = {
    create: async (data) => {
        const { user_id, name, role, phone, email, status, project_id, employment_type, expected_hours, work_location, is_billable, reporting_manager_id } = data;
        const [res] = await db.query(
            `INSERT INTO it_members (user_id, name, role, phone, email, status, project_id, employment_type, expected_hours, work_location, is_billable, reporting_manager_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, name, role, phone, email, status || 'active', project_id, employment_type || 'Full-time', expected_hours || 8.0, work_location || 'Office', is_billable ? 1 : 0, reporting_manager_id]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { name, role, phone, email, status, project_id, employment_type, expected_hours, work_location, is_billable, reporting_manager_id } = data;
        const [res] = await db.query(
            `UPDATE it_members SET name=?, role=?, phone=?, email=?, status=?, project_id=?, employment_type=?, expected_hours=?, work_location=?, is_billable=?, reporting_manager_id=? WHERE id=? AND user_id=?`,
            [name, role, phone, email, status, project_id, employment_type, expected_hours, work_location, is_billable ? 1 : 0, reporting_manager_id, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, memberType) => {
        let query = `
            SELECT m.*, p.name as project_name, mgr.name as reporting_manager_name
            FROM it_members m 
            LEFT JOIN it_projects p ON m.project_id = p.id 
            LEFT JOIN it_members mgr ON m.reporting_manager_id = mgr.id
            WHERE m.user_id = ?`;
        const params = [userId];
        if (memberType && memberType !== 'all') { query += ' AND m.member_type = ?'; params.push(memberType); }
        query += ' ORDER BY m.created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- HOTEL SECTOR ---
const HotelMemberModel = {
    create: async (data) => {
        const { user_id, name, role, phone, email, status, project_id, default_shift_id, employment_nature, primary_work_area, monthly_salary, hourly_rate, overtime_rate, allow_overtime, allow_late, max_hours_per_day, auto_mark_absent } = data;
        const [res] = await db.query(
            `INSERT INTO hotel_members (user_id, name, role, phone, email, status, project_id, default_shift_id, employment_nature, primary_work_area, monthly_salary, hourly_rate, overtime_rate, allow_overtime, allow_late, max_hours_per_day, auto_mark_absent) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, name, role, phone, email, status || 'active', project_id, default_shift_id, employment_nature || 'Permanent', primary_work_area || 'Rooms', monthly_salary || 0, hourly_rate || 0, overtime_rate || 0, allow_overtime ? 1 : 0, allow_late ? 1 : 0, max_hours_per_day || 12, auto_mark_absent ? 1 : 0]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { name, role, phone, email, status, project_id, default_shift_id, employment_nature, primary_work_area, monthly_salary, hourly_rate, overtime_rate, allow_overtime, allow_late, max_hours_per_day, auto_mark_absent } = data;
        const [res] = await db.query(
            `UPDATE hotel_members SET name=?, role=?, phone=?, email=?, status=?, project_id=?, default_shift_id=?, employment_nature=?, primary_work_area=?, monthly_salary=?, hourly_rate=?, overtime_rate=?, allow_overtime=?, allow_late=?, max_hours_per_day=?, auto_mark_absent=? WHERE id=? AND user_id=?`,
            [name, role, phone, email, status, project_id, default_shift_id, employment_nature, primary_work_area, monthly_salary, hourly_rate, overtime_rate, allow_overtime ? 1 : 0, allow_late ? 1 : 0, max_hours_per_day, auto_mark_absent ? 1 : 0, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, memberType) => {
        let query = `
            SELECT m.*, p.name as project_name, s.name as shift_name 
            FROM hotel_members m 
            LEFT JOIN hotel_projects p ON m.project_id = p.id 
            LEFT JOIN hotel_shifts s ON m.default_shift_id = s.id
            WHERE m.user_id = ?`;
        const params = [userId];
        if (memberType && memberType !== 'all') { query += ' AND m.member_type = ?'; params.push(memberType); }
        query += ' ORDER BY m.created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingMemberModel = {
    create: async (data) => {
        const { user_id, name, role, phone, email, status, project_id, wage_type, daily_wage, member_type } = data;
        const [res] = await db.query(
            `INSERT INTO manufacturing_members (user_id, name, role, phone, email, status, project_id, wage_type, daily_wage, member_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, name, role, phone, email, status || 'active', project_id, wage_type || 'daily', daily_wage || 0, member_type || 'worker']
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { name, role, phone, email, status, project_id, wage_type, daily_wage, member_type } = data;
        const [res] = await db.query(
            `UPDATE manufacturing_members SET name=?, role=?, phone=?, email=?, status=?, project_id=?, wage_type=?, daily_wage=?, member_type=? WHERE id=? AND user_id=?`,
            [name, role, phone, email, status, project_id, wage_type, daily_wage, member_type, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, memberType) => {
        let query = `
            SELECT m.*, p.name as project_name 
            FROM manufacturing_members m 
            LEFT JOIN manufacturing_projects p ON m.project_id = p.id 
            WHERE m.user_id = ?`;
        const params = [userId];
        if (memberType && memberType !== 'all') { query += ' AND m.member_type = ?'; params.push(memberType); }
        query += ' ORDER BY m.created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- EDUCATION SECTOR ---
const EducationMemberModel = {
    create: async (data) => {
        const { user_id, name, role, phone, email, status, staff_id, department, subjects, gender, profile_image, employment_type, date_of_joining, reporting_manager_id, shift_start_time, shift_end_time, cl_balance, sl_balance, el_balance } = data;
        const [res] = await db.query(
            `INSERT INTO education_members (user_id, name, role, phone, email, status, staff_id, department, subjects, gender, profile_image, employment_type, date_of_joining, reporting_manager_id, shift_start_time, shift_end_time, cl_balance, sl_balance, el_balance) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, name, role, phone, email, status || 'active', staff_id, department, subjects, gender, profile_image, employment_type || 'permanent', date_of_joining, reporting_manager_id, shift_start_time, shift_end_time, cl_balance || 0, sl_balance || 0, el_balance || 0]
        );
        return { id: res.insertId, ...data };
    },
    update: async (id, userId, data) => {
        const { name, role, phone, email, status, staff_id, department, subjects, gender, profile_image, employment_type, date_of_joining, reporting_manager_id, shift_start_time, shift_end_time, cl_balance, sl_balance, el_balance } = data;
        const [res] = await db.query(
            `UPDATE education_members SET name=?, role=?, phone=?, email=?, status=?, staff_id=?, department=?, subjects=?, gender=?, profile_image=?, employment_type=?, date_of_joining=?, reporting_manager_id=?, shift_start_time=?, shift_end_time=?, cl_balance=?, sl_balance=?, el_balance=? WHERE id=? AND user_id=?`,
            [name, role, phone, email, status, staff_id, department, subjects, gender, profile_image, employment_type, date_of_joining, reporting_manager_id, shift_start_time, shift_end_time, cl_balance, sl_balance, el_balance, id, userId]
        );
        return res.affectedRows > 0;
    },
    getAll: async (userId, memberType) => {
        let query = `SELECT m.* FROM education_members m WHERE m.user_id = ?`;
        const params = [userId];
        if (memberType && memberType !== 'all') { query += ' AND m.member_type = ?'; params.push(memberType); }
        query += ' ORDER BY m.created_at DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelMemberModel;
        case 'it': return ITMemberModel;
        case 'education': return EducationMemberModel;
        default: return ManufacturingMemberModel;
    }
};

// --- CORE MEMBER FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector).create(data);
};

const getAllByUserId = async (userId, memberType = null, sector) => {
    return getSectorModel(sector).getAll(userId, memberType);
};

const getById = async (id, userId, sector) => {
    const { members: table } = getTables(sector);
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return rows[0];
};

const update = async (id, userId, data) => {
    return getSectorModel(data.sector).update(id, userId, data);
};

const deleteMember = async (id, userId, sector) => {
    const { members: table } = getTables(sector);
    const [result] = await db.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

const getActiveMembers = async (userId, memberType = null, sector) => {
    const { members: table } = getTables(sector);
    let query = `SELECT * FROM ${table} WHERE user_id = ? AND status = "active"`;
    let params = [userId];
    if (memberType && memberType !== 'all') { query += ' AND member_type = ?'; params.push(memberType); }
    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    return rows;
};

const getGuests = async (userId, sector) => {
    if (sector === 'it' || sector === 'education') return [];
    let transTable = (sector === 'hotel') ? 'hotel_transactions' : 'manufacturing_transactions';
    let workTable = (sector === 'manufacturing') ? 'manufacturing_work_logs' : null;
    const query = `
        SELECT DISTINCT guest_name, 'guest' as member_type, 'active' as status, 0 as id 
        FROM ${transTable} 
        WHERE user_id = ? AND member_id IS NULL AND guest_name IS NOT NULL AND guest_name != ''
        ${workTable ? ` UNION SELECT DISTINCT guest_name, 'guest' as member_type, 'active' as status, 0 as id FROM ${workTable} WHERE user_id = ? AND member_id IS NULL AND guest_name IS NOT NULL AND guest_name != ''` : ''}
        ORDER BY guest_name ASC`;
    const params = workTable ? [userId, userId] : [userId];
    const [rows] = await db.query(query, params);
    return rows.map((row, index) => ({ ...row, id: `guest-${index}`, name: row.guest_name, role: 'Guest / Temp', phone: '-', email: '-', wage_type: 'daily', daily_wage: 0 }));
};

module.exports = {
    create,
    getAllByUserId,
    getById,
    update,
    delete: deleteMember,
    getActiveMembers,
    getGuests
};
