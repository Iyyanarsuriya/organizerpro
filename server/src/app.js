const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const pushRoutes = require("./routes/pushRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const expenseCategoryRoutes = require("./routes/expenseCategoryRoutes");

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
app.use("/api/reminders", reminderRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/members", require("./routes/memberRoutes"));
app.use("/api/work-logs", require("./routes/dailyWorkLogRoutes"));
app.use("/api/member-roles", require("./routes/memberRoleRoutes"));
app.use("/api/work-types", require("./routes/workTypeRoutes"));
app.use("/api/vehicle-logs", require("./routes/vehicleLogRoutes"));
app.use("/api/team", require("./routes/teamRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
