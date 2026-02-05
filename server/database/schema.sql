-- ==========================================
-- OrganizerPro Database Schema V2.1
-- ==========================================
-- Last Updated: February 5, 2026
-- Total Tables: 55 (2 Shared + 5 Personal + 18 Manufacturing + 11 IT + 12 Education + 8 Hotel)
-- 
-- ARCHITECTURE:
-- - Sector-based isolation for data organization
-- - Shared tables for authentication and notifications
-- - Sector-specific tables for reminders, notes, transactions, attendance, etc.
-- 
-- LEGACY CLEANUP COMPLETED:
-- Removed redundant generic tables.
-- Removed unused sample data scripts.
-- ==========================================
--
-- TABLE OF CONTENTS:
-- ==========================================
-- 
-- SHARED TABLES (2):
--   1. users - User authentication and profiles
--   2. push_subscriptions - Web push notification subscriptions
--
-- PERSONAL SECTOR (5):
--   3. personal_transactions - Personal income/expense tracking
--   4. personal_reminders - Personal tasks and reminders
--   5. personal_notes - Personal notes and memos
--   6. personal_categories - Personal reminder categories
--   7. personal_budgets - Personal monthly/yearly category budgets
--
-- MANUFACTURING SECTOR (18):
--   7. manufacturing_projects - Manufacturing projects
--   8. manufacturing_members - Manufacturing employees/workers
--   9. manufacturing_transactions - Manufacturing financial transactions
--  10. manufacturing_attendance - Manufacturing employee attendance
--  11. manufacturing_work_logs - Daily work logs for manufacturing
--  12. manufacturing_expense_categories - Manufacturing expense categories
--  13. manufacturing_vehicle_logs - Vehicle tracking for manufacturing
--  14. manufacturing_member_roles - Manufacturing employee roles
--  15. manufacturing_work_types - Manufacturing work type definitions
--  16. manufacturing_reminders - Manufacturing sector reminders
--  17. manufacturing_notes - Manufacturing sector notes
--  18. manufacturing_holidays - Manufacturing holidays
--  19. manufacturing_shifts - Manufacturing shifts
--  20. manufacturing_payroll - Manufacturing payroll
--  21. manufacturing_approvals - Manufacturing approvals
--  22. manufacturing_expense_locks - Manufacturing expense locks
--  23. manufacturing_advances - Manufacturing advances
--  24. manufacturing_payroll_settings - Manufacturing payroll settings
--
-- IT SECTOR (11):
--  25. it_projects - IT projects
--  26. it_members - IT team members
--  27. it_attendance - IT team attendance
--  28. it_reminders - IT sector reminders
--  29. it_notes - IT sector notes
--  30. it_member_roles - IT team member roles
--  31. it_timesheets - IT timesheets
--  32. it_leaves - IT leave management
--  33. it_audit_logs - IT audit logs
--  34. it_transactions - IT sector financial transactions
--  35. it_categories - IT expense/transaction categories
--
-- EDUCATION SECTOR (12):
--  36. education_members - Education staff and students
--  37. education_attendance - Education attendance tracking
--  38. education_reminders - Education sector reminders
--  39. education_notes - Education sector notes
--  40. education_member_roles - Education staff/student roles
--  41. education_transactions - Education sector financial transactions
--  42. education_categories - Education expense categories
--  43. education_departments - Education departments
--  44. education_vendors - Education vendors
--  45. education_payroll - Education payroll and salary tracking
--  46. education_attendance_locks - Education attendance locking system
--  47. education_audit_logs - Education sector audit trails
--
-- HOTEL SECTOR (8):
--  48. hotel_projects - Hotel projects
--  49. hotel_members - Hotel staff members
--  50. hotel_transactions - Hotel sector financial transactions
--  51. hotel_attendance - Hotel staff attendance
--  52. hotel_reminders - Hotel sector reminders
--  53. hotel_notes - Hotel sector notes
--  54. hotel_member_roles - Hotel staff roles
--  55. hotel_categories - Hotel expense categories
-- ==========================================


SET FOREIGN_KEY_CHECKS = 0;

-- LEGACY TABLES CLEANUP (Pre-Sector Isolation)
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `notes`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `reminders`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `daily_work_logs`;
DROP TABLE IF EXISTS `vehicle_logs`;
DROP TABLE IF EXISTS `member_roles`;
DROP TABLE IF EXISTS `work_types`;
DROP TABLE IF EXISTS `audit_logs`;

-- ==========================================
-- SHARED TABLES
-- ==========================================

-- Users (Shared across all sectors)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `google_refresh_token` text,
  `reset_otp` varchar(6) DEFAULT NULL,
  `reset_otp_expiry` datetime DEFAULT NULL,
  `role` enum('admin','user','owner','manager','staff') DEFAULT 'user',
  `owner_id` int DEFAULT NULL,
  `local_id` int DEFAULT NULL,
  `sector` varchar(50) DEFAULT 'personal',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_reset_otp` (`reset_otp`,`reset_otp_expiry`),
  KEY `fk_user_owner` (`owner_id`),
  CONSTRAINT `fk_user_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Push Subscriptions (Shared)
DROP TABLE IF EXISTS `push_subscriptions`;
CREATE TABLE `push_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` text NOT NULL,
  `auth` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==========================================
-- PERSONAL SECTOR TABLES
-- ==========================================

-- Personal Transactions
DROP TABLE IF EXISTS `personal_transactions`;
CREATE TABLE `personal_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `category` varchar(50) DEFAULT 'Other',
  `date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_personal_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Personal Reminders
DROP TABLE IF EXISTS `personal_reminders`;
CREATE TABLE `personal_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` datetime DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `is_completed` tinyint(1) DEFAULT '0',
  `google_event_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(50) DEFAULT 'General',
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_personal_remind_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Personal Notes
DROP TABLE IF EXISTS `personal_notes`;
CREATE TABLE `personal_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `color` varchar(20) DEFAULT 'yellow',
  `is_pinned` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_personal_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Personal Categories
DROP TABLE IF EXISTS `personal_categories`;
CREATE TABLE `personal_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(20) DEFAULT '#2d5bff',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_pcat` (`user_id`,`name`),
  CONSTRAINT `fk_personal_cat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Personal Budgets
DROP TABLE IF EXISTS `personal_budgets`;
CREATE TABLE `personal_budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount_limit` decimal(15,2) NOT NULL,
  `period` enum('monthly','yearly') DEFAULT 'monthly',
  `month` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_budget` (`user_id`,`category`,`month`,`year`),
  CONSTRAINT `fk_personal_budgets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- MANUFACTURING SECTOR TABLES
-- ==========================================

-- Manufacturing Projects
DROP TABLE IF EXISTS `manufacturing_projects`;
CREATE TABLE `manufacturing_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_proj_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Members
DROP TABLE IF EXISTS `manufacturing_members`;
CREATE TABLE `manufacturing_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `wage_type` enum('daily','monthly','piece_rate') DEFAULT 'daily',
  `daily_wage` decimal(15,2) DEFAULT '0.00',
  `member_type` enum('employee','worker') DEFAULT 'worker',
  `project_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_memb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_man_memb_proj` FOREIGN KEY (`project_id`) REFERENCES `manufacturing_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_man_memb_shift` FOREIGN KEY (`shift_id`) REFERENCES `manufacturing_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Transactions
DROP TABLE IF EXISTS `manufacturing_transactions`;
CREATE TABLE `manufacturing_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `category` varchar(50) DEFAULT 'Other',
  `date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `project_id` int DEFAULT NULL,
  `member_id` int DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT 'completed',
  `guest_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT '1.00',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `payroll_id` int DEFAULT NULL,
  `approval_id` int DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT 'Cash',
  `auto_generated` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_man_trans_proj` (`project_id`),
  KEY `fk_man_trans_memb` (`member_id`),
  KEY `fk_man_trans_pay` (`payroll_id`),
  KEY `fk_man_trans_appr` (`approval_id`),
  CONSTRAINT `fk_man_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_man_trans_proj` FOREIGN KEY (`project_id`) REFERENCES `manufacturing_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_man_trans_memb` FOREIGN KEY (`member_id`) REFERENCES `manufacturing_members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_man_trans_pay` FOREIGN KEY (`payroll_id`) REFERENCES `manufacturing_payroll` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_man_trans_appr` FOREIGN KEY (`approval_id`) REFERENCES `manufacturing_approvals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Attendance
DROP TABLE IF EXISTS `manufacturing_attendance`;
CREATE TABLE `manufacturing_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `status` enum('present','absent','late','half-day','permission','week_off','holiday','CL','SL','EL','OD') NOT NULL,
  `subject` varchar(255) DEFAULT 'Daily Attendance',
  `date` date NOT NULL,
  `note` text,
  `project_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `total_hours` decimal(4,2) DEFAULT '0.00',
  `work_mode` enum('Office','WFH','On-site') DEFAULT 'Office',
  `permission_duration` varchar(100) DEFAULT NULL,
  `permission_start_time` varchar(20) DEFAULT NULL,
  `permission_end_time` varchar(20) DEFAULT NULL,
  `permission_reason` text,
  `overtime_duration` varchar(100) DEFAULT NULL,
  `overtime_reason` text,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_man_att_proj` (`project_id`),
  KEY `fk_man_att_memb` (`member_id`),
  CONSTRAINT `fk_man_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_man_att_proj` FOREIGN KEY (`project_id`) REFERENCES `manufacturing_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_man_att_memb` FOREIGN KEY (`member_id`) REFERENCES `manufacturing_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Daily Work Logs
DROP TABLE IF EXISTS `manufacturing_work_logs`;
CREATE TABLE `manufacturing_work_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `guest_name` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `units_produced` decimal(15,2) DEFAULT '0.00',
  `rate_per_unit` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) GENERATED ALWAYS AS ((`units_produced` * `rate_per_unit`)) STORED,
  `work_type` varchar(100) DEFAULT 'production',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`,`date`),
  KEY `idx_member` (`member_id`),
  CONSTRAINT `fk_man_wl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_man_wl_memb` FOREIGN KEY (`member_id`) REFERENCES `manufacturing_members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Expense Categories
DROP TABLE IF EXISTS `manufacturing_expense_categories`;
CREATE TABLE `manufacturing_expense_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('income','expense') DEFAULT 'expense',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_man_cat` (`user_id`,`name`,`type`),
  CONSTRAINT `fk_man_cat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Vehicle Logs
DROP TABLE IF EXISTS `manufacturing_vehicle_logs`;
CREATE TABLE `manufacturing_vehicle_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `vehicle_name` varchar(100) DEFAULT NULL,
  `vehicle_number` varchar(50) NOT NULL,
  `driver_name` varchar(100) DEFAULT NULL,
  `in_time` datetime DEFAULT NULL,
  `out_time` datetime DEFAULT NULL,
  `start_km` decimal(15,2) DEFAULT NULL,
  `end_km` decimal(15,2) DEFAULT NULL,
  `expense_amount` decimal(15,2) DEFAULT '0.00',
  `income_amount` decimal(15,2) DEFAULT '0.00',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_veh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Member Roles
DROP TABLE IF EXISTS `manufacturing_member_roles`;
CREATE TABLE `manufacturing_member_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_man_role` (`user_id`,`name`),
  CONSTRAINT `fk_man_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Work Types
DROP TABLE IF EXISTS `manufacturing_work_types`;
CREATE TABLE `manufacturing_work_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_man_worktype` (`user_id`,`name`),
  CONSTRAINT `fk_man_wt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Reminders (Optional, but user asked for sector specific)
DROP TABLE IF EXISTS `manufacturing_reminders`;
CREATE TABLE `manufacturing_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` datetime DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `is_completed` tinyint(1) DEFAULT '0',
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_remind_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Manufacturing Notes
DROP TABLE IF EXISTS `manufacturing_notes`;
CREATE TABLE `manufacturing_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `color` varchar(20) DEFAULT 'yellow',
  `is_pinned` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Holidays
DROP TABLE IF EXISTS `manufacturing_holidays`;
CREATE TABLE `manufacturing_holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `type` enum('National','Regional','Company','Other') DEFAULT 'National',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_hol_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Shifts
DROP TABLE IF EXISTS `manufacturing_shifts`;
CREATE TABLE `manufacturing_shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_duration` int DEFAULT '60',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_shift_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Manufacturing Payroll
DROP TABLE IF EXISTS `manufacturing_payroll`;
CREATE TABLE `manufacturing_payroll` (
    `id` int NOT NULL AUTO_INCREMENT,
    `member_id` int NOT NULL,
    `month` int NOT NULL COMMENT '1-12',
    `year` int NOT NULL COMMENT 'YYYY',
    `days_present` int DEFAULT '0',
    `days_absent` int DEFAULT '0',
    `days_half` int DEFAULT '0',
    `days_leave` int DEFAULT '0',
    `days_holiday` int DEFAULT '0',
    `days_weekend` int DEFAULT '0',
    `overtime_hours` decimal(10,2) DEFAULT '0.00',
    `base_amount` decimal(15,2) NOT NULL,
    `overtime_amount` decimal(15,2) DEFAULT '0.00',
    `gross_amount` decimal(15,2) NOT NULL,
    `advance_deducted` decimal(15,2) DEFAULT '0.00',
    `loan_deducted` decimal(15,2) DEFAULT '0.00',
    `other_deductions` decimal(15,2) DEFAULT '0.00',
    `total_deductions` decimal(15,2) DEFAULT '0.00',
    `net_amount` decimal(15,2) NOT NULL,
    `status` enum('draft','approved','paid','cancelled') DEFAULT 'draft',
    `approved_by` varchar(100) DEFAULT NULL,
    `approved_at` datetime DEFAULT NULL,
    `paid_at` datetime DEFAULT NULL,
    `payment_mode` enum('cash','bank','upi','cheque') DEFAULT 'bank',
    `expense_id` int DEFAULT NULL,
    `project_id` int DEFAULT NULL,
    `notes` text,
    `user_id` int NOT NULL,
    `created_by` varchar(100) NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_by` varchar(100) DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_payroll` (`member_id`,`month`,`year`,`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_month_year` (`month`,`year`),
    KEY `idx_member` (`member_id`),
    CONSTRAINT `fk_man_pay_memb` FOREIGN KEY (`member_id`) REFERENCES `manufacturing_members` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_man_pay_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Approvals
DROP TABLE IF EXISTS `manufacturing_approvals`;
CREATE TABLE `manufacturing_approvals` (
    `id` int NOT NULL AUTO_INCREMENT,
    `entity_type` enum('expense','payroll','attendance') NOT NULL,
    `entity_id` int NOT NULL,
    `amount` decimal(15,2) DEFAULT '0.00',
    `title` varchar(255) DEFAULT NULL,
    `description` text,
    `requested_by` varchar(100) NOT NULL,
    `requested_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `approver_level` int DEFAULT '1',
    `required_level` int DEFAULT '1',
    `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
    `approved_by` varchar(100) DEFAULT NULL,
    `approved_at` datetime DEFAULT NULL,
    `rejection_reason` text,
    `approver_comments` text,
    `user_id` int NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_entity` (`entity_type`,`entity_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_man_appr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Expense Locks
DROP TABLE IF EXISTS `manufacturing_expense_locks`;
CREATE TABLE `manufacturing_expense_locks` (
    `id` int NOT NULL AUTO_INCREMENT,
    `month` int NOT NULL,
    `year` int NOT NULL,
    `locked_by` varchar(100) NOT NULL,
    `locked_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `lock_reason` varchar(255) DEFAULT 'Month-end closing',
    `unlocked_by` varchar(100) DEFAULT NULL,
    `unlocked_at` datetime DEFAULT NULL,
    `unlock_reason` varchar(255) DEFAULT NULL,
    `status` enum('locked','unlocked') DEFAULT 'locked',
    `user_id` int NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_lock` (`month`,`year`,`user_id`),
    CONSTRAINT `fk_man_lock_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Advances
DROP TABLE IF EXISTS `manufacturing_advances`;
CREATE TABLE `manufacturing_advances` (
    `id` int NOT NULL AUTO_INCREMENT,
    `member_id` int NOT NULL,
    `amount` decimal(15,2) NOT NULL,
    `advance_date` date NOT NULL,
    `reason` varchar(255) DEFAULT NULL,
    `total_deducted` decimal(15,2) DEFAULT '0.00',
    `balance` decimal(15,2) DEFAULT '0.00',
    `monthly_deduction` decimal(15,2) DEFAULT '0.00',
    `status` enum('active','fully_paid','cancelled') DEFAULT 'active',
    `user_id` int NOT NULL,
    `created_by` varchar(100) NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_member` (`member_id`),
    CONSTRAINT `fk_man_adv_memb` FOREIGN KEY (`member_id`) REFERENCES `manufacturing_members` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_man_adv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Payroll Settings
DROP TABLE IF EXISTS `manufacturing_payroll_settings`;
CREATE TABLE `manufacturing_payroll_settings` (
    `id` int NOT NULL AUTO_INCREMENT,
    `working_days_per_month` int DEFAULT '26',
    `working_hours_per_day` int DEFAULT '8',
    `working_hours_per_month` int DEFAULT '208',
    `overtime_multiplier` decimal(5,2) DEFAULT '1.50',
    `auto_deduct_advances` tinyint(1) DEFAULT '1',
    `advance_deduction_percentage` int DEFAULT '100',
    `expense_approval_threshold` decimal(15,2) DEFAULT '10000.00',
    `payroll_requires_approval` tinyint(1) DEFAULT '1',
    `user_id` int NOT NULL,
    `updated_by` varchar(100) DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_settings` (`user_id`),
    CONSTRAINT `fk_man_set_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- IT SECTOR TABLES
-- ==========================================

-- IT Projects
DROP TABLE IF EXISTS `it_projects`;
CREATE TABLE `it_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_it_proj_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Members
DROP TABLE IF EXISTS `it_members`;
CREATE TABLE `it_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `wage_type` enum('daily','monthly','piece_rate') DEFAULT 'daily',
  `daily_wage` decimal(15,2) DEFAULT '0.00',
  `member_type` enum('employee','worker') DEFAULT 'worker',
  `project_id` int DEFAULT NULL,
  `employment_type` enum('Full-time','Contract','Intern') DEFAULT 'Full-time',
  `expected_hours` decimal(4,2) DEFAULT '8.00',
  `work_location` enum('Office','Remote','Hybrid') DEFAULT 'Office',
  `is_billable` tinyint(1) DEFAULT '1',
  `reporting_manager_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_it_memb_manager` (`reporting_manager_id`),
  CONSTRAINT `fk_it_memb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_memb_proj` FOREIGN KEY (`project_id`) REFERENCES `it_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_memb_manager` FOREIGN KEY (`reporting_manager_id`) REFERENCES `it_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Attendance
DROP TABLE IF EXISTS `it_attendance`;
CREATE TABLE `it_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `status` enum('present','absent','late','half-day','permission','week_off','holiday', 'CL', 'SL', 'EL', 'OD') NOT NULL,
  `subject` varchar(255) DEFAULT 'Daily Attendance',
  `date` date NOT NULL,
  `note` text,
  `project_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `total_hours` decimal(4,2) DEFAULT '0.00',
  `work_mode` enum('Office','WFH','On-site') DEFAULT 'Office',
  `permission_duration` varchar(100) DEFAULT NULL,
  `permission_start_time` varchar(20) DEFAULT NULL,
  `permission_end_time` varchar(20) DEFAULT NULL,
  `permission_reason` text,
  `overtime_duration` varchar(100) DEFAULT NULL,
  `overtime_reason` text,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_it_att_proj` (`project_id`),
  KEY `fk_it_att_memb` (`member_id`),
  CONSTRAINT `fk_it_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_att_proj` FOREIGN KEY (`project_id`) REFERENCES `it_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_att_memb` FOREIGN KEY (`member_id`) REFERENCES `it_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Reminders
DROP TABLE IF EXISTS `it_reminders`;
CREATE TABLE `it_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` datetime DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `is_completed` tinyint(1) DEFAULT '0',
  `category` varchar(50) DEFAULT 'General',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_it_remind_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- IT Notes
DROP TABLE IF EXISTS `it_notes`;
CREATE TABLE `it_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `color` varchar(20) DEFAULT 'yellow',
  `is_pinned` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_it_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- IT Member Roles
DROP TABLE IF EXISTS `it_member_roles`;
CREATE TABLE `it_member_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_it_role` (`user_id`,`name`),
  CONSTRAINT `fk_it_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Timesheets
DROP TABLE IF EXISTS `it_timesheets`;
CREATE TABLE `it_timesheets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `task_description` text NOT NULL,
  `hours_spent` decimal(4,2) DEFAULT '0.00',
  `is_billable` tinyint(1) DEFAULT '1',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `member_id` (`member_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `fk_it_ts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_ts_memb` FOREIGN KEY (`member_id`) REFERENCES `it_members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_ts_proj` FOREIGN KEY (`project_id`) REFERENCES `it_projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Leaves
DROP TABLE IF EXISTS `it_leaves`;
CREATE TABLE `it_leaves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int NOT NULL,
  `leave_type` enum('Sick','Casual','Emergency','Privilege','Other') DEFAULT 'Casual',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `member_id` (`member_id`),
  CONSTRAINT `fk_it_leave_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_leave_memb` FOREIGN KEY (`member_id`) REFERENCES `it_members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Audit Logs
DROP TABLE IF EXISTS `it_audit_logs`;
CREATE TABLE `it_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `details` text,
  `performed_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_it_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Transactions
DROP TABLE IF EXISTS `it_transactions`;
CREATE TABLE `it_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `category_id` int DEFAULT NULL,
  `date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `project_id` int DEFAULT NULL,
  `member_id` int DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT 'completed',
  `guest_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT '1.00',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_it_trans_proj` (`project_id`),
  KEY `fk_it_trans_memb` (`member_id`),
  KEY `fk_it_trans_cat` (`category_id`),
  CONSTRAINT `fk_it_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_trans_proj` FOREIGN KEY (`project_id`) REFERENCES `it_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_trans_memb` FOREIGN KEY (`member_id`) REFERENCES `it_members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_trans_cat` FOREIGN KEY (`category_id`) REFERENCES `it_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Categories
DROP TABLE IF EXISTS `it_categories`;
CREATE TABLE `it_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(20) DEFAULT '#2d5bff',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_itcat` (`user_id`,`name`),
  CONSTRAINT `fk_it_cat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- Personal Budgets
DROP TABLE IF EXISTS `personal_budgets`;
CREATE TABLE `personal_budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount_limit` decimal(15,2) NOT NULL,
  `period` enum('monthly','yearly') DEFAULT 'monthly',
  `month` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_cat_period` (`user_id`, `category`, `period`, `month`, `year`),
  CONSTRAINT `fk_p_bud_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- EDUCATION SECTOR TABLES
-- ==========================================

-- Education Members (Teachers, Staff, Students)
DROP TABLE IF EXISTS `education_members`;
CREATE TABLE `education_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `staff_id` varchar(50) DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `subjects` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `wage_type` enum('daily','monthly','piece_rate') DEFAULT 'monthly',
  `daily_wage` decimal(15,2) DEFAULT '0.00',
  `member_type` enum('employee','worker','student') DEFAULT 'employee',
  `employment_type` enum('permanent','contract','visiting','part_time') DEFAULT 'permanent',
  `date_of_joining` date DEFAULT NULL,
  `reporting_manager_id` int DEFAULT NULL,
  `shift_start_time` time DEFAULT NULL,
  `shift_end_time` time DEFAULT NULL,
  `cl_balance` decimal(5,2) DEFAULT '0.00',
  `sl_balance` decimal(5,2) DEFAULT '0.00',
  `el_balance` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_edu_memb_manager` (`reporting_manager_id`),
  CONSTRAINT `fk_edu_memb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_edu_memb_manager` FOREIGN KEY (`reporting_manager_id`) REFERENCES `education_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Attendance
DROP TABLE IF EXISTS `education_attendance`;
CREATE TABLE `education_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `status` enum('present','absent','late','half-day','permission','week_off','holiday','CL','SL','EL','OD') NOT NULL,
  `subject` varchar(255) DEFAULT 'Daily Attendance',
  `date` date NOT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `permission_duration` varchar(100) DEFAULT NULL,
  `permission_start_time` varchar(20) DEFAULT NULL,
  `permission_end_time` varchar(20) DEFAULT NULL,
  `permission_reason` text,
  `overtime_duration` varchar(100) DEFAULT NULL,
  `overtime_reason` text,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_edu_att_memb` (`member_id`),
  CONSTRAINT `fk_edu_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_edu_att_memb` FOREIGN KEY (`member_id`) REFERENCES `education_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Reminders
DROP TABLE IF EXISTS `education_reminders`;
CREATE TABLE `education_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` datetime DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `is_completed` tinyint(1) DEFAULT '0',
  `category` varchar(50) DEFAULT 'General',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_edu_remind_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Education Notes
DROP TABLE IF EXISTS `education_notes`;
CREATE TABLE `education_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `color` varchar(20) DEFAULT 'yellow',
  `is_pinned` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_edu_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Education Member Roles
DROP TABLE IF EXISTS `education_member_roles`;
CREATE TABLE `education_member_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_edu_role` (`user_id`,`name`),
  CONSTRAINT `fk_edu_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Transactions (Fees, Salaries, Expenses)
DROP TABLE IF EXISTS `education_transactions`;
CREATE TABLE `education_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `category_id` int DEFAULT NULL,
  `date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `member_id` int DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT 'completed',
  `guest_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT '1.00',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `description` text DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT 'Cash',
  `remarks` text DEFAULT NULL,
  `bill_image` varchar(255) DEFAULT NULL,
  `approval_status` enum('pending', 'approved', 'rejected') DEFAULT 'approved',
  `approval_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_edu_trans_memb` (`member_id`),
  KEY `fk_edu_trans_cat` (`category_id`),
  KEY `fk_edu_trans_vend` (`vendor_id`),
  KEY `fk_edu_trans_dept` (`department_id`),
  CONSTRAINT `fk_edu_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_edu_trans_memb` FOREIGN KEY (`member_id`) REFERENCES `education_members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_edu_trans_cat` FOREIGN KEY (`category_id`) REFERENCES `education_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_edu_trans_vend` FOREIGN KEY (`vendor_id`) REFERENCES `education_vendors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_edu_trans_dept` FOREIGN KEY (`department_id`) REFERENCES `education_departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Categories
DROP TABLE IF EXISTS `education_categories`;
CREATE TABLE `education_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(20) DEFAULT '#2d5bff',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_educat` (`user_id`,`name`),
  CONSTRAINT `fk_edu_cat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Education Departments
DROP TABLE IF EXISTS `education_departments`;
CREATE TABLE `education_departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_edu_dept` (`user_id`,`name`),
  CONSTRAINT `fk_edu_dept_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Vendors
DROP TABLE IF EXISTS `education_vendors`;
CREATE TABLE `education_vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `category` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_edu_vend_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Payroll
DROP TABLE IF EXISTS `education_payroll`;
CREATE TABLE `education_payroll` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `working_days` int DEFAULT 0,
  `present_days` decimal(5,2) DEFAULT 0,
  `absent_days` decimal(5,2) DEFAULT 0,
  `half_days` int DEFAULT 0,
  `lop_days` decimal(5,2) DEFAULT 0,
  `cl_used` decimal(5,2) DEFAULT 0,
  `sl_used` decimal(5,2) DEFAULT 0,
  `el_used` decimal(5,2) DEFAULT 0,
  `base_salary` decimal(15,2) DEFAULT 0,
  `net_salary` decimal(15,2) DEFAULT 0,
  `bonus` decimal(15,2) DEFAULT 0,
  `deductions` decimal(15,2) DEFAULT 0,
  `status` enum('pending_approval', 'approved', 'paid') DEFAULT 'pending_approval',
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` datetime DEFAULT NULL,
  `transaction_id` int DEFAULT NULL,
  `is_locked` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `member_id` (`member_id`),
  KEY `fk_edu_pay_trans` (`transaction_id`),
  CONSTRAINT `fk_edu_pay_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_edu_pay_memb` FOREIGN KEY (`member_id`) REFERENCES `education_members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_edu_pay_trans` FOREIGN KEY (`transaction_id`) REFERENCES `education_transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Attendance Locks
DROP TABLE IF EXISTS `education_attendance_locks`;
CREATE TABLE `education_attendance_locks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `is_locked` tinyint(1) DEFAULT 1,
  `locked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `locked_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date_user` (`user_id`, `date`),
  CONSTRAINT `fk_edu_lock_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Education Audit Logs
DROP TABLE IF EXISTS `education_audit_logs`;
CREATE TABLE `education_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(255) NOT NULL,
  `module` varchar(100) NOT NULL,
  `details` text,
  `performed_by` int NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `fk_edu_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==========================================
-- HOTEL SECTOR TABLES
-- ==========================================

-- Hotel Projects
DROP TABLE IF EXISTS `hotel_projects`;
CREATE TABLE `hotel_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` enum('ongoing','completed','on-hold') DEFAULT 'ongoing',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_hotel_proj_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Members
DROP TABLE IF EXISTS `hotel_members`;
CREATE TABLE `hotel_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `wage_type` enum('daily','monthly','piece_rate') DEFAULT 'daily',
  `daily_wage` decimal(15,2) DEFAULT '0.00',
  `member_type` enum('staff','contractor','guest','other') DEFAULT 'staff',
  `project_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_hotel_memb_proj` (`project_id`),
  CONSTRAINT `fk_hotel_memb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hotel_memb_proj` FOREIGN KEY (`project_id`) REFERENCES `hotel_projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Holidays
DROP TABLE IF EXISTS `hotel_holidays`;
CREATE TABLE `hotel_holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `type` enum('National','Regional','Other') DEFAULT 'National',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_hotel_hol_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Transactions
DROP TABLE IF EXISTS `hotel_transactions`;
CREATE TABLE `hotel_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `category_id` int DEFAULT NULL,
  `category` varchar(50) DEFAULT 'Other',
  `date` datetime NOT NULL,
  `project_id` int DEFAULT NULL,
  `member_id` int DEFAULT NULL,
  `guest_name` varchar(255) DEFAULT NULL,
  `payment_status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `quantity` decimal(15,2) DEFAULT '1.00',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_hotel_trans_proj` (`project_id`),
  KEY `fk_hotel_trans_memb` (`member_id`),
  KEY `fk_hotel_trans_cat` (`category_id`),
  CONSTRAINT `fk_hotel_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hotel_trans_proj` FOREIGN KEY (`project_id`) REFERENCES `hotel_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hotel_trans_memb` FOREIGN KEY (`member_id`) REFERENCES `hotel_members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hotel_trans_cat` FOREIGN KEY (`category_id`) REFERENCES `hotel_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Attendance
DROP TABLE IF EXISTS `hotel_attendance`;
CREATE TABLE `hotel_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `status` enum('present','absent','late','half-day','week_off','holiday') NOT NULL,
  `date` date NOT NULL,
  `note` text,
  `project_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_hotel_att_memb` (`member_id`),
  KEY `fk_hotel_att_proj` (`project_id`),
  CONSTRAINT `fk_hotel_att_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hotel_att_memb` FOREIGN KEY (`member_id`) REFERENCES `hotel_members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hotel_att_proj` FOREIGN KEY (`project_id`) REFERENCES `hotel_projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Reminders
DROP TABLE IF EXISTS `hotel_reminders`;
CREATE TABLE `hotel_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` datetime DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `is_completed` tinyint(1) DEFAULT '0',
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_hotel_remind_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Notes
DROP TABLE IF EXISTS `hotel_notes`;
CREATE TABLE `hotel_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `color` varchar(20) DEFAULT 'yellow',
  `is_pinned` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_hotel_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Member Roles
DROP TABLE IF EXISTS `hotel_member_roles`;
CREATE TABLE `hotel_member_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_hotel_role` (`user_id`,`name`),
  CONSTRAINT `fk_hotel_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Hotel Categories
DROP TABLE IF EXISTS `hotel_categories`;
CREATE TABLE `hotel_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('income','expense') DEFAULT 'expense',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_hotel_cat` (`user_id`,`name`,`type`),
  CONSTRAINT `fk_hotel_cat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;


