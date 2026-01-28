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

app.use("/api/reminders", require("./routes/Personal/reminderRoutes"));
app.use("/api/push", pushRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/notes", require("./routes/Personal/noteRoutes"));
app.use("/api/vehicle-logs", require("./routes/Personal/vehicleLogRoutes"));

// ==========================================
// SECTOR SPECIFIC ROUTES
// ==========================================

// Manufacturing Sector Header
const mfgRouter = express.Router();
mfgRouter.use(withSector('manufacturing'));
mfgRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
mfgRouter.use('/transactions', transactionRoutes);
mfgRouter.use('/members', require("./routes/Manufacturing/memberRoutes"));
mfgRouter.use('/member-roles', require("./routes/Manufacturing/memberRoleRoutes"));
mfgRouter.use('/attendance', require("./routes/Manufacturing/attendanceRoutes"));
mfgRouter.use('/projects', require("./routes/Manufacturing/projectRoutes"));
mfgRouter.use('/work-logs', require("./routes/Manufacturing/dailyWorkLogRoutes"));
mfgRouter.use('/work-types', require("./routes/Manufacturing/workTypeRoutes"));
mfgRouter.use('/team', require("./routes/Manufacturing/teamRoutes"));
app.use('/api/manufacturing-sector', mfgRouter);

// IT Sector Header
const itRouter = express.Router();
itRouter.use(withSector('it'));
itRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
itRouter.use('/transactions', transactionRoutes);
itRouter.use('/members', require("./routes/Manufacturing/memberRoutes")); // Generic Member Controller
itRouter.use('/member-roles', require("./routes/Manufacturing/memberRoleRoutes")); // Generic Role Controller
itRouter.use('/attendance', require("./routes/IT/attendanceRoutes"));
itRouter.use('/team', require("./routes/IT/teamRoutes"));
app.use('/api/it-sector', itRouter);

// Education Sector Header
const eduRouter = express.Router();
eduRouter.use(withSector('education'));
eduRouter.use('/reminders', require("./routes/Personal/reminderRoutes"));
eduRouter.use('/transactions', transactionRoutes);
eduRouter.use('/members', require("./routes/Manufacturing/memberRoutes")); // Generic Member Controller
eduRouter.use('/member-roles', require("./routes/Manufacturing/memberRoleRoutes")); // Generic Role Controller
eduRouter.use('/attendance', require("./routes/Education/attendanceRoutes"));
eduRouter.use('/departments', require("./routes/Education/departmentRoutes"));
app.use('/api/education-sector', eduRouter);


app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});
