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
    } else if (sector === 'hotel') {
        return {
            attendance: 'hotel_attendance',
            members: 'hotel_members',
            projects: 'hotel_projects'
        };
    }
    return {
        attendance: 'manufacturing_attendance',
        members: 'manufacturing_members',
        projects: 'manufacturing_projects'
    };
};

const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [h1, m1] = checkIn.split(':').map(Number);
    const [h2, m2] = checkOut.split(':').map(Number);
    let start = h1 * 60 + m1;
    let end = h2 * 60 + m2;
    if (end < start) end += 24 * 60; // Crosses midnight
    return Number(((end - start) / 60).toFixed(2));
};

const checkConflict = async (db, table, userId, memberId, date, startTime, endTime) => {
    // If no time provided, check if ANY record exists for that day (simple duplication check)
    if (!startTime || !endTime) {
        const [rows] = await db.query(`SELECT id FROM ${table} WHERE user_id = ? AND member_id = ? AND DATE(date) = ?`, [userId, memberId, date]);
        return rows.length > 0;
    }
    // Time Overlap Check: (StartA < EndB) AND (EndA > StartB)
    // Note: This simple logic fails for midnight crossing.
    // For Hotel sector, assuming shift overlaps check on SAME DATE for now.
    const [rows] = await db.query(`SELECT id, check_in, check_out FROM ${table} WHERE user_id = ? AND member_id = ? AND DATE(date) = ?`, [userId, memberId, date]);
    for (const row of rows) {
        if (!row.check_in || !row.check_out) return true; // Existing is full day? Conflict.
        // Compare Minutes
        const [h1, m1] = row.check_in.split(':').map(Number);
        const [h2, m2] = row.check_out.split(':').map(Number);
        const [n1, nm1] = startTime.split(':').map(Number);
        const [n2, nm2] = endTime.split(':').map(Number);

        let s1 = h1 * 60 + m1, e1 = h2 * 60 + m2;
        let s2 = n1 * 60 + nm1, e2 = n2 * 60 + nm2;
        if (e1 < s1) e1 += 1440;
        if (e2 < s2) e2 += 1440;

        if (s1 < e2 && e1 > s2) return true;
    }
    return false;
};

const create = async (data) => {
    const { attendance: TABLE_NAME } = getTables(data.sector);
    const { user_id, subject, status, date, note, project_id, member_id, permission_duration, permission_start_time, permission_end_time, permission_reason, overtime_duration, overtime_reason, created_by, check_in, check_out, total_hours, work_mode } = data;

    // 1. Calculate Duration/Total Hours if inputs exist
    let calculatedHours = total_hours || 0;
    if (check_in && check_out && !total_hours) {
        calculatedHours = calculateDuration(check_in, check_out);
    }

    // 2. Conflict Check (Hotel Only for now to avoid breaking others)
    if (data.sector === 'hotel' && member_id) {
        const isConflict = await checkConflict(db, TABLE_NAME, user_id, member_id, date, check_in, check_out);
        if (isConflict) {
            throw new Error("Attendance overlap detected for this member on this date.");
        }
    }

    let columns = ['user_id', 'subject', 'status', 'date', 'note', 'member_id', 'permission_duration', 'permission_start_time', 'permission_end_time', 'permission_reason', 'overtime_duration', 'overtime_reason', 'created_by', 'updated_by'];
    let values = [user_id, subject || null, status || null, date, note || null, member_id || null, permission_duration || null, permission_start_time || null, permission_end_time || null, permission_reason || null, overtime_duration || null, overtime_reason || null, created_by || null, null];
    let placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?'];

    if (data.sector !== 'education') {
        columns.push('project_id');
        values.push(project_id || null);
        placeholders.push('?');
    }

    if (['it', 'manufacturing', 'hotel'].includes(data.sector)) {
        columns.push('check_in', 'check_out', 'total_hours', 'work_mode');
        values.push(check_in || null, check_out || null, calculatedHours, work_mode || 'Office');
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

    if (['it', 'manufacturing', 'hotel'].includes(data.sector)) {
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

    // Hotel uses 'overtime_hours', others (Mfg, IT) use 'overtime_duration'
    const overtimeCol = filters.sector === 'hotel' ? 'overtime_hours' : 'overtime_duration';

    let query = `
        SELECT 
            w.id,
            w.name,
            w.role,
            ${filters.sector === 'hotel' ? 'w.employment_nature, w.primary_work_area, w.wage_type, w.monthly_salary, w.daily_wage, w.hourly_rate, w.overtime_rate,' : ''}
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
            COUNT(CASE WHEN a.status = 'CO' THEN 1 END) as CO,
            COUNT(CASE WHEN a.status = 'OD' THEN 1 END) as OD,
            COUNT(CASE WHEN a.status NOT IN ('week_off', 'holiday') THEN 1 END) as working_days,
            COUNT(a.id) as total_records,
            COALESCE(SUM(a.total_hours), 0) as total_hours_worked,
            COALESCE(SUM(a.${overtimeCol}), 0) as total_overtime_hours
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

    query += ` WHERE w.user_id = ? AND w.status = 'active'`;
    params.push(userId);

    query += ` GROUP BY w.id, w.name, w.role ${filters.sector === 'hotel' ? ', w.employment_nature, w.primary_work_area, w.wage_type, w.monthly_salary, w.daily_wage, w.hourly_rate, w.overtime_rate' : ''} ORDER BY w.name ASC`;

    const [rows] = await db.query(query, params);

    // Post-processing for Estimated Wages (Hotel Sector)
    if (filters.sector === 'hotel') {
        return rows.map(row => {
            let base_wage = 0;
            const present = parseFloat(row.present) + (parseFloat(row.half_day) * 0.5);

            if (row.wage_type === 'monthly') {
                // Approximate monthly to 30 days for estimation
                base_wage = (parseFloat(row.monthly_salary) / 30) * present;
            } else if (row.wage_type === 'daily') {
                base_wage = parseFloat(row.daily_wage) * present;
            } else if (row.wage_type === 'hourly') {
                base_wage = parseFloat(row.hourly_rate) * parseFloat(row.total_hours_worked);
            }

            const ot_wage = parseFloat(row.overtime_rate) * parseFloat(row.total_overtime_hours);
            return {
                ...row,
                base_wage: base_wage.toFixed(2),
                ot_wage: ot_wage.toFixed(2),
                estimated_total_wage: (base_wage + ot_wage).toFixed(2)
            };
        });
    }

    return rows;
};

const quickMark = async (data) => {
    const { attendance: TABLE_NAME, members: MEMBERS_TABLE } = getTables(data.sector);
    const { user_id, member_id, date, status, project_id, subject, note, permission_duration, permission_start_time, permission_end_time, permission_reason, overtime_duration, overtime_reason, updated_by, check_in, check_out, total_hours, work_mode } = data;

    // Hotel Sector: Get default shift if not provided
    let shift_id = data.shift_id || null;
    let final_total_hours = total_hours || 0;

    if (data.sector === 'hotel') {
        const [memberData] = await db.query(`
            SELECT m.default_shift_id, s.start_time, s.end_time 
            FROM ${MEMBERS_TABLE} m
            LEFT JOIN hotel_shifts s ON m.default_shift_id = s.id
            WHERE m.id = ?
        `, [member_id]);

        if (memberData.length > 0) {
            shift_id = shift_id || memberData[0].default_shift_id;

            // If marking present and no hours provided, use shift duration
            if (status === 'present' && !final_total_hours && memberData[0].start_time && memberData[0].end_time) {
                const start = new Date(`2000-01-01 ${memberData[0].start_time}`);
                let end = new Date(`2000-01-01 ${memberData[0].end_time}`);
                if (end < start) end.setDate(end.getDate() + 1); // Overnight shift
                final_total_hours = (end - start) / (1000 * 60 * 60);
            }
        }
    }

    // Find existing record for this member on this date
    let checkQuery = `SELECT id FROM ${TABLE_NAME} WHERE user_id = ? AND member_id = ? AND DATE(date) = ?`;
    const checkParams = [user_id, member_id, date];

    if (data.sector !== 'education') {
        if (project_id) {
            checkQuery += ' AND project_id = ?';
            checkParams.push(project_id);
        } else if (data.sector !== 'hotel') { // Hotel might have multiple records if unique constraint is just (member_id, date)
            checkQuery += ' AND project_id IS NULL';
        }
    }

    const [existing] = await db.query(checkQuery, checkParams);

    if (existing.length > 0) {
        // Update existing record
        let updateQuery = `UPDATE ${TABLE_NAME} SET status = COALESCE(?, status), note = COALESCE(?, note), updated_by = ?`;
        let updateParams = [status || null, note || null, updated_by || null];

        if (['it', 'manufacturing', 'hotel'].includes(data.sector)) {
            const overtimeField = data.sector === 'hotel' ? 'overtime_hours' : 'overtime_duration';
            const overtimeValue = data.sector === 'hotel' ? (overtime_duration || final_total_hours > 8 ? (final_total_hours - 8).toFixed(2) : 0) : (overtime_duration || null);

            updateQuery += `, subject = COALESCE(?, subject), check_in = COALESCE(?, check_in), check_out = COALESCE(?, check_out), total_hours = COALESCE(?, total_hours), work_mode = COALESCE(?, work_mode), shift_id = COALESCE(?, shift_id), 
                           permission_duration = COALESCE(?, permission_duration), permission_start_time = COALESCE(?, permission_start_time), permission_end_time = COALESCE(?, permission_end_time), permission_reason = COALESCE(?, permission_reason), 
                           ${overtimeField} = COALESCE(?, ${overtimeField}), overtime_reason = COALESCE(?, overtime_reason)`;

            updateParams.push(
                subject || null,
                check_in || null,
                check_out || null,
                final_total_hours || null,
                work_mode || null,
                shift_id,
                permission_duration || null,
                permission_start_time || null,
                permission_end_time || null,
                permission_reason || null,
                overtimeValue,
                overtime_reason || null
            );
        }

        updateQuery += ` WHERE id = ?`;
        updateParams.push(existing[0].id);

        await db.query(updateQuery, updateParams);
        return { id: existing[0].id, ...data, updated: true };
    } else {
        const fields = ['user_id', 'member_id', 'date', 'status', 'subject', 'note', 'created_by'];
        const vals = [user_id, member_id, date, status || 'present', subject || 'Daily Attendance', note || null, updated_by || null];

        if (data.sector !== 'education') {
            fields.push('project_id');
            vals.push(project_id || null);
        }

        if (['it', 'manufacturing', 'hotel'].includes(data.sector)) {
            const overtimeField = data.sector === 'hotel' ? 'overtime_hours' : 'overtime_duration';
            const overtimeValue = data.sector === 'hotel' ? (overtime_duration || final_total_hours > 8 ? (final_total_hours - 8).toFixed(2) : 0) : (overtime_duration || null);

            fields.push('check_in', 'check_out', 'total_hours', 'work_mode', 'shift_id', 'permission_duration', 'permission_start_time', 'permission_end_time', 'permission_reason', overtimeField, 'overtime_reason');
            vals.push(
                check_in || null,
                check_out || null,
                final_total_hours || 0,
                work_mode || 'Office',
                shift_id,
                permission_duration || null,
                permission_start_time || null,
                permission_end_time || null,
                permission_reason || null,
                overtimeValue,
                overtime_reason || null
            );
        }

        const placeholders = fields.map(() => '?').join(', ');
        const [result] = await db.query(`INSERT INTO ${TABLE_NAME} (${fields.join(', ')}) VALUES (${placeholders})`, vals);
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

const getHolidays = async (userId, sector) => {
    const table = sector === 'it' ? 'it_holidays' : (sector === 'hotel' ? 'hotel_holidays' : 'manufacturing_holidays');
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY date`, [userId]);
        return rows;
    } catch (e) { return []; }
};

const createHoliday = async (data) => {
    const table = data.sector === 'it' ? 'it_holidays' : (data.sector === 'hotel' ? 'hotel_holidays' : 'manufacturing_holidays');
    const { user_id, name, date, type } = data;
    const [result] = await db.execute(
        `INSERT INTO ${table} (user_id, name, date, type) VALUES (?, ?, ?, ?)`,
        [user_id, name, date, type || 'National']
    );
    return { id: result.insertId, ...data };
};

const deleteHoliday = async (id, userId, sector) => {
    const table = sector === 'it' ? 'it_holidays' : (sector === 'hotel' ? 'hotel_holidays' : 'manufacturing_holidays');
    const [result] = await db.execute(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

const getShifts = async (userId, sector) => {
    const table = sector === 'it' ? 'it_shifts' : (sector === 'hotel' ? 'hotel_shifts' : 'manufacturing_shifts');
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ?`, [userId]);
        return rows;
    } catch (e) { return []; }
};

const createShift = async (data) => {
    const table = data.sector === 'it' ? 'it_shifts' : (data.sector === 'hotel' ? 'hotel_shifts' : 'manufacturing_shifts');
    const { user_id, name, start_time, end_time, break_duration, is_default } = data;

    if (is_default) {
        await db.execute(`UPDATE ${table} SET is_default = 0 WHERE user_id = ?`, [user_id]);
    }

    const [result] = await db.execute(
        `INSERT INTO ${table} (user_id, name, start_time, end_time, break_duration, is_default) VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, name, start_time, end_time, break_duration || 60, is_default || 0]
    );
    return { id: result.insertId, ...data };
};

const deleteShift = async (id, userId, sector) => {
    const table = sector === 'it' ? 'it_shifts' : (sector === 'hotel' ? 'hotel_shifts' : 'manufacturing_shifts');
    const [result] = await db.execute(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
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
    bulkMark,
    getHolidays,
    createHoliday,
    deleteHoliday,
    getShifts,
    createShift,
    deleteShift
};
