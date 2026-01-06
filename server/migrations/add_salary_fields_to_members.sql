ALTER TABLE members
ADD COLUMN wage_type ENUM('daily', 'monthly', 'piece_rate') DEFAULT 'daily',
ADD COLUMN daily_wage DECIMAL(10, 2) DEFAULT 0.00;
