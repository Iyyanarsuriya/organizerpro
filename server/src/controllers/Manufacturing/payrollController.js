// ============================================
// MANUFACTURING PAYROLL CONTROLLER
// Handles wage calculation and payroll management
// Date: February 2, 2026
// ============================================

const db = require('../../config/db');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get payroll settings for a user
 */
const getPayrollSettings = async (userId) => {
    const [settings] = await db.query(
        'SELECT * FROM manufacturing_payroll_settings WHERE user_id = ?',
        [userId]
    );

    if (settings.length === 0) {
        // Return default settings
        return {
            working_days_per_month: 26,
            working_hours_per_day: 8,
            working_hours_per_month: 208,
            overtime_multiplier: 1.5,
            auto_deduct_advances: true,
            advance_deduction_percentage: 100,
            expense_approval_threshold: 10000,
            payroll_requires_approval: true
        };
    }

    return settings[0];
};

/**
 * Get attendance summary for a member for a specific month
 */
const getAttendanceSummary = async (memberId, month, year, userId) => {
    // Fetch all attendance records for the month
    const [records] = await db.query(`
        SELECT status, overtime_duration
        FROM manufacturing_attendance
        WHERE member_id = ?
        AND MONTH(date) = ?
        AND YEAR(date) = ?
        AND user_id = ?
    `, [memberId, month, year, userId]);

    const summary = {
        days_present: 0,
        days_absent: 0,
        days_half: 0,
        days_leave: 0,
        days_holiday: 0,
        days_weekend: 0,
        overtime_hours: 0
    };

    records.forEach(record => {
        const { status, overtime_duration } = record;

        // Count status
        if (status === 'present') summary.days_present++;
        else if (status === 'absent') summary.days_absent++;
        else if (status === 'half_day') summary.days_half++;
        else if (['CL', 'SL', 'EL'].includes(status)) summary.days_leave++;
        else if (status === 'holiday') summary.days_holiday++;
        else if (status === 'week_off') summary.days_weekend++;

        // Parse overtime
        // Handles formats like: "2", "2.5", "2 hours", "02:30" (simplified to hours)
        if (overtime_duration) {
            const str = overtime_duration.toString();
            // Check for HH:MM format first
            if (str.includes(':')) {
                const [hours, minutes] = str.split(':').map(Number);
                if (!isNaN(hours)) {
                    summary.overtime_hours += hours + (isNaN(minutes) ? 0 : minutes / 60);
                }
            } else {
                // Check for numeric value
                const match = str.match(/(\d+(\.\d+)?)/);
                if (match) {
                    summary.overtime_hours += parseFloat(match[0]);
                }
            }
        }
    });

    return summary;
};

/**
 * Get active advances for a member
 */
const getActiveAdvances = async (memberId, userId) => {
    const [advances] = await db.query(`
        SELECT id, balance, monthly_deduction
        FROM manufacturing_advances
        WHERE member_id = ?
        AND user_id = ?
        AND status = 'active'
        AND balance > 0
    `, [memberId, userId]);

    return advances;
};

/**
 * Get work log earnings for a member for a specific month
 */
const getWorkLogEarnings = async (memberId, month, year, userId) => {
    const [result] = await db.query(`
        SELECT SUM(total_amount) as total
        FROM manufacturing_work_logs
        WHERE member_id = ?
        AND MONTH(date) = ?
        AND YEAR(date) = ?
        AND user_id = ?
    `, [memberId, month, year, userId]);

    return result[0].total || 0;
};

/**
 * Calculate wage for a member
 */
const calculateWage = async (member, attendanceSummary, settings) => {
    const { wage_type, daily_wage } = member;
    const { days_present, days_half, overtime_hours } = attendanceSummary;

    let baseAmount = 0;
    let overtimeAmount = 0;

    if (wage_type === 'daily') {
        // Daily wage calculation
        baseAmount = (days_present * daily_wage) + (days_half * daily_wage * 0.5);

        // Overtime: hourly rate × hours × multiplier
        const hourlyRate = daily_wage / settings.working_hours_per_day;
        overtimeAmount = overtime_hours * hourlyRate * settings.overtime_multiplier;

    } else if (wage_type === 'piece_rate') {
        // Piece Rate calculation (Sum of work logs)
        // For piece_rate, baseAmount comes seamlessly from work logs
        // We can pass the pre-calculated workLogTotal here
        baseAmount = member.workLogTotal || 0;

        // Overtime for piece rate? 
        // Usually piece rate workers don't get OT hours, but if they do, 
        // valid logic might be needed. For now, we assume 0 or standard calculation if specific rate provided.
        // If daily_wage is set as a "base rate" for OT calc:
        if (daily_wage > 0) {
            const hourlyRate = daily_wage / settings.working_hours_per_day;
            overtimeAmount = overtime_hours * hourlyRate * settings.overtime_multiplier;
        }

    } else if (wage_type === 'monthly') {
        // Monthly salary calculation
        const monthlySalary = daily_wage; // For monthly, daily_wage stores monthly salary
        const perDayDeduction = monthlySalary / settings.working_days_per_month;

        baseAmount = monthlySalary - (attendanceSummary.days_absent * perDayDeduction);

        // Overtime: hourly rate × hours × multiplier
        const hourlyRate = monthlySalary / settings.working_hours_per_month;
        overtimeAmount = overtime_hours * hourlyRate * settings.overtime_multiplier;
    }

    const grossAmount = baseAmount + overtimeAmount;

    return {
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
        grossAmount: parseFloat(grossAmount.toFixed(2))
    };
};

// ============================================
// MAIN CONTROLLER FUNCTIONS
// ============================================

/**
 * Generate payroll for a specific month
 */
const generateMonthlyPayroll = async (req, res) => {
    try {
        const { month, year } = req.body;
        const userId = req.user.data_owner_id;
        const username = req.user.username;

        // Validate month and year
        if (!month || !year || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month or year'
            });
        }

        // Check if payroll already exists for this month
        const [existing] = await db.query(`
            SELECT COUNT(*) as count
            FROM manufacturing_payroll
            WHERE month = ? AND year = ? AND user_id = ?
        `, [month, year, userId]);

        if (existing[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Payroll for ${month}/${year} already exists. Delete existing payroll first.`
            });
        }

        // Get payroll settings
        const settings = await getPayrollSettings(userId);

        // Get all active members
        const [members] = await db.query(`
            SELECT id, name, role, wage_type, daily_wage, project_id
            FROM manufacturing_members
            WHERE user_id = ?
            AND status = 'active'
        `, [userId]);

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active members found'
            });
        }

        const payrollRecords = [];

        // Calculate payroll for each member
        for (const member of members) {
            // Get attendance summary
            const attendanceSummary = await getAttendanceSummary(
                member.id, month, year, userId
            );

            // Get work log earnings (for piece_rate)
            const workLogTotal = await getWorkLogEarnings(member.id, month, year, userId);

            // Calculate wage
            // Pass workLogTotal to the member object temporarily for calculation
            const memberForCalc = { ...member, workLogTotal };

            const { baseAmount, overtimeAmount, grossAmount } = await calculateWage(
                memberForCalc, attendanceSummary, settings
            );

            // Get active advances
            const advances = await getActiveAdvances(member.id, userId);
            let advanceDeducted = 0;

            if (settings.auto_deduct_advances && advances.length > 0) {
                for (const advance of advances) {
                    advanceDeducted += advance.monthly_deduction || 0;
                }
            }

            const totalDeductions = advanceDeducted;
            const netAmount = grossAmount - totalDeductions;

            // Insert payroll record
            const [result] = await db.query(`
                INSERT INTO manufacturing_payroll (
                    member_id, month, year,
                    days_present, days_absent, days_half, days_leave,
                    days_holiday, days_weekend, overtime_hours,
                    base_amount, overtime_amount, gross_amount,
                    advance_deducted, total_deductions, net_amount,
                    status, project_id, user_id, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                member.id, month, year,
                attendanceSummary.days_present,
                attendanceSummary.days_absent,
                attendanceSummary.days_half,
                attendanceSummary.days_leave,
                attendanceSummary.days_holiday,
                attendanceSummary.days_weekend,
                attendanceSummary.overtime_hours,
                baseAmount, overtimeAmount, grossAmount,
                advanceDeducted, totalDeductions, netAmount,
                'draft', member.project_id, userId, username
            ]);

            payrollRecords.push({
                payrollId: result.insertId,
                memberId: member.id,
                memberName: member.name,
                netAmount
            });
        }

        res.status(201).json({
            success: true,
            message: `Payroll generated for ${members.length} members`,
            data: {
                month,
                year,
                totalRecords: payrollRecords.length,
                records: payrollRecords
            }
        });

    } catch (error) {
        console.error('Generate payroll error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get payroll list
 */
const getPayrollList = async (req, res) => {
    try {
        const { month, year, status, member_id } = req.query;
        const userId = req.user.data_owner_id;

        let query = `
            SELECT 
                p.*,
                m.name as member_name,
                m.role as member_role,
                m.wage_type,
                proj.name as project_name
            FROM manufacturing_payroll p
            LEFT JOIN manufacturing_members m ON p.member_id = m.id
            LEFT JOIN manufacturing_projects proj ON p.project_id = proj.id
            WHERE p.user_id = ?
        `;

        const params = [userId];

        if (month) {
            query += ' AND p.month = ?';
            params.push(month);
        }

        if (year) {
            query += ' AND p.year = ?';
            params.push(year);
        }

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        if (member_id) {
            query += ' AND p.member_id = ?';
            params.push(member_id);
        }

        query += ' ORDER BY p.year DESC, p.month DESC, m.name ASC';

        const [payrolls] = await db.query(query, params);

        res.status(200).json({
            success: true,
            data: payrolls
        });

    } catch (error) {
        console.error('Get payroll list error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get payroll details by ID
 */
const getPayrollDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.data_owner_id;

        const [payrolls] = await db.query(`
            SELECT 
                p.*,
                m.name as member_name,
                m.role as member_role,
                m.phone as member_phone,
                m.wage_type,
                m.daily_wage,
                proj.name as project_name,
                e.id as expense_id,
                e.title as expense_title
            FROM manufacturing_payroll p
            LEFT JOIN manufacturing_members m ON p.member_id = m.id
            LEFT JOIN manufacturing_projects proj ON p.project_id = proj.id
            LEFT JOIN manufacturing_transactions e ON p.expense_id = e.id
            WHERE p.id = ? AND p.user_id = ?
        `, [id, userId]);

        if (payrolls.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        res.status(200).json({
            success: true,
            data: payrolls[0]
        });

    } catch (error) {
        console.error('Get payroll details error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Approve payroll and auto-generate expense
 */
const approvePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.data_owner_id;
        const username = req.user.username;

        // Get payroll details
        const [payrolls] = await db.query(`
            SELECT p.*, m.name as member_name, m.wage_type
            FROM manufacturing_payroll p
            LEFT JOIN manufacturing_members m ON p.member_id = m.id
            WHERE p.id = ? AND p.user_id = ?
        `, [id, userId]);

        if (payrolls.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        const payroll = payrolls[0];

        if (payroll.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Payroll is already ${payroll.status}`
            });
        }

        // Auto-generate expense entry
        const expenseTitle = `${payroll.wage_type === 'monthly' ? 'Salary' : 'Wages'} - ${payroll.member_name} - ${payroll.month}/${payroll.year}`;
        const expenseCategory = payroll.wage_type === 'monthly' ? 'Salary' : 'Wages';

        const [expenseResult] = await db.query(`
            INSERT INTO manufacturing_transactions (
                title, amount, type, category, date,
                member_id, project_id, payroll_id,
                payment_mode, payment_status, auto_generated,
                user_id
            ) VALUES (?, ?, 'expense', ?, LAST_DAY(CONCAT(?, '-', ?, '-01')), ?, ?, ?, 'bank', 'unpaid', TRUE, ?)
        `, [
            expenseTitle,
            payroll.net_amount,
            expenseCategory,
            payroll.year,
            payroll.month,
            payroll.member_id,
            payroll.project_id,
            payroll.id,
            userId
        ]);

        // Update payroll status
        await db.query(`
            UPDATE manufacturing_payroll
            SET status = 'approved',
                expense_id = ?,
                approved_by = ?,
                approved_at = NOW()
            WHERE id = ?
        `, [expenseResult.insertId, username, id]);

        // Update advance balances
        if (payroll.advance_deducted > 0) {
            await db.query(`
                UPDATE manufacturing_advances
                SET total_deducted = total_deducted + monthly_deduction,
                    balance = balance - monthly_deduction,
                    status = CASE WHEN balance - monthly_deduction <= 0 THEN 'fully_paid' ELSE 'active' END
                WHERE member_id = ?
                AND user_id = ?
                AND status = 'active'
            `, [payroll.member_id, userId]);
        }

        res.status(200).json({
            success: true,
            message: 'Payroll approved and expense created',
            data: {
                payrollId: id,
                expenseId: expenseResult.insertId
            }
        });

    } catch (error) {
        console.error('Approve payroll error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete payroll (only if draft)
 */
const deletePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.data_owner_id;

        // Check if payroll exists and is draft
        const [payrolls] = await db.query(`
            SELECT status FROM manufacturing_payroll
            WHERE id = ? AND user_id = ?
        `, [id, userId]);

        if (payrolls.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        if (payrolls[0].status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete approved/paid payroll'
            });
        }

        await db.query('DELETE FROM manufacturing_payroll WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Payroll deleted'
        });

    } catch (error) {
        console.error('Delete payroll error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete entire month's payroll
 */
const deleteMonthlyPayroll = async (req, res) => {
    try {
        const { month, year } = req.body;
        const userId = req.user.data_owner_id;

        // Check if any payroll is approved/paid
        const [approved] = await db.query(`
            SELECT COUNT(*) as count
            FROM manufacturing_payroll
            WHERE month = ? AND year = ? AND user_id = ?
            AND status != 'draft'
        `, [month, year, userId]);

        if (approved[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete month with approved/paid payroll. Delete individual records first.'
            });
        }

        const [result] = await db.query(`
            DELETE FROM manufacturing_payroll
            WHERE month = ? AND year = ? AND user_id = ? AND status = 'draft'
        `, [month, year, userId]);

        res.status(200).json({
            success: true,
            message: `Deleted ${result.affectedRows} payroll records`
        });

    } catch (error) {
        console.error('Delete monthly payroll error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    generateMonthlyPayroll,
    getPayrollList,
    getPayrollDetails,
    approvePayroll,
    deletePayroll,
    deleteMonthlyPayroll
};
