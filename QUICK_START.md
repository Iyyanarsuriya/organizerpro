# ReminderApp - Quick Start Guide

## 🚀 Running the Application

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- Git

---

## 📦 Installation

### 1. Clone the Repository
```bash
cd C:\Users\iyyan\OneDrive\Desktop\ReminderApp
```

### 2. Install Server Dependencies
```bash
cd server
npm install
```

### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

---

## ⚙️ Configuration

### 1. Database Setup
Create a MySQL database:
```sql
CREATE DATABASE reminder_app;
```

### 2. Environment Variables

Create `server/.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=reminder_app
DB_PORT=3306

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Optional - for OTP emails)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google Calendar (Optional - for calendar sync)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=5000
```

### 3. Database Tables
Run the SQL schema to create tables (if not already created):
```sql
-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20),
    profile_image VARCHAR(255),
    google_refresh_token TEXT,
    reset_otp VARCHAR(6),
    reset_otp_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reminders table
CREATE TABLE reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATETIME,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_completed BOOLEAN DEFAULT FALSE,
    google_event_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Push Subscriptions table
CREATE TABLE push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🏃 Running the Application

### Option 1: Run Both (Recommended)

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### Option 2: Production Mode

**Server:**
```bash
cd server
npm start
```

**Client:**
```bash
cd client
npm run build
npm run preview
```

---

## 🌐 Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Endpoints:** http://localhost:5000/api

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/forgot-password` - Request OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password-otp` - Reset password with OTP
- `GET /api/auth/google` - Get Google OAuth URL (protected)
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/google/disconnect` - Disconnect Google Calendar (protected)

### Reminders
- `GET /api/reminders` - Get all reminders (protected)
- `POST /api/reminders` - Create reminder (protected)
- `PUT /api/reminders/:id` - Update reminder (protected)
- `DELETE /api/reminders/:id` - Delete reminder (protected)
- `POST /api/reminders/send-missed-alert` - Trigger missed task email (protected)

---

## 🔧 Troubleshooting

### Server won't start
1. Check if MySQL is running
2. Verify database credentials in `.env`
3. Ensure port 5000 is not in use

### Client won't start
1. Check if port 5173 is available
2. Verify all dependencies are installed
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Database connection errors
1. Verify MySQL is running: `mysql -u root -p`
2. Check database exists: `SHOW DATABASES;`
3. Verify credentials in `.env`

### Email not sending
1. Check EMAIL_USER and EMAIL_PASS in `.env`
2. For Gmail, use App Password (not regular password)
3. Enable "Less secure app access" or use App Password

### Google Calendar not working
1. Verify Google OAuth credentials
2. Check redirect URI matches exactly
3. Ensure Google Calendar API is enabled in Google Cloud Console

---

## 🎯 Features

### ✅ User Management
- Signup/Login with JWT authentication
- Profile management with image upload
- Password reset with OTP
- Remember Me functionality

### ✅ Reminder Management
- Create, update, delete reminders
- Set priority (low, medium, high)
- Set due dates
- Mark as complete/incomplete
- Filter by date

### ✅ Google Calendar Integration
- Sync reminders to Google Calendar
- Auto-create calendar events
- Auto-delete events when reminder is deleted

### ✅ Email Notifications
- Daily missed task alerts (8 PM)
- OTP for password reset
- Beautiful HTML email templates

### ✅ Statistics
- Total tasks
- Completed tasks
- Remaining tasks
- Filter by date

---

## 📱 Usage Tips

1. **First Time Setup:**
   - Create an account
   - Optionally connect Google Calendar
   - Start creating reminders

2. **Creating Reminders:**
   - Fill in title (required)
   - Add description (optional)
   - Set due date and time
   - Choose priority level
   - Click "Add Reminder"

3. **Managing Reminders:**
   - Click checkbox to mark complete
   - Click task to view details
   - Delete button appears when task is completed
   - Filter by date in Profile page

4. **Profile Management:**
   - Update username, mobile number
   - Upload profile picture
   - View task statistics
   - Connect/disconnect Google Calendar

---

## 🔐 Security Notes

- Passwords are hashed with bcrypt
- JWT tokens expire after 1 hour
- OTP expires after 10 minutes
- File uploads are validated (images only, 5MB max)
- SQL injection prevention with parameterized queries

---

## 📞 Support

For issues or questions:
1. Check the FIXES_SUMMARY.md for detailed information
2. Review the error logs in terminal
3. Verify environment variables are set correctly

---

**Happy Organizing! 📝✨**
