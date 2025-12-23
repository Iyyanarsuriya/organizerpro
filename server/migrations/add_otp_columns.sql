-- Run this script to add OTP columns to existing users table
-- This is for existing databases that need to be updated

USE reminder_db;

-- Add OTP columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reset_otp_expiry DATETIME DEFAULT NULL;

-- Add index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_reset_otp ON users(reset_otp, reset_otp_expiry);

-- Verify the changes
DESCRIBE users;

SELECT 'OTP columns added successfully!' AS Status;
