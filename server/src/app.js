const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/Common/authRoutes");
const pushRoutes = require("./routes/Common/pushRoutes");
const transactionRoutes = require("./routes/Common/transactionRoutes");
const categoryRoutes = require("./routes/Common/categoryRoutes");
const expenseCategoryRoutes = require("./routes/Common/expenseCategoryRoutes");

const app = express();
const PORT = process.env.PORT || 5001;
const db = require("./config/db");
const { initCronJobs } = require("./jobs/cronService");
// Start Cron Jobs
initCronJobs();

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRoutes);
// Middleware to inject sector
const withSector = (sector) => (req, res, next) => {
    req.query.sector = sector;
    if (req.body && typeof req.body === 'object') {
        req.body.sector = sector;
    }
    next();
};

// Personal Sector Header - DEFAULT
const personalRouter = express.Router();
personalRouter.use(withSector('personal'));
personalRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
personalRouter.use('/transactions', transactionRoutes);
personalRouter.use('/categories', categoryRoutes);
personalRouter.use('/expense-categories', expenseCategoryRoutes);
personalRouter.use('/notes', require("./routes/Personal/noteRoutes"));
// personalRouter.use('/vehicle-logs', require("./routes/Personal/vehicleLogRoutes")); // Removed
personalRouter.use('/budgets', require("./routes/Personal/budgetRoutes"));
app.use('/api', personalRouter);
app.use("/api/push", pushRoutes);

// ==========================================
// SECTOR SPECIFIC ROUTES
// ==========================================

// Manufacturing Sector Header
const mfgRouter = express.Router();
mfgRouter.use(withSector('manufacturing'));
mfgRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
mfgRouter.use('/transactions', transactionRoutes);
mfgRouter.use('/members', require("./routes/Common/memberRoutes"));
mfgRouter.use('/member-roles', require("./routes/Common/memberRoleRoutes"));
mfgRouter.use('/attendance', require("./routes/Manufacturing/attendanceRoutes"));
mfgRouter.use('/projects', require("./routes/Common/projectRoutes"));
mfgRouter.use('/work-logs', require("./routes/Manufacturing/dailyWorkLogRoutes"));
mfgRouter.use('/vehicle-logs', require("./routes/Manufacturing/vehicleLogRoutes"));
mfgRouter.use('/work-types', require("./routes/Manufacturing/workTypeRoutes"));
mfgRouter.use('/team', require("./routes/Manufacturing/teamRoutes"));
mfgRouter.use('/notes', require("./routes/Personal/noteRoutes"));
mfgRouter.use('/payroll', require("./routes/Manufacturing/payrollRoutes"));
app.use('/api/manufacturing-sector', mfgRouter);

// IT Sector Header
const itRouter = express.Router();
itRouter.use(withSector('it'));
itRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
itRouter.use('/notes', require("./routes/Personal/noteRoutes"));
itRouter.use('/transactions', transactionRoutes);
itRouter.use('/categories', categoryRoutes);
itRouter.use('/members', require("./routes/Common/memberRoutes"));
itRouter.use('/member-roles', require("./routes/Common/memberRoleRoutes"));
itRouter.use('/projects', require("./routes/Common/projectRoutes"));
itRouter.use('/attendance', require("./routes/IT/attendanceRoutes"));
itRouter.use('/team', require("./routes/IT/teamRoutes"));
itRouter.use('/timesheets', require("./routes/IT/timesheetRoutes"));
itRouter.use('/leaves', require("./routes/IT/leaveRoutes"));
itRouter.use('/audit', require("./routes/IT/auditRoutes"));
app.use('/api/it-sector', itRouter);

// Education Sector Header
const eduRouter = express.Router();
eduRouter.use(withSector('education'));
eduRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
eduRouter.use('/notes', require("./routes/Personal/noteRoutes"));
eduRouter.use('/transactions', transactionRoutes);
eduRouter.use('/categories', categoryRoutes);
eduRouter.use('/members', require("./routes/Common/memberRoutes"));
eduRouter.use('/member-roles', require("./routes/Common/memberRoleRoutes"));
eduRouter.use('/attendance', require("./routes/Education/attendanceRoutes"));
eduRouter.use('/departments', require("./routes/Education/departmentRoutes"));
eduRouter.use('/team', require("./routes/Education/teamRoutes"));
eduRouter.use('/payroll', require("./routes/Education/payrollRoutes"));
eduRouter.use('/vendors', require("./routes/Education/vendorRoutes"));
eduRouter.use('/audit', require("./routes/Education/auditRoutes"));
app.use('/api/education-sector', eduRouter);

// Hotel Sector Header
const hotelRouter = express.Router();
hotelRouter.use(withSector('hotel'));
hotelRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
hotelRouter.use('/notes', require("./routes/Personal/noteRoutes"));
hotelRouter.use('/transactions', transactionRoutes);
hotelRouter.use('/categories', categoryRoutes);
hotelRouter.use('/members', require("./routes/Common/memberRoutes"));
hotelRouter.use('/member-roles', require("./routes/Common/memberRoleRoutes"));
hotelRouter.use('/projects', require("./routes/Common/projectRoutes"));
hotelRouter.use('/attendance', require("./routes/Hotel/attendanceRoutes"));
hotelRouter.use('/team', require("./routes/Hotel/teamRoutes"));
hotelRouter.use('/vendors', require("./routes/Hotel/vendorRoutes"));
hotelRouter.use('/lookups', require("./routes/Hotel/lookupRoutes"));
hotelRouter.use('/', require("./routes/Hotel/hotelRoutes"));
app.use('/api/hotel-sector', hotelRouter);



app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});
