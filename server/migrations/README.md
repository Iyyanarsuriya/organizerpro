# Database Migration: Worker → Member

## Quick Start

### Step 1: Get Railway Database Credentials

1. Go to your [Railway Dashboard](https://railway.app/)
2. Click on your MySQL database service
3. Go to the "Variables" or "Connect" tab
4. Copy the connection details:
   - `MYSQLHOST` → DB_HOST
   - `MYSQLUSER` → DB_USER
   - `MYSQLPASSWORD` → DB_PASSWORD
   - `MYSQLDATABASE` → DB_NAME

### Step 2: Update .env File

Create or update `server/.env` with your Railway credentials:

```env
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=your-password-here
DB_NAME=railway
PORT=5000
```

⚠️ **IMPORTANT:** Make sure you're using the **production Railway database credentials**, not your local database!

### Step 3: Run Migration

```bash
cd server
node run-migration.js
```

The script will:
1. Connect to Railway database
2. Show you the SQL that will be executed
3. Wait 5 seconds (you can press Ctrl+C to cancel)
4. Execute the migration
5. Verify everything worked

### Expected Output

```
🔄 Connecting to database...
Host: containers-us-west-xxx.railway.app
Database: railway
✅ Connected to database successfully!

📄 Migration SQL:
──────────────────────────────────────────────────
ALTER TABLE workers RENAME TO members;
ALTER TABLE attendance CHANGE COLUMN worker_id member_id INT DEFAULT NULL;
ALTER TABLE transactions CHANGE COLUMN worker_id member_id INT DEFAULT NULL;
──────────────────────────────────────────────────

⚠️  WARNING: This will modify your database!
Press Ctrl+C within 5 seconds to cancel...

🚀 Executing migration...

✅ Migration completed successfully!

🔍 Verifying migration...

✅ members table exists
✅ attendance.member_id column exists
✅ transactions.member_id column exists

🎉 Migration verification complete!
```

## After Migration

Once the migration is complete:

1. Your production database will have:
   - ✅ `members` table (renamed from `workers`)
   - ✅ `attendance.member_id` column (renamed from `worker_id`)
   - ✅ `transactions.member_id` column (renamed from `worker_id`)

2. Your backend API will work correctly:
   - ✅ `/api/members/active`
   - ✅ `/api/attendance/summary`
   - ✅ `/api/attendance`

3. Test your application to ensure everything works!

## Troubleshooting

### Error: "Table 'workers' doesn't exist"
**Solution:** Migration has already been run. Your database is already updated!

### Error: "Unknown column 'worker_id'"
**Solution:** Migration has already been run. Your database is already updated!

### Error: "Access denied"
**Solution:** Double-check your Railway database credentials in the `.env` file.

### Error: "Can't connect to MySQL server"
**Solution:** 
- Verify your Railway database is running
- Check that the `DB_HOST` is correct
- Ensure your IP is whitelisted in Railway (if applicable)

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
ALTER TABLE members RENAME TO workers;
ALTER TABLE attendance CHANGE COLUMN member_id worker_id INT DEFAULT NULL;
ALTER TABLE transactions CHANGE COLUMN member_id worker_id INT DEFAULT NULL;
```

## Safety Notes

- ✅ The script shows you the SQL before executing
- ✅ You have 5 seconds to cancel (Ctrl+C)
- ✅ The script verifies the migration was successful
- ⚠️ **Always backup your database before running migrations!**
