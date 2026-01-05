-- Migration to generalize from worker to member terminology
-- This makes the application domain-agnostic for general attendance tracking

-- Step 1: Rename the workers table to members
ALTER TABLE workers RENAME TO members;

-- Step 2: Rename worker_id column to member_id in attendance table
ALTER TABLE attendance CHANGE COLUMN worker_id member_id INT DEFAULT NULL;

-- Step 3: Rename worker_id column to member_id in transactions table
ALTER TABLE transactions CHANGE COLUMN worker_id member_id INT DEFAULT NULL;

-- Note: Foreign key constraints should automatically update with the column rename
-- If you encounter issues, you may need to drop and recreate the foreign keys:

-- For attendance table:
-- ALTER TABLE attendance DROP FOREIGN KEY fk_attendance_worker;
-- ALTER TABLE attendance ADD CONSTRAINT fk_attendance_member 
--   FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

-- For transactions table:
-- ALTER TABLE transactions DROP FOREIGN KEY fk_transactions_worker;
-- ALTER TABLE transactions ADD CONSTRAINT fk_transactions_member 
--   FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;
