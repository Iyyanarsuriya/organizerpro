const db = require('../config/db');

const getTableName = (sector) => {
    if (sector === 'it') return 'it_members';
    if (sector === 'education') return 'education_members';
    return 'manufacturing_members';
};
const getProjectTableName = (sector) => {
    if (sector === 'it') return 'it_projects';
    if (sector === 'education') return 'education_projects';
    return 'manufacturing_projects';
};

const create = async (data) => {
    const table = getTableName(data.sector);
    const { user_id, name, role, phone, email, status, wage_type, daily_wage, member_type, project_id } = data;
    const [result] = await db.query(
        `INSERT INTO ${table} (user_id, name, role, phone, email, status, wage_type, daily_wage, member_type, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0, member_type || 'worker', project_id || null]
    );
    return { id: result.insertId, ...data };
};

const getAllByUserId = async (userId, memberType = null, sector) => {
    const table = getTableName(sector);
    const projectTable = getProjectTableName(sector);

    let query = `
        SELECT m.*, p.name as project_name 
        FROM ${table} m 
        LEFT JOIN ${projectTable} p ON m.project_id = p.id 
        WHERE m.user_id = ?
    `;
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
    const { name, role, phone, email, status, wage_type, daily_wage, member_type, project_id } = data;
    const [result] = await db.query(
        `UPDATE ${table} SET name = ?, role = ?, phone = ?, email = ?, status = ?, wage_type = ?, daily_wage = ?, member_type = ?, project_id = ? WHERE id = ? AND user_id = ?`,
        [name, role || null, phone || null, email || null, status || 'active', wage_type || 'daily', daily_wage || 0, member_type || 'worker', project_id || null, id, userId]
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

    // Default manufacturing logic
    const query = `
        SELECT DISTINCT guest_name, 'guest' as member_type, 'active' as status, 0 as id 
        FROM manufacturing_transactions 
        WHERE user_id = ? AND member_id IS NULL AND guest_name IS NOT NULL AND guest_name != ''
        UNION
        SELECT DISTINCT guest_name, 'guest' as member_type, 'active' as status, 0 as id 
        FROM manufacturing_work_logs 
        WHERE user_id = ? AND member_id IS NULL AND guest_name IS NOT NULL AND guest_name != ''
        ORDER BY guest_name ASC
    `;
    const [rows] = await db.query(query, [userId, userId]);
    return rows.map((row, index) => ({
        ...row,
        id: `guest-${index}`,
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
