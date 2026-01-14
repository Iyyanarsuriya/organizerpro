# 📝 ReminderApp

A full-stack reminder management application with Google Calendar integration, email notifications, and a beautiful modern UI.

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

---

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- **Profile Management** - Update profile information and upload profile pictures
- **Password Reset** - OTP-based password reset via email
- **Remember Me** - Persistent login sessions
- **Google OAuth** - Connect Google Calendar for seamless integration

### 📋 Reminder Management
- **Create Reminders** - Add reminders with title, description, due date, and priority
- **Priority Levels** - Low, Medium, High priority classification
- **Task Completion** - Mark tasks as complete/incomplete
- **Delete Reminders** - Remove completed tasks
- **Date Filtering** - Filter reminders by specific dates

### 📊 Statistics & Analytics
- **Task Overview** - View total, completed, and remaining tasks
- **Date-based Stats** - Filter statistics by specific dates
- **Visual Indicators** - Color-coded priority levels and status

### 🔔 Notifications
- **Email Alerts** - Daily missed task notifications at 8 PM
- **Beautiful Templates** - Professional HTML email templates
- **OTP Emails** - Secure password reset via email

### 📅 Google Calendar Integration
- **Auto-Sync** - Automatically create calendar events for reminders
- **Two-way Sync** - Delete calendar events when reminders are deleted
- **OAuth2 Security** - Secure Google Calendar connection

---

## 🏗️ Tech Stack

### Frontend
- **React** - Modern UI library
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Google APIs** - Calendar integration
- **Node-Cron** - Scheduled tasks
- **Multer** - File uploads

---

## 📁 Project Structure

```
ReminderApp/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── api/           # API integration layer
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── assets/        # Static assets
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── public/            # Public assets
│   └── package.json       # Frontend dependencies
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API routes
│   │   ├── models/        # Database models
│   │   ├── services/      # External services
│   │   ├── jobs/          # Cron jobs & queues
│   │   ├── middlewares/   # Request middlewares
│   │   ├── utils/         # Helper functions
│   │   ├── config/        # Configuration
│   │   └── app.js         # Main application
│   ├── uploads/           # User uploaded files
│   └── package.json       # Backend dependencies
│
├── QUICK_START.md         # Quick start guide
├── FIXES_SUMMARY.md       # Detailed fixes documentation
└── README.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL Server
- Gmail account (for email features)
- Google Cloud account (for calendar integration - optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ReminderApp
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   
   Create `server/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=reminder_app
   DB_PORT=3306
   
   JWT_SECRET=your_secret_key
   
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:6000/api/auth/google/callback
   
   FRONTEND_URL=http://localhost:5173
   PORT=6000
   ```

   Create `client/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:6000
   ```

4. **Setup database**
   ```sql
   CREATE DATABASE reminder_app;
   ```
   
   Run the SQL schema (see QUICK_START.md for full schema)

5. **Run the application**
   
   Terminal 1 (Server):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Client):
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:6000

---

## 📖 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Detailed setup and usage guide
- **[FIXES_SUMMARY.md](./FIXES_SUMMARY.md)** - Complete list of fixes and improvements

---

## 🎯 Key Features Explained

### Cron Jobs
The application runs a daily cron job at 8:00 PM to check for incomplete tasks and send email notifications to users.

### Google Calendar Sync
When connected, reminders are automatically synced to Google Calendar:
- Creating a reminder creates a calendar event
- Deleting a reminder deletes the calendar event
- Events include reminder details and notifications

### Email Notifications
- **Password Reset**: Receive OTP via email for secure password reset
- **Missed Tasks**: Daily email alerts for incomplete tasks due today

### File Uploads
- Profile pictures are validated and stored securely
- Maximum file size: 5MB
- Supported formats: JPG, JPEG, PNG, GIF, WEBP

---

## 🔒 Security Features

- **Password Hashing** - Bcrypt with salt rounds
- **JWT Tokens** - Secure authentication with 1-hour expiration
- **OTP Expiration** - 10-minute validity for password reset
- **File Validation** - Strict file type and size checks
- **SQL Injection Prevention** - Parameterized queries
- **CORS Protection** - Configured CORS policies

---

## 🎨 UI/UX Highlights

- **Modern Design** - Clean, professional interface
- **Responsive** - Works on desktop, tablet, and mobile
- **Dark Mode Ready** - Prepared for dark mode implementation
- **Smooth Animations** - Polished user interactions
- **Toast Notifications** - Non-intrusive feedback
- **Loading States** - Clear loading indicators
- **Error Handling** - User-friendly error messages

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/forgot-password` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password-otp` - Reset password
- `GET /api/auth/google` - Google OAuth URL
- `POST /api/auth/google/disconnect` - Disconnect Google

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder
- `POST /api/reminders/send-missed-alert` - Manual email trigger

---

## 🛠️ Development

### Server Development
```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Client Development
```bash
cd client
npm run dev  # Vite dev server with HMR
```

### Production Build
```bash
# Build client
cd client
npm run build

# Run server in production
cd server
npm start
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check credentials in `.env`
   - Ensure database exists

2. **Email Not Sending**
   - Use Gmail App Password (not regular password)
   - Enable 2FA and generate App Password
   - Check EMAIL_USER and EMAIL_PASS

3. **Google Calendar Not Working**
   - Verify OAuth credentials
   - Check redirect URI matches exactly
   - Enable Google Calendar API in Console

4. **Port Already in Use**
   - Change PORT in server/.env
   - Update VITE_API_BASE_URL in client/.env

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Iyyan Arsuriya**

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend framework
- Google for Calendar API
- All open-source contributors

---

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review error logs
3. Verify environment variables
4. Check database connection

---

**Built with ❤️ using React, Node.js, and MySQL**

---

## 🎉 Status

✅ **All features implemented and tested**  
✅ **Production ready**  
✅ **Well documented**  
✅ **Secure and scalable**

**Happy organizing! 📝✨**
