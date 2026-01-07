-- Updated Database Schema (After Worker → Member Migration)
-- Generated: 2026-01-06
-- Database: Reminder App with Attendance & Expense Tracking

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- MEMBERS TABLE (Previously: workers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    wage_type ENUM('daily', 'monthly', 'piece_rate') DEFAULT 'daily',
    daily_wage DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status)
);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'completed', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status)
);

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    member_id INT DEFAULT NULL,
    project_id INT DEFAULT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('present', 'absent', 'late', 'half-day', 'permission') NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    permission_duration VARCHAR(100) DEFAULT NULL,
    permission_start_time VARCHAR(20) DEFAULT NULL,
    permission_end_time VARCHAR(20) DEFAULT NULL,
    permission_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, date),
    INDEX idx_member (member_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status)
);


-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    member_id INT DEFAULT NULL,
    project_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, date),
    INDEX idx_member (member_id),
    INDEX idx_project (project_id),
    INDEX idx_type (type),
    INDEX idx_category (category)
);

-- ============================================================================
-- REMINDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_due (user_id, due_date),
    INDEX idx_completed (completed)
);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('reminder', 'transaction') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, name, type)
);

-- ============================================================================
-- EXPENSE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_expense_category (user_id, name, type)
);

-- ============================================================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- ============================================================================
-- DAILY WORK LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_work_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    member_id INT NOT NULL,
    date DATE NOT NULL,
    units_produced DECIMAL(10, 2) DEFAULT 0.00,
    rate_per_unit DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (units_produced * rate_per_unit) STORED,
    work_type VARCHAR(100) DEFAULT 'production',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member_date (member_id, date),
    INDEX idx_user_date (user_id, date),
    INDEX idx_member (member_id)
);

-- ============================================================================
-- MIGRATION HISTORY
-- ============================================================================
-- Migration: generalize_to_members.sql
-- Date: 2026-01-05
-- Changes:
--   1. Renamed table: workers → members
--   2. Renamed column: attendance.worker_id → attendance.member_id
--   3. Renamed column: transactions.worker_id → transactions.member_id
--   4. Updated all foreign key constraints to reference members table
-- ============================================================================

-- Migration: add_salary_fields_to_members.sql
-- Date: 2026-01-06
-- Changes:
--   1. Added column: members.wage_type ENUM('daily', 'monthly', 'piece_rate')
--   2. Added column: members.daily_wage DECIMAL(10, 2)
--   3. Allows tracking of different salary/wage types for members
-- ============================================================================

-- Migration: add_daily_work_logs.sql
-- Date: 2026-01-06
-- Changes:
--   1. Created table: daily_work_logs
--   2. Tracks daily production/work for piece-rate and daily workers
--   3. Auto-calculates total_amount (units × rate)
--   4. Supports monthly salary calculations
-- ============================================================================

-- ============================================================================
-- MEMBER ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_per_user (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Migration: add_member_roles.sql
-- Date: 2026-01-07
-- Changes:
--   1. Created table: member_roles
--   2. Stores distinct categories/roles for members
--   3. Allows user-defined roles instead of just free text
-- ============================================================================

-- Migration: add_permission_tracking.sql
-- Date: 2026-01-07
-- Changes:
--   1. Updated attendance.status to include 'permission'
--   2. Added column: attendance.permission_duration (Readable string)
--   3. Added column: attendance.permission_start_time (24h format)
--   4. Added column: attendance.permission_end_time (24h format)
--   5. Added column: attendance.permission_reason (Reason for leaving)
--   6. Enhances tracking of partial-day permissions with work notes
-- ============================================================================

