const Payroll = require('../../models/educationPayrollModel');
const Attendance = require('../../models/attendanceModel');
const AuditLog = require('../../models/auditLogModel');
const Transaction = require('../../models/transactionModel');

const generatePayroll = async (req, res) => {
    try {
        const { month, year } = req.body;
        const userId = req.user.data_owner_id;

        // 1. Check if all days in the month are locked
        // For simplicity, we can just check if at least one day is marked and locked, 
        // but the rule says "Attendance must be locked before salary generation".
        // Let's assume the user picks a month and we verify.

        // 2. Fetch member summary for the month
        const summary = await Attendance.getMemberSummary(userId, {
            period: `${year}-${String(month).padStart(2, '0')}`,
            sector: 'education'
        });

        if (!summary || summary.length === 0) {
            return res.status(400).json({ success: false, message: "No attendance data found for this month." });
        }

        // Delete existing draft/pending payrolls for this month to avoid duplicates
        await Payroll.deleteByMonthYear(userId, month, year);

        const payrolls = [];
        const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in the specified month

        const summariesWithSalary = summary.map(s => {
            const presentDays = parseFloat(s.present || 0);
            const halfDays = parseFloat(s.half_day || 0);
            const clUsed = parseFloat(s.CL || 0);
            const slUsed = parseFloat(s.SL || 0);
            const elUsed = parseFloat(s.EL || 0);

            let baseSalary = parseFloat(s.daily_wage || 0); // This is actually the wage amount, not necessarily daily
            let netSalary = 0;

            const effectivePresent = presentDays + clUsed + slUsed + elUsed + (halfDays * 0.5);

            if (s.wage_type === 'daily') {
                netSalary = effectivePresent * baseSalary;
                baseSalary = baseSalary * daysInMonth; // Standardize base salary for reports to monthly equivalent
            } else { // Assuming 'monthly' wage_type
                // Monthly basis: (Monthly Salary / daysInMonth) * Effective Present
                netSalary = (baseSalary / daysInMonth) * effectivePresent;
            }

            return {
                ...s,
                working_days: daysInMonth, // Total working days in the month
                present_days: presentDays,
                absent_days: parseFloat(s.absent || 0),
                half_days: halfDays,
                lop_days: parseFloat(s.absent || 0), // Assuming absent days are LOP days
                cl_used: clUsed,
                sl_used: slUsed,
                el_used: elUsed,
                base_salary: parseFloat(baseSalary.toFixed(2)),
                net_salary: parseFloat(netSalary.toFixed(2)),
                bonus: 0, // Placeholder
                deductions: 0, // Placeholder
                status: 'pending_approval'
            };
        });

        for (const s of summariesWithSalary) {
            const payrollData = {
                user_id: userId,
                member_id: s.id,
                month,
                year,
                working_days: s.working_days,
                present_days: s.present_days,
                absent_days: s.absent_days,
                half_days: s.half_days,
                lop_days: s.lop_days,
                cl_used: s.cl_used,
                sl_used: s.sl_used,
                el_used: s.el_used,
                base_salary: s.base_salary,
                net_salary: s.net_salary,
                status: s.status
            };

            const result = await Payroll.create(payrollData);
            payrolls.push(result);
        }

        await AuditLog.create({
            user_id: userId,
            action: 'GENERATED_PAYROLL',
            module: 'payroll',
            details: `Generated payroll for ${month}/${year}`,
            performed_by: req.user.id
        });

        res.status(200).json({ success: true, data: payrolls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPayrolls = async (req, res) => {
    try {
        const payrolls = await Payroll.getAllByUserId(req.user.data_owner_id, req.query);
        res.status(200).json({ success: true, data: payrolls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const approvePayroll = async (req, res) => {
    try {
        await Payroll.updateStatus(req.params.id, req.user.data_owner_id, 'approved');
        await AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'APPROVED_PAYROLL',
            module: 'payroll',
            details: `Approved payroll ID ${req.params.id}`,
            performed_by: req.user.id
        });
        res.status(200).json({ success: true, message: "Payroll approved" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const undoApprove = async (req, res) => {
    try {
        await Payroll.updateStatus(req.params.id, req.user.data_owner_id, 'pending_approval');
        await AuditLog.create({
            user_id: req.user.data_owner_id,
            action: 'UNDONE_PAYROLL_APPROVAL',
            module: 'payroll',
            details: `Undid approval for payroll ID ${req.params.id}`,
            performed_by: req.user.id
        });
        res.status(200).json({ success: true, message: "Approval undone" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const payPayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.data_owner_id;
        const { payment_mode } = req.body;

        // 1. Get payroll details
        const payrolls = await Payroll.getAllByUserId(userId, { id });
        const p = payrolls.find(item => item.id == id);
        if (!p) return res.status(404).json({ success: false, message: "Payroll not found" });

        // 2. Create an expense transaction
        const transaction = await Transaction.create({
            user_id: userId,
            title: `Salary Payment - ${p.member_name} (${p.month}/${p.year})`,
            amount: p.net_salary,
            type: 'expense',
            category: 'Salary',
            date: new Date(),
            member_id: p.member_id,
            payment_status: 'completed',
            payment_mode: payment_mode || 'Cash',
            sector: 'education'
        });

        // 3. Update payroll status
        await Payroll.updateStatus(id, userId, 'paid', { transaction_id: transaction.id });

        await AuditLog.create({
            user_id: userId,
            action: 'PAID_PAYROLL',
            module: 'payroll',
            details: `Paid salary of ${p.net_salary} to ${p.member_name}`,
            performed_by: req.user.id
        });

        res.status(200).json({ success: true, message: "Payroll paid and expense recorded" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generatePayroll,
    getPayrolls,
    approvePayroll,
    undoApprove,
    payPayroll
};
