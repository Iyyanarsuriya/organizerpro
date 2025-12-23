# Password Reset - OTP Implementation

## Overview
The password reset functionality has been updated from email link-based to OTP (One-Time Password) based verification for better reliability and user experience.

## Changes Made

### Backend Changes

1. **Database Schema** (`server/migrations/add_otp_columns.sql`)
   - Added `reset_otp` column (VARCHAR 6)
   - Added `reset_otp_expiry` column (DATETIME)
   - Added index for faster lookups

2. **User Model** (`server/Models/userModel.js`)
   - Added `saveOTP()` - Save OTP and expiry to database
   - Added `findByEmailAndOTP()` - Verify OTP for email
   - Added `clearOTP()` - Clear OTP after successful reset

3. **Auth Controller** (`server/Controllers/authController.js`)
   - Updated `forgotPassword()` - Now generates and sends 6-digit OTP
   - Added `verifyOTP()` - Verify OTP before password reset
   - Added `resetPasswordWithOTP()` - Reset password using OTP
   - OTP expires in 10 minutes (configurable)

4. **Routes** (`server/routes/authRoutes.js`)
   - `POST /auth/forgot-password` - Send OTP to email
   - `POST /auth/verify-otp` - Verify OTP
   - `POST /auth/reset-password-otp` - Reset password with OTP

### Frontend Changes

1. **API Methods** (`client/src/api/authApi.js`)
   - Added `verifyOTP(email, otp)`
   - Added `resetPasswordWithOTP(email, otp, password)`

2. **Forgot Password Page** (`client/src/pages/ForgotPassword.jsx`)
   - Complete redesign with 3-step flow:
     - **Step 1**: Enter email address
     - **Step 2**: Enter 6-digit OTP
     - **Step 3**: Set new password
   - Features:
     - Resend OTP functionality
     - Change email option
     - OTP input validation (6 digits only)
     - Real-time feedback

## Setup Instructions

### 1. Update Database
Run the migration to add OTP columns:

```sql
-- Connect to your MySQL database
mysql -u your_username -p your_database_name

-- Run the migration
source server/migrations/add_otp_columns.sql
```

Or manually execute:
```sql
ALTER TABLE users 
ADD COLUMN reset_otp VARCHAR(6) DEFAULT NULL,
ADD COLUMN reset_otp_expiry DATETIME DEFAULT NULL;

CREATE INDEX idx_reset_otp ON users(reset_otp, reset_otp_expiry);
```

### 2. Email Configuration
Ensure your `.env` file has email credentials:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Note**: For Gmail, use an App Password, not your regular password.

### 3. Restart Server
The server should automatically reload if using nodemon. Otherwise:
```bash
cd server
npm run dev
```

## How It Works

### User Flow
1. User clicks "Forgot Password" on login page
2. User enters their email address
3. System generates 6-digit OTP and sends via email
4. User receives email with OTP (valid for 10 minutes)
5. User enters OTP on verification page
6. System verifies OTP
7. User creates new password
8. Password is updated and OTP is cleared
9. User redirected to login page

### Security Features
- OTP expires after 10 minutes
- OTP is 6 digits (100,000 - 999,999)
- OTP is cleared after successful password reset
- Email verification required
- Password validation (minimum 6 characters)

### Development Mode
When email credentials are not configured, the OTP is logged to the server console and returned in the API response for testing purposes.

## Testing

### Test the Flow
1. Navigate to `/forgot-password`
2. Enter a valid email address
3. Check email for OTP (or console in dev mode)
4. Enter the 6-digit OTP
5. Set a new password
6. Login with new password

### API Endpoints

**Send OTP**
```bash
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
```

**Verify OTP**
```bash
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
```

**Reset Password**
```bash
POST /api/auth/reset-password-otp
Body: { 
  "email": "user@example.com", 
  "otp": "123456",
  "password": "newpassword123"
}
```

## Troubleshooting

### OTP Not Received
- Check spam folder
- Verify email credentials in `.env`
- Check server console for errors
- In dev mode, check console for test OTP

### Invalid OTP Error
- OTP may have expired (10 minutes)
- Request new OTP using "Resend OTP" button
- Ensure correct email address

### Database Errors
- Verify migration was run successfully
- Check if columns exist: `DESCRIBE users;`
- Ensure MySQL server is running

## Future Enhancements
- SMS OTP option
- Configurable OTP expiry time
- Rate limiting for OTP requests
- OTP attempt limits
- Email templates customization
