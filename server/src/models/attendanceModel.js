const db = require('../config/db');

const getTables = (sector) => {
    if (sector === 'it') {
        return {
            attendance: 'it_attendance',
            members: 'it_members',
            projects: 'it_projects'
        };
    } else if (sector === 'education') {
        return {
            attendance: 'education_attendance',
            members: 'education_members'

        };
    }
    return {
        attendance: 'manufacturing_attendance',
        members: 'manufacturing_members',
        projects: 'manufacturing_projects'
    };
};

const create = async (data) => {
    const { attendance: TABLE_NAME } = getTables(data.sector);
    const { user_id, subject, status, date, note, project_id, member_id, permission_duration, permission_start_time, permission_end_time, permission_reason, overtime_duration, overtime_reason, created_by, check_in, check_out, total_hours, work_mode } = data;

    let columns = ['user_id', 'subject', 'status', 'date', 'note', 'member_id', 'permission_duration', 'permission_start_time', 'permission_end_time', 'permission_reason', 'overtime_duration', 'overtime_reason', 'created_by', 'updated_by'];
    let values = [user_id, subject || null, status || null, date, note || null, member_id || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null, overtime_duration || null, overtime_reason || null, created_by || null, null];
    let placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?'];

    if (data.sector !== 'education') {
        columns.push('project_id');
        values.push(project_id || null);
        placeholders.push('?');
    }

    if (data.sector === 'it') {
        columns.push('check_in', 'check_out', 'total_hours', 'work_mode');
        values.push(check_in || null, check_out || null, total_hours || 0, work_mode || 'Office');
        placeholders.push('?', '?', '?', '?');
    }

    const [result] = await db.query(
        `INSERT INTO ${TABLE_NAME} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
    );
    return { id: result.insertId, ...data };
};

const findById = async (id, sector) => {
    const { attendance: TABLE_NAME } = getTables(sector);
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    return rows[0];
};

const getAllByUserId = async (userId, filters = {}) => {
    const { attendance: TABLE_NAME, members: MEMBERS_TABLE, projects: PROJECTS_TABLE } = getTables(filters.sector);

    let additionalColumns = '';
    let projectJoin = '';
    let projectSelect = ', p.name as project_name';

    if (filters.sector === 'education') {
        additionalColumns = ', w.department as member_department, w.staff_id as member_staff_id';
        projectSelect = ''; // No project name for education
        // No join for education
    } else {
        projectJoin = `LEFT JOIN ${PROJECTS_TABLE} p ON a.project_id = p.id`;
    }

    let query = `SELECT a.*${projectSelect}, w.name as member_name, w.role as member_role${additionalColumns} 
                    FROM ${TABLE_NAME} a 
                    ${projectJoin}
                    LEFT JOIN ${MEMBERS_TABLE} w ON a.member_id = w.id 
                    WHERE a.user_id = ?`;
    const params = [userId];

    if (filters.projectId && filters.sector !== 'education') {
        query += ' AND a.project_id = ?';
        params.push(filters.projectId);
    }

    if (filters.memberId) {
        query += ' AND a.member_id = ?';
        params.push(filters.memberId);
    }

    if (filters.role) {
        query += ' AND w.role = ?';
        params.push(filters.role);
    }

    if (filters.period) {
        if (filters.period.length === 10) {
            // YYYY-MM-DD (Day)
            query += " AND DATE(a.date) = ?";
            params.push(filters.period);
        } else if (filters.period.length === 8 && filters.period.includes('W')) {
            // YYYY-Www (Week)
            query += " AND DATE_FORMAT(a.date, '%x-W%v') = ?";
            params.push(filters.period);
        } else if (filters.period.length === 7) {
            // YYYY-MM (Month)
            query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?";
            params.push(filters.period);
        } else if (filters.period.length === 4) {
            // YYYY (Year)
            query += " AND DATE_FORMAT(a.date, '%Y') = ?";
            params.push(filters.period);
        }
    }

    if (filters.startDate && filters.endDate) {
        query += " AND DATE(a.date) BETWEEN ? AND ?";
        params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY a.date DESC, a.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
};

const update = async (id, userId, data) => {
    const { attendance: TABLE_NAME } = getTables(data.sector);
    const { subject, status, date, note, project_id, member_id, permission_duration, permission_start_time, permission_end_time, permission_reason, overtime_duration, overtime_reason, updated_by, check_in, check_out, total_hours, work_mode } = data;

    let updateFields = 'subject = ?, status = ?, date = ?, note = ?, member_id = ?, permission_duration = ?, permission_start_time = ?, permission_end_time = ?, permission_reason = ?, overtime_duration = ?, overtime_reason = ?, updated_by = ?';
    let params = [subject, status, date, note, member_id || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null, overtime_duration || null, overtime_reason || null, updated_by || null];

    if (data.sector !== 'education') {
        updateFields += ', project_id = ?';
        params.push(project_id || null);
    }

    if (data.sector === 'it') {
        updateFields += ', check_in = ?, check_out = ?, total_hours = ?, work_mode = ?';
        params.push(check_in || null, check_out || null, total_hours || 0, work_mode || 'Office');
    }

    params.push(id, userId);

    const [result] = await db.query(
        `UPDATE ${TABLE_NAME} SET ${updateFields} WHERE id = ? AND user_id = ?`,
        params
    );
    return result.affectedRows > 0;
};

const deleteResult = async (id, userId, sector) => {
    const { attendance: TABLE_NAME } = getTables(sector);
    const [result] = await db.query(
        `DELETE FROM ${TABLE_NAME} WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    return result.affectedRows > 0;
};

const getStats = async (userId, filters = {}) => {
    const { attendance: TABLE_NAME, members: MEMBERS_TABLE } = getTables(filters.sector);
    let query = `
        SELECT 
            status, 
            COUNT(*) as count 
        FROM ${TABLE_NAME} 
        WHERE user_id = ?
    `;
    const params = [userId];

    if (filters.period) {
        if (filters.period.length === 10) {
            query += " AND DATE(date) = ?";
            params.push(filters.period);
        } else if (filters.period.length === 8 && filters.period.includes('W')) {
            query += " AND DATE_FORMAT(date, '%x-W%v') = ?";
            params.push(filters.period);
        } else if (filters.period.length === 7) {
            query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
            params.push(filters.period);
        } else if (filters.period.length === 4) {
            query += " AND DATE_FORMAT(date, '%Y') = ?";
            params.push(filters.period);
        }
    }

    if (filters.startDate && filters.endDate) {
        query += " AND DATE(date) BETWEEN ? AND ?";
        params.push(filters.startDate, filters.endDate);
    }

    if (filters.memberId) {
        query += " AND member_id = ?";
        params.push(filters.memberId);
    }

    if (filters.role) {
        query += ` AND member_id IN (SELECT id FROM ${MEMBERS_TABLE} WHERE user_id = ? AND role = ?)`;
        params.push(userId, filters.role);
    }

    query += " GROUP BY status";

    const [rows] = await db.query(query, params);
    return rows;
};

const getMemberSummary = async (userId, filters = {}) => {
    const { attendance: TABLE_NAME, members: MEMBERS_TABLE } = getTables(filters.sector);
    let query = `
        SELECT 
            w.id,
            w.name,
            COUNT(CASE WHEN a.status IN ('present', 'late', 'permission') THEN 1 END) as present,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
            COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
            COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) as half_day,
            COUNT(CASE WHEN a.status = 'permission' THEN 1 END) as permission,
            COUNT(CASE WHEN a.status = 'week_off' THEN 1 END) as week_off,
            COUNT(CASE WHEN a.status = 'holiday' THEN 1 END) as holiday,
            COUNT(CASE WHEN a.status = 'CL' THEN 1 END) as CL,
            COUNT(CASE WHEN a.status = 'SL' THEN 1 END) as SL,
            COUNT(CASE WHEN a.status = 'EL' THEN 1 END) as EL,
            COUNT(CASE WHEN a.status = 'OD' THEN 1 END) as OD,
            COUNT(CASE WHEN a.status NOT IN ('week_off', 'holiday') THEN 1 END) as working_days,
            COUNT(a.id) as total,
            ${filters.sector === 'it' ? 'SUM(CASE WHEN a.total_hours IS NOT NULL THEN a.total_hours ELSE 0 END)' : '0'} as total_hours_worked,
            w.daily_wage${filters.sector === 'it' ? `,
            SUM(CASE WHEN a.total_hours > COALESCE(w.expected_hours, 8) THEN a.total_hours - COALESCE(w.expected_hours, 8) ELSE 0 END) as overtime_hours,
            COUNT(CASE WHEN a.status IN ('present', 'late', 'permission') AND a.total_hours < COALESCE(w.expected_hours, 8) AND a.total_hours > 0 THEN 1 END) as undertime_days` : ''}
        FROM ${MEMBERS_TABLE} w
        LEFT JOIN ${TABLE_NAME} a ON w.id = a.member_id
    `;
    const params = [];
    let joinConditions = [];

    if (filters.period) {
        if (filters.period.length === 10) {
            joinConditions.push("DATE(a.date) = ?");
            params.push(filters.period);
        } else if (filters.period.length === 8 && filters.period.includes('W')) {
            joinConditions.push("DATE_FORMAT(a.date, '%x-W%v') = ?");
            params.push(filters.period);
        } else if (filters.period.length === 7) {
            joinConditions.push("DATE_FORMAT(a.date, '%Y-%m') = ?");
            params.push(filters.period);
        } else if (filters.period.length === 4) {
            joinConditions.push("DATE_FORMAT(a.date, '%Y') = ?");
            params.push(filters.period);
        }
    }

    if (filters.startDate && filters.endDate) {
        joinConditions.push("DATE(a.date) BETWEEN ? AND ?");
        params.push(filters.startDate, filters.endDate);
    }

    if (filters.projectId && filters.sector !== 'education') {
        joinConditions.push("a.project_id = ?");
        params.push(filters.projectId);
    }

    if (joinConditions.length > 0) {
        query += " AND " + joinConditions.join(' AND ');
    }

    query += " WHERE w.user_id = ? AND w.status = 'active'";
    params.push(userId);

    query += " GROUP BY w.id, w.name ORDER BY w.name ASC";

    const [rows] = await db.query(query, params);
    return rows;
};

const quickMark = async (data) => {
    const { attendance: TABLE_NAME } = getTables(data.sector);
    const { user_id, member_id, date, status, project_id, subject, note, permission_duration, permission_start_time, permission_end_time, permission_reason, overtime_duration, overtime_reason, updated_by, check_in, check_out, total_hours, work_mode } = data;

    // Find existing record for this member on this date
    let checkQuery = `SELECT id FROM ${TABLE_NAME} WHERE user_id = ? AND member_id = ? AND DATE(date) = ?`;
    const checkParams = [user_id, member_id, date];

    if (data.sector !== 'education') {
        if (project_id) {
            checkQuery += ' AND project_id = ?';
            checkParams.push(project_id);
        } else {
            checkQuery += ' AND project_id IS NULL';
        }
    }

    const [existing] = await db.query(checkQuery, checkParams);

    if (existing.length > 0) {
        // Update existing record
        let updateQuery = `UPDATE ${TABLE_NAME} SET status = COALESCE(?, status), note = COALESCE(?, note), permission_duration = COALESCE(?, permission_duration), permission_start_time = COALESCE(?, permission_start_time), permission_end_time = COALESCE(?, permission_end_time), permission_reason = COALESCE(?, permission_reason), overtime_duration = COALESCE(?, overtime_duration), overtime_reason = COALESCE(?, overtime_reason), updated_by = ?`;
        let updateParams = [status || null, note || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null, overtime_duration || null, overtime_reason || null, updated_by || null];

        if (data.sector === 'it') {
            updateQuery += `, check_in = COALESCE(?, check_in), check_out = COALESCE(?, check_out), total_hours = COALESCE(?, total_hours), work_mode = COALESCE(?, work_mode)`;
            updateParams.push(check_in || null, check_out || null, total_hours || null, work_mode || null);
        }

        updateQuery += ` WHERE id = ?`;
        updateParams.push(existing[0].id);

        await db.query(updateQuery, updateParams);
        return { id: existing[0].id, ...data, updated: true };
    } else {
        // Re-building insert for clarity and safety
        const fields = ['user_id', 'member_id', 'date', 'status', 'subject', 'note', 'permission_duration', 'permission_start_time', 'permission_end_time', 'permission_reason', 'overtime_duration', 'overtime_reason', 'created_by', 'updated_by'];
        const vals = [user_id, member_id, date, status || 'present', subject || 'Daily Attendance', note || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null, overtime_duration || null, overtime_reason || null, updated_by || null, null];

        if (data.sector !== 'education') {
            fields.push('project_id');
            vals.push(project_id || null);
        }

        if (data.sector === 'it') {
            fields.push('check_in', 'check_out', 'total_hours', 'work_mode');
            vals.push(check_in || null, check_out || null, total_hours || 0, work_mode || 'Office');
        }

        const placeholders = fields.map(() => '?').join(', ');

        const [result] = await db.query(
            `INSERT INTO ${TABLE_NAME} (${fields.join(', ')}) VALUES (${placeholders})`,
            vals
        );
        // Note: passing updated_by as created_by in quickMark insert
        return { id: result.insertId, ...data, created: true };
    }
};

const bulkMark = async (data) => {
    const { user_id, member_ids, date, status, subject, note, sector, updated_by } = data;
    if (!member_ids || member_ids.length === 0) return { count: 0 };

    const promises = member_ids.map(mid => quickMark({
        user_id,
        member_id: mid,
        date,
        status,
        subject: subject || (status === 'week_off' ? 'Weekend' : 'Holiday'),
        note,
        sector,
        updated_by // Use updated_by for consistency with quickMark above
    }));

    await Promise.all(promises);
    return { count: member_ids.length };
};

module.exports = {
    create,
    findById,
    getAllByUserId,
    update,
    delete: deleteResult,
    getStats,
    getMemberSummary,
    quickMark,
    bulkMark
};
