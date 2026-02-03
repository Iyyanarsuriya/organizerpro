// ============================================
// MANUFACTURING PAYROLL ROUTES
// API endpoints for payroll management
// Date: February 2, 2026
// ============================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/authMiddleware');

const {
    generateMonthlyPayroll,
    getPayrollList,
    getPayrollDetails,
    approvePayroll,
    deletePayroll,
    deleteMonthlyPayroll
} = require('../../controllers/Manufacturing/payrollController');

// ============================================
// PAYROLL ROUTES
// ============================================

// Generate monthly payroll
// POST /api/manufacturing/payroll/generate
router.post('/generate', authenticateToken, generateMonthlyPayroll);

// Get payroll list with filters
// GET /api/manufacturing/payroll?month=1&year=2026&status=draft
router.get('/', authenticateToken, getPayrollList);

// Get payroll details by ID
// GET /api/manufacturing/payroll/:id
router.get('/:id', authenticateToken, getPayrollDetails);

// Approve payroll (auto-generates expense)
// POST /api/manufacturing/payroll/:id/approve
router.post('/:id/approve', authenticateToken, approvePayroll);

// Delete single payroll record (draft only)
// DELETE /api/manufacturing/payroll/:id
router.delete('/:id', authenticateToken, deletePayroll);

// Delete entire month's payroll (draft only)
// DELETE /api/manufacturing/payroll/month
router.delete('/month/delete', authenticateToken, deleteMonthlyPayroll);

module.exports = router;
