-- Database Schema V2: Sector Isolation
-- Generated for multi-sector support

SET FOREIGN_KEY_CHECKS = 0;

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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_man_memb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_man_memb_proj` FOREIGN KEY (`project_id`) REFERENCES `manufacturing_projects` (`id`) ON DELETE SET NULL
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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_man_trans_proj` (`project_id`),
  KEY `fk_man_trans_memb` (`member_id`),
  CONSTRAINT `fk_man_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_man_trans_proj` FOREIGN KEY (`project_id`) REFERENCES `manufacturing_projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_man_trans_memb` FOREIGN KEY (`member_id`) REFERENCES `manufacturing_members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Manufacturing Attendance
DROP TABLE IF EXISTS `manufacturing_attendance`;
CREATE TABLE `manufacturing_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `status` enum('present','absent','late','half-day','permission') NOT NULL,
  `date` date NOT NULL,
  `note` text,
  `project_id` int DEFAULT NULL,
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
  UNIQUE KEY `unique_man_role` (`user_id`,`name`)
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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_it_memb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_memb_proj` FOREIGN KEY (`project_id`) REFERENCES `it_projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- IT Attendance
DROP TABLE IF EXISTS `it_attendance`;
CREATE TABLE `it_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `status` enum('present','absent','late','half-day','permission','week_off','holiday') NOT NULL,
  `subject` varchar(255) DEFAULT 'Daily Attendance',
  `date` date NOT NULL,
  `note` text,
  `project_id` int DEFAULT NULL,
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

-- IT Member Roles
DROP TABLE IF EXISTS `it_member_roles`;
CREATE TABLE `it_member_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_it_role` (`user_id`,`name`)
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

SET FOREIGN_KEY_CHECKS = 1;

