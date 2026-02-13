const db = require('../config/db');

// --- SECTOR CONFIGURATIONS (for Holiday/Shift Management) ---
const TABLE_MAP = {
    it: { holidays: 'it_holidays', shifts: 'it_shifts' },
    manufacturing: { holidays: 'manufacturing_holidays', shifts: 'manufacturing_shifts' },
    hotel: { holidays: 'hotel_holidays', shifts: 'hotel_shifts' },
    education: { holidays: 'education_holidays', shifts: 'education_shifts' }
};

const getTables = (sector) => TABLE_MAP[sector] || TABLE_MAP.manufacturing;

// --- CALCULATION HELPERS ---
const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [h1, m1] = checkIn.split(':').map(Number);
    const [h2, m2] = checkOut.split(':').map(Number);
    let start = h1 * 60 + m1;
    let end = h2 * 60 + m2;
    if (end < start) end += 24 * 60; // Crosses midnight
    return Number(((end - start) / 60).toFixed(2));
};

// --- CONFLICT CHECKING ---
const checkConflict = async (db, table, userId, memberId, date, startTime, endTime) => {
    if (!startTime || !endTime) {
        const [rows] = await db.query(`SELECT id FROM ${table} WHERE user_id = ? AND member_id = ? AND DATE(date) = ?`, [userId, memberId, date]);
        return rows.length > 0;
    }
    const [rows] = await db.query(`SELECT id, check_in, check_out FROM ${table} WHERE user_id = ? AND member_id = ? AND DATE(date) = ?`, [userId, memberId, date]);
    for (const row of rows) {
        if (!row.check_in || !row.check_out) return true;
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

const findById = async (id, sector) => {
    const tables = getTables(sector);
    const attendanceTable = sector === 'hotel' ? 'hotel_attendance' :
        sector === 'it' ? 'it_attendance' :
            sector === 'education' ? 'education_attendance' :
                'manufacturing_attendance';
    const [rows] = await db.query(`SELECT * FROM ${attendanceTable} WHERE id = ?`, [id]);
    return rows[0];
};

const getAllByUserId = async (userId, filters = {}) => {
    return getSectorModel(filters.sector).getAll(userId, filters);
};

const update = async (id, userId, data) => {
    return getSectorModel(data.sector).update(id, userId, data);
};

const deleteResult = async (id, userId, sector) => {
    return getSectorModel(sector).delete(id, userId);
};

const getStats = async (userId, filters = {}) => {
    return getSectorModel(filters.sector).getStats(userId, filters);
};

const getMemberSummary = async (userId, filters = {}) => {
    return getSectorModel(filters.sector).getSummary(userId, filters);
};

// --- SECTOR SPECIFIC LOGIC SECTIONS ---

// --- HOTEL SECTOR ---
const HotelAttendanceModel = {
    create: async (data) => {
        const { user_id, subject, status, date, note, project_id, member_id, created_by, check_in, check_out, total_hours, work_mode } = data;
        let calcHours = total_hours || (check_in && check_out ? calculateDuration(check_in, check_out) : 0);

        const isConflict = await checkConflict(db, 'hotel_attendance', user_id, member_id, date, check_in, check_out);
        if (isConflict) throw new Error("Attendance overlap detected.");

        const overtime = calcHours > 8 ? (calcHours - 8).toFixed(2) : 0;

        const [res] = await db.query(
            `INSERT INTO hotel_attendance (user_id, subject, status, date, note, member_id, project_id, check_in, check_out, total_hours, work_mode, overtime_hours, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, subject || 'Shift Duty', status, date, note, member_id, project_id, check_in, check_out, calcHours, work_mode, overtime, created_by]
        );
        return { id: res.insertId, ...data };
    },

    update: async (id, userId, data) => {
        const { status, date, note, project_id, check_in, check_out, total_hours, work_mode, updated_by } = data;
        const calcHours = total_hours || (check_in && check_out ? calculateDuration(check_in, check_out) : 0);
        const overtime = calcHours > 8 ? (calcHours - 8).toFixed(2) : 0;

        const [res] = await db.query(
            `UPDATE hotel_attendance SET status=?, date=?, note=?, project_id=?, check_in=?, check_out=?, total_hours=?, work_mode=?, overtime_hours=?, updated_by=? WHERE id=? AND user_id=?`,
            [status, date, note, project_id, check_in, check_out, calcHours, work_mode, overtime, updated_by, id, userId]
        );
        return res.affectedRows > 0;
    },

    delete: async (id, userId) => {
        const [res] = await db.query(`DELETE FROM hotel_attendance WHERE id = ? AND user_id = ?`, [id, userId]);
        return res.affectedRows > 0;
    },

    getAll: async (userId, filters) => {
        let query = `SELECT a.*, p.name as project_name, w.name as member_name, w.role as member_role, 
                     w.employment_nature, w.primary_work_area, w.wage_type, w.monthly_salary, w.daily_wage, w.hourly_rate, w.overtime_rate
                     FROM hotel_attendance a 
                     LEFT JOIN hotel_projects p ON a.project_id = p.id
                     LEFT JOIN hotel_members w ON a.member_id = w.id 
                     WHERE a.user_id = ?`;
        const params = [userId];
        if (filters.projectId) { query += ' AND a.project_id = ?'; params.push(filters.projectId); }
        if (filters.memberId) { query += ' AND a.member_id = ?'; params.push(filters.memberId); }
        if (filters.period) { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        query += ' ORDER BY a.date DESC';
        const [rows] = await db.query(query, params);
        return rows;
    },

    getStats: async (userId, filters) => {
        let query = `SELECT status, COUNT(*) as count FROM hotel_attendance WHERE user_id=?`;
        const params = [userId];
        if (filters.period) { query += " AND DATE_FORMAT(date, '%Y-%m') = ?"; params.push(filters.period); }
        query += ` GROUP BY status`;
        const [rows] = await db.query(query, params);
        return rows;
    },

    getSummary: async (userId, filters) => {
        let query = `
            SELECT w.id, w.name, w.role, w.wage_type, w.monthly_salary, w.daily_wage, w.hourly_rate, w.overtime_rate,
            COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) as present,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
            COALESCE(SUM(a.total_hours), 0) as total_hours_worked,
            COALESCE(SUM(a.overtime_hours), 0) as total_overtime_hours
            FROM hotel_members w
            LEFT JOIN hotel_attendance a ON w.id = a.member_id AND a.user_id = ?`;
        const params = [userId];
        if (filters.period) {
            if (filters.period.length > 7) { query += ' AND DATE(a.date) = ?'; params.push(filters.period); }
            else { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        } else if (filters.startDate && filters.endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(filters.startDate, filters.endDate);
        }
        query += ` WHERE w.user_id = ? AND w.status = 'active' GROUP BY w.id`;
        params.push(userId);
        const [rows] = await db.query(query, params);
        return HotelAttendanceModel.calculateWages(rows);
    },

    calculateWages: (rows) => {
        return rows.map(row => {
            let base = 0;
            const pres = parseFloat(row.present || 0);
            if (row.wage_type === 'monthly') base = (parseFloat(row.monthly_salary || 0) / 30) * pres;
            else if (row.wage_type === 'daily') base = parseFloat(row.daily_wage || 0) * pres;
            else if (row.wage_type === 'hourly') base = parseFloat(row.hourly_rate || 0) * parseFloat(row.total_hours_worked || 0);
            const ot = parseFloat(row.overtime_rate || 0) * parseFloat(row.total_overtime_hours || 0);
            return { ...row, base_wage: base.toFixed(2), ot_wage: ot.toFixed(2), estimated_total_wage: (base + ot).toFixed(2) };
        });
    },

    quickMark: async (data) => {
        const { user_id, member_id, date, status, updated_by } = data;
        let { check_in, check_out, total_hours, shift_id } = data;

        // Get default shift if not provided and status is present
        if (status === 'present' && (!shift_id || !total_hours)) {
            const [m] = await db.query(`SELECT default_shift_id FROM hotel_members WHERE id = ?`, [member_id]);
            if (m.length > 0 && m[0].default_shift_id) {
                shift_id = shift_id || m[0].default_shift_id;
                const [s] = await db.query(`SELECT start_time, end_time FROM hotel_shifts WHERE id = ?`, [shift_id]);
                if (s.length > 0 && !total_hours) {
                    const start = new Date(`2000-01-01 ${s[0].start_time}`);
                    let end = new Date(`2000-01-01 ${s[0].end_time}`);
                    if (end < start) end.setDate(end.getDate() + 1);
                    total_hours = (end - start) / (1000 * 60 * 60);
                    check_in = s[0].start_time;
                    check_out = s[0].end_time;
                }
            }
        }

        const [existing] = await db.query(`SELECT id FROM hotel_attendance WHERE user_id=? AND member_id=? AND DATE(date)=?`, [user_id, member_id, date]);
        if (existing.length > 0) {
            const ot = (total_hours || 0) > 8 ? (total_hours - 8).toFixed(2) : 0;
            await db.query(`UPDATE hotel_attendance SET status=?, check_in=?, check_out=?, total_hours=?, overtime_hours=?, updated_by=? WHERE id=?`, [status, check_in || null, check_out || null, total_hours || 0, ot, updated_by, existing[0].id]);
            return { id: existing[0].id, updated: true };
        }
        return HotelAttendanceModel.create({ ...data, check_in, check_out, total_hours, created_by: updated_by });
    }
};

// --- MANUFACTURING SECTOR ---
const ManufacturingAttendanceModel = {
    create: async (data) => {
        const { user_id, status, date, member_id, project_id, created_by } = data;
        const [res] = await db.query(
            `INSERT INTO manufacturing_attendance (user_id, status, date, member_id, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, status, date, member_id, project_id, created_by]
        );
        return { id: res.insertId, ...data };
    },

    update: async (id, userId, data) => {
        const { status, date, project_id, updated_by } = data;
        const [res] = await db.query(`UPDATE manufacturing_attendance SET status=?, date=?, project_id=?, updated_by=? WHERE id=? AND user_id=?`, [status, date, project_id, updated_by, id, userId]);
        return res.affectedRows > 0;
    },

    delete: async (id, userId) => {
        const [res] = await db.query(`DELETE FROM manufacturing_attendance WHERE id = ? AND user_id = ?`, [id, userId]);
        return res.affectedRows > 0;
    },

    getAll: async (userId, filters) => {
        let query = `SELECT a.*, w.name as member_name FROM manufacturing_attendance a LEFT JOIN manufacturing_members w ON a.member_id = w.id WHERE a.user_id = ?`;
        const params = [userId];
        if (filters.memberId) { query += ' AND a.member_id = ?'; params.push(filters.memberId); }
        if (filters.period) { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        query += ' ORDER BY a.date DESC';
        const [rows] = await db.query(query, params);
        return rows;
    },

    getStats: async (userId, filters) => {
        let query = `SELECT status, COUNT(*) as count FROM manufacturing_attendance WHERE user_id=?`;
        const params = [userId];
        if (filters.period) { query += " AND DATE_FORMAT(date, '%Y-%m') = ?"; params.push(filters.period); }
        query += ` GROUP BY status`;
        const [rows] = await db.query(query, params);
        return rows;
    },

    getSummary: async (userId, filters) => {
        let query = `SELECT w.id, w.name, COUNT(a.id) as total_records,
            COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) as present,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
            FROM manufacturing_members w LEFT JOIN manufacturing_attendance a ON w.id = a.member_id AND a.user_id = ?`;
        const params = [userId];
        if (filters.period) {
            if (filters.period.length > 7) { query += ' AND DATE(a.date) = ?'; params.push(filters.period); }
            else { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        } else if (filters.startDate && filters.endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(filters.startDate, filters.endDate);
        }
        query += ` WHERE w.user_id=? AND w.status = 'active' GROUP BY w.id`;
        params.push(userId);
        const [rows] = await db.query(query, params);
        return rows;
    },

    quickMark: async (data) => {
        const { user_id, member_id, date, status, updated_by } = data;
        const [existing] = await db.query(`SELECT id FROM manufacturing_attendance WHERE user_id=? AND member_id=? AND DATE(date)=?`, [user_id, member_id, date]);
        if (existing.length > 0) {
            await db.query(`UPDATE manufacturing_attendance SET status=?, updated_by=? WHERE id=?`, [status, updated_by, existing[0].id]);
            return { id: existing[0].id, updated: true };
        }
        return ManufacturingAttendanceModel.create({ ...data, created_by: updated_by });
    }
};

// --- IT SECTOR ---
const ITAttendanceModel = {
    create: async (data) => {
        const { user_id, status, date, member_id, project_id, created_by } = data;
        const [res] = await db.query(
            `INSERT INTO it_attendance (user_id, status, date, member_id, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, status, date, member_id, project_id, created_by]
        );
        return { id: res.insertId, ...data };
    },

    update: async (id, userId, data) => {
        const { status, date, project_id, updated_by } = data;
        const [res] = await db.query(`UPDATE it_attendance SET status=?, date=?, project_id=?, updated_by=? WHERE id=? AND user_id=?`, [status, date, project_id, updated_by, id, userId]);
        return res.affectedRows > 0;
    },

    delete: async (id, userId) => {
        const [res] = await db.query(`DELETE FROM it_attendance WHERE id = ? AND user_id = ?`, [id, userId]);
        return res.affectedRows > 0;
    },

    getAll: async (userId, filters) => {
        let query = `SELECT a.*, w.name as member_name FROM it_attendance a LEFT JOIN it_members w ON a.member_id = w.id WHERE a.user_id = ?`;
        const params = [userId];
        if (filters.memberId) { query += ' AND a.member_id = ?'; params.push(filters.memberId); }
        if (filters.period) { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        query += ' ORDER BY a.date DESC';
        const [rows] = await db.query(query, params);
        return rows;
    },

    getStats: async (userId, filters) => {
        let query = `SELECT status, COUNT(*) as count FROM it_attendance WHERE user_id=?`;
        const params = [userId];
        if (filters.period) { query += " AND DATE_FORMAT(date, '%Y-%m') = ?"; params.push(filters.period); }
        query += ` GROUP BY status`;
        const [rows] = await db.query(query, params);
        return rows;
    },

    getSummary: async (userId, filters) => {
        let query = `SELECT w.id, w.name, COUNT(a.id) as total_records,
            COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) as present,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
            FROM it_members w LEFT JOIN it_attendance a ON w.id = a.member_id AND a.user_id = ?`;
        const params = [userId];
        if (filters.period) {
            if (filters.period.length > 7) { query += ' AND DATE(a.date) = ?'; params.push(filters.period); }
            else { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        } else if (filters.startDate && filters.endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(filters.startDate, filters.endDate);
        }
        query += ` WHERE w.user_id=? AND w.status = 'active' GROUP BY w.id`;
        params.push(userId);
        const [rows] = await db.query(query, params);
        return rows;
    },

    quickMark: async (data) => {
        const { user_id, member_id, date, status, updated_by } = data;
        const [existing] = await db.query(`SELECT id FROM it_attendance WHERE user_id=? AND member_id=? AND DATE(date)=?`, [user_id, member_id, date]);
        if (existing.length > 0) {
            await db.query(`UPDATE it_attendance SET status=?, updated_by=? WHERE id=?`, [status, updated_by, existing[0].id]);
            return { id: existing[0].id, updated: true };
        }
        return ITAttendanceModel.create({ ...data, created_by: updated_by });
    }
};

// --- EDUCATION SECTOR ---
const EducationAttendanceModel = {
    create: async (data) => {
        const { user_id, status, date, member_id, created_by, note } = data;

        // Validation: Check for duplicate
        const [existing] = await db.query(`SELECT id FROM education_attendance WHERE user_id=? AND member_id=? AND DATE(date)=?`, [user_id, member_id, date]);
        if (existing.length > 0) {
            throw new Error("Attendance already marked for this date");
        }

        const [res] = await db.query(
            `INSERT INTO education_attendance (user_id, status, date, member_id, note, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, status, date, member_id, note, created_by]
        );
        return { id: res.insertId, ...data };
    },

    update: async (id, userId, data) => {
        const { status, date, note, updated_by } = data;
        const [res] = await db.query(`UPDATE education_attendance SET status=?, date=?, note=?, updated_by=? WHERE id=? AND user_id=?`, [status, date, note, updated_by, id, userId]);
        return res.affectedRows > 0;
    },

    delete: async (id, userId) => {
        const [res] = await db.query(`DELETE FROM education_attendance WHERE id = ? AND user_id = ?`, [id, userId]);
        return res.affectedRows > 0;
    },

    getAll: async (userId, filters) => {
        let query = `SELECT a.*, w.name as member_name FROM education_attendance a LEFT JOIN education_members w ON a.member_id = w.id WHERE a.user_id = ?`;
        const params = [userId];
        if (filters.memberId) { query += ' AND a.member_id = ?'; params.push(filters.memberId); }
        if (filters.period) {
            if (filters.period.length > 7) { query += ' AND DATE(a.date) = ?'; params.push(filters.period); }
            else { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        } else if (filters.startDate && filters.endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(filters.startDate, filters.endDate);
        }
        query += ' ORDER BY a.date DESC';
        const [rows] = await db.query(query, params);
        return rows;
    },

    getStats: async (userId, filters) => {
        let query = `SELECT status, COUNT(*) as count FROM education_attendance WHERE user_id=?`;
        const params = [userId];
        if (filters.memberId) { query += ' AND member_id = ?'; params.push(filters.memberId); }
        if (filters.period) {
            if (filters.period.length > 7) { query += ' AND DATE(date) = ?'; params.push(filters.period); }
            else { query += " AND DATE_FORMAT(date, '%Y-%m') = ?"; params.push(filters.period); }
        } else if (filters.startDate && filters.endDate) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(filters.startDate, filters.endDate);
        }
        query += ` GROUP BY status`;
        const [rows] = await db.query(query, params);
        return rows;
    },

    getSummary: async (userId, filters) => {
        let query = `SELECT w.id, w.name, COUNT(a.id) as total,
            SUM(CASE WHEN a.status IN ('present', 'late', 'permission') THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN a.status = 'half-day' THEN 1 ELSE 0 END) as half_day,
            SUM(CASE WHEN a.status = 'CL' THEN 1 ELSE 0 END) as CL,
            SUM(CASE WHEN a.status = 'SL' THEN 1 ELSE 0 END) as SL,
            SUM(CASE WHEN a.status = 'EL' THEN 1 ELSE 0 END) as EL,
            SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as OD
            FROM education_members w LEFT JOIN education_attendance a ON w.id = a.member_id AND a.user_id = ?`;
        const params = [userId];
        if (filters.period) {
            if (filters.period.length > 7) { query += ' AND DATE(a.date) = ?'; params.push(filters.period); }
            else { query += " AND DATE_FORMAT(a.date, '%Y-%m') = ?"; params.push(filters.period); }
        } else if (filters.startDate && filters.endDate) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(filters.startDate, filters.endDate);
        }
        query += ` WHERE w.user_id=? GROUP BY w.id`;
        params.push(userId);
        const [rows] = await db.query(query, params);
        return rows;
    },

    quickMark: async (data) => {
        const { user_id, member_id, date, status, updated_by } = data;
        const [existing] = await db.query(`SELECT id FROM education_attendance WHERE user_id=? AND member_id=? AND DATE(date)=?`, [user_id, member_id, date]);
        if (existing.length > 0) {
            await db.query(`UPDATE education_attendance SET status=?, updated_by=? WHERE id=?`, [status, updated_by, existing[0].id]);
            return { id: existing[0].id, updated: true };
        }
        return EducationAttendanceModel.create({ ...data, created_by: updated_by });
    }
};

// --- DISPATCHER HELPERS ---
const getSectorModel = (sector) => {
    switch (sector) {
        case 'hotel': return HotelAttendanceModel;
        case 'it': return ITAttendanceModel;
        case 'education': return EducationAttendanceModel;
        default: return ManufacturingAttendanceModel;
    }
};

// --- CORE ATTENDANCE FUNCTIONS (DISPATCHERS) ---
const create = async (data) => {
    return getSectorModel(data.sector).create(data);
};

const quickMark = async (data) => {
    return getSectorModel(data.sector).quickMark(data);
};

const bulkMark = async (data) => {
    const { user_id, member_ids, date, status, sector, updated_by } = data;
    if (!member_ids || member_ids.length === 0) return { count: 0 };
    const model = getSectorModel(sector);
    const promises = member_ids.map(mid => model.quickMark({ user_id, member_id: mid, date, status, sector, updated_by }));
    await Promise.all(promises);
    return { count: member_ids.length };
};

// --- HOLIDAY MANAGEMENT ---
const getHolidays = async (userId, sector) => {
    const { holidays: table } = getTables(sector);
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY date`, [userId]);
        return rows;
    } catch (e) { return []; }
};

const createHoliday = async (data) => {
    const { holidays: table } = getTables(data.sector);
    const { user_id, name, date, type } = data;
    const [result] = await db.execute(
        `INSERT INTO ${table} (user_id, name, date, type) VALUES (?, ?, ?, ?)`,
        [user_id, name, date, type || 'National']
    );
    return { id: result.insertId, ...data };
};

const deleteHoliday = async (id, userId, sector) => {
    const { holidays: table } = getTables(sector);
    const [result] = await db.execute(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
    return result.affectedRows > 0;
};

// --- SHIFT MANAGEMENT ---
const getShifts = async (userId, sector) => {
    const { shifts: table } = getTables(sector);
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ?`, [userId]);
        return rows;
    } catch (e) { return []; }
};

const createShift = async (data) => {
    const { shifts: table } = getTables(data.sector);
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
    const { shifts: table } = getTables(sector);
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
