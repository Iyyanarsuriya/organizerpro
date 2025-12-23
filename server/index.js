const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./Routes/authRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://192.168.0.168:${PORT}`);
});
