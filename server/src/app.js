const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/Common/authRoutes");
// const reminderRoutes = require("./routes/Personal/reminderRoutes"); // Moved inline
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
app.use("/api/reminders", require("./routes/Personal/reminderRoutes"));
app.use("/api/push", pushRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/projects", require("./routes/Manufacturing/projectRoutes"));
app.use("/api/attendance", require("./routes/Manufacturing/attendanceRoutes"));
app.use("/api/members", require("./routes/Manufacturing/memberRoutes"));
app.use("/api/work-logs", require("./routes/Manufacturing/dailyWorkLogRoutes"));
app.use("/api/member-roles", require("./routes/Manufacturing/memberRoleRoutes"));
app.use("/api/work-types", require("./routes/Manufacturing/workTypeRoutes"));
app.use("/api/vehicle-logs", require("./routes/Personal/vehicleLogRoutes"));
app.use("/api/team", require("./routes/Manufacturing/teamRoutes"));
app.use("/api/notes", require("./routes/Personal/noteRoutes"));

app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});
