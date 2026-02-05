const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'it') return 'it_members';
    if (sector === 'education') return 'education_members';
    if (sector === 'hotel') return 'hotel_members';
    return 'manufacturing_members';
};
const getProjectTableName = (sector) => {
    if (sector === 'it') return 'it_projects';
    if (sector === 'education') return 'education_projects';
    if (sector === 'hotel') return 'hotel_projects';
    return 'manufacturing_projects';
};

const create = async (data) => {
    const table = getTableName(data.sector);
    const { user_id, name, role, phone, email, status, wage_type, daily_wage, member_type, project_id, staff_id, department, subjects,
        gender, profile_image, employment_type, date_of_joining, reporting_manager_id, shift_start_time, shift_end_time,
        cl_balance, sl_balance, el_balance, expected_hours, work_location, is_billable } = data;

    let columns = ['user_id', 'name', 'role', 'phone', 'email', 'status', 'wage_type', 'daily_wage', 'member_type'];
    let values = [user_id, name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0, member_type || (data.sector === 'hotel' ? 'staff' : 'worker')];
    let placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?'];

    if (data.sector !== 'education') {
        columns.push('project_id');
        values.push(project_id || null);
        placeholders.push('?');
    }

    if (data.sector === 'it') {
        columns.push('employment_type', 'expected_hours', 'work_location', 'is_billable', 'reporting_manager_id');
        values.push(employment_type || 'Full-time', expected_hours || 8.00, work_location || 'Office', is_billable ? 1 : 0, reporting_manager_id || null);
        placeholders.push('?', '?', '?', '?', '?');
    }

    if (data.sector === 'education') {
        columns.push('staff_id', 'department', 'subjects', 'gender', 'profile_image', 'employment_type', 'date_of_joining', 'reporting_manager_id', 'shift_start_time', 'shift_end_time', 'cl_balance', 'sl_balance', 'el_balance');
        values.push(
            staff_id || null,
            department || null,
            subjects || null,
            gender || null,
            profile_image || null,
            employment_type || 'permanent',
            date_of_joining || null,
            reporting_manager_id || null,
            shift_start_time || null,
            shift_end_time || null,
            cl_balance || 0,
            sl_balance || 0,
            el_balance || 0
        );
        placeholders.push('?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?');
    }

    const [result] = await db.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
    );
    return { id: result.insertId, ...data };
};

const getAllByUserId = async (userId, memberType = null, sector) => {
    const table = getTableName(sector);

    let query;
    if (sector === 'education') {
        query = `SELECT m.* FROM ${table} m WHERE m.user_id = ?`;
    } else if (sector === 'it') {
        const projectTable = getProjectTableName(sector);
        query = `
            SELECT m.*, p.name as project_name, mgr.name as reporting_manager_name
            FROM ${table} m 
            LEFT JOIN ${projectTable} p ON m.project_id = p.id 
            LEFT JOIN ${table} mgr ON m.reporting_manager_id = mgr.id
            WHERE m.user_id = ?
        `;
    } else {
        const projectTable = getProjectTableName(sector);
        query = `
            SELECT m.*, p.name as project_name 
            FROM ${table} m 
            LEFT JOIN ${projectTable} p ON m.project_id = p.id 
            WHERE m.user_id = ?
        `;
    }

    let params = [userId];

    if (memberType && memberType !== 'all') {
        query += ' AND m.member_type = ?';
        params.push(memberType);
    }

    query += ' ORDER BY m.created_at DESC';
    const [rows] = await db.query(query, params);
    return rows;
};

const getById = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return rows[0];
};

const update = async (id, userId, data) => {
    const table = getTableName(data.sector);
    const { name, role, phone, email, status, wage_type, daily_wage, member_type, project_id, staff_id, department, subjects,
        gender, profile_image, employment_type, date_of_joining, reporting_manager_id, shift_start_time, shift_end_time,
        cl_balance, sl_balance, el_balance, expected_hours, work_location, is_billable } = data;

    let updates = ['name = ?', 'role = ?', 'phone = ?', 'email = ?', 'status = ?', 'wage_type = ?', 'daily_wage = ?', 'member_type = ?'];
    let values = [name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0, member_type || (data.sector === 'hotel' ? 'staff' : 'worker')];

    if (data.sector !== 'education') {
        updates.push('project_id = ?');
        values.push(project_id || null);
    }

    if (data.sector === 'it') {
        updates.push('employment_type = ?', 'expected_hours = ?', 'work_location = ?', 'is_billable = ?', 'reporting_manager_id = ?');
        values.push(employment_type || 'Full-time', expected_hours || 8.00, work_location || 'Office', is_billable ? 1 : 0, reporting_manager_id || null);
    }

    if (data.sector === 'education') {
        updates.push(
            'staff_id = ?', 'department = ?', 'subjects = ?', 'gender = ?', 'profile_image = ?',
            'employment_type = ?', 'date_of_joining = ?', 'reporting_manager_id = ?',
            'shift_start_time = ?', 'shift_end_time = ?',
            'cl_balance = ?', 'sl_balance = ?', 'el_balance = ?'
        );
        values.push(
            staff_id || null,
            department || null,
            subjects || null,
            gender || null,
            profile_image || null,
            employment_type || 'permanent',
            date_of_joining || null,
            reporting_manager_id || null,
            shift_start_time || null,
            shift_end_time || null,
            cl_balance || 0,
            sl_balance || 0,
            el_balance || 0
        );
    }

    values.push(id, userId);

    const [result] = await db.query(
        `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
    );
    return result.affectedRows > 0;
};

const deleteMember = async (id, userId, sector) => {
    const table = getTableName(sector);
    const [result] = await db.query(
        `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

const getActiveMembers = async (userId, memberType = null, sector) => {
    const table = getTableName(sector);
    let query = `SELECT * FROM ${table} WHERE user_id = ? AND status = "active"`;
    let params = [userId];
    if (memberType && memberType !== 'all') {
        query += ' AND member_type = ?';
        params.push(memberType);
    }
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
        ${workTable ? `
        UNION
        SELECT DISTINCT guest_name, 'guest' as member_type, 'active' as status, 0 as id 
        FROM ${workTable} 
        WHERE user_id = ? AND member_id IS NULL AND guest_name IS NOT NULL AND guest_name != ''
        ` : ''
        }
        ORDER BY guest_name ASC
    `;
    const params = workTable ? [userId, userId] : [userId];
    const [rows] = await db.query(query, params);
    return rows.map((row, index) => ({
        ...row,
        id: `guest - ${index} `,
        name: row.guest_name,
        role: 'Guest / Temp',
        phone: '-',
        email: '-',
        wage_type: 'daily',
        daily_wage: 0
    }));
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
