# Production Deployment Guide - Member Migration

## ⚠️ Current Issue

Your production backend on Vercel/Render is showing these errors:
- `Unknown column 'a.member_id' in 'on clause'` - Database still has `worker_id` column
- `500 Internal Server Error` for `/api/attendance/summary` - Database still has `workers` table

**Root Cause:** The production database (Railway) hasn't been migrated from `workers` to `members` yet.

---

## 🔧 Solution: Deploy Migration to Production

### Option 1: Use Automated Migration Script (Recommended & Easiest)

We've created a script that will safely run the migration on your Railway database.

#### Step 1: Update Your .env File

Make sure your `server/.env` file has the **Railway production database credentials**:

```env
DB_HOST=your-railway-db-host.railway.app
DB_USER=root
DB_PASSWORD=your-railway-db-password
DB_NAME=railway
```

#### Step 2: Run the Migration Script

```bash
cd server
node run-migration.js
```

The script will:
- ✅ Connect to your Railway database
- ✅ Show you the SQL that will be executed
- ✅ Wait 5 seconds (giving you time to cancel with Ctrl+C)
- ✅ Execute the migration
- ✅ Verify the migration was successful

#### Step 3: Verify

The script will automatically verify that:
- `members` table exists
- `attendance.member_id` column exists
- `transactions.member_id` column exists

---

### Option 2: Run Migration Directly on Railway Database

#### Step 1: Connect to Railway Database

You need to run the migration SQL on your Railway database. You can do this in several ways:

**A. Using MySQL Client:**
```bash
mysql -h <your-railway-db-host> -u root -p <database-name> < server/migrations/generalize_to_members.sql
```

**B. Using Railway Dashboard:**
1. Go to your Railway dashboard
2. Navigate to your MySQL database service
3. Click on the "Data" tab or use the connection string
4. Run the migration SQL manually

**C. Using a Database GUI Tool (e.g., MySQL Workbench, DBeaver, TablePlus):**
1. Connect to your Railway database using the credentials from Railway dashboard
2. Open `server/migrations/generalize_to_members.sql`
3. Execute the SQL script

#### Step 2: Verify Migration

After running the migration, verify it worked:

```sql
-- Check if members table exists
SHOW TABLES LIKE 'members';

-- Check attendance table structure
DESCRIBE attendance;

-- Check transactions table structure  
DESCRIBE transactions;
```

You should see:
- ✅ `members` table exists
- ✅ `attendance.member_id` column exists
- ✅ `transactions.member_id` column exists

---

### Option 2: Create a Migration Endpoint (Quick Fix)

If you can't access the production database directly, create a one-time migration endpoint:

#### Step 1: Create Migration Endpoint

Create `server/src/routes/migrationRoutes.js`:

\`\`\`javascript
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// ONE-TIME USE ONLY - Remove after migration
router.post('/run-member-migration', async (req, res) => {
    try {
        // Read migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, '../migrations/generalize_to_members.sql'),
            'utf8'
        );

        // Execute migration
        await db.query(migrationSQL);

        res.json({ 
            success: true, 
            message: 'Migration completed successfully!' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
\`\`\`

#### Step 2: Add Route to app.js

Add this line to `server/src/app.js`:
\`\`\`javascript
app.use('/api/migration', require('./routes/migrationRoutes'));
\`\`\`

#### Step 3: Deploy to Render

Push your code to GitHub (Render will auto-deploy)

#### Step 4: Run Migration

Make a POST request to:
\`\`\`
https://reminderapp-backend-f2hb.onrender.com/api/migration/run-member-migration
\`\`\`

#### Step 5: Remove Migration Endpoint

After successful migration, remove the migration route and redeploy.

---

### Option 3: Manual SQL Execution via Render Shell

1. Go to Render Dashboard → Your Web Service
2. Click "Shell" tab
3. Connect to your database:
   \`\`\`bash
   mysql -h <host> -u <user> -p<password> <database>
   \`\`\`
4. Run these commands:
   \`\`\`sql
   ALTER TABLE workers RENAME TO members;
   ALTER TABLE attendance CHANGE COLUMN worker_id member_id INT DEFAULT NULL;
   ALTER TABLE transactions CHANGE COLUMN worker_id member_id INT DEFAULT NULL;
   \`\`\`

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] **Backup Production Database** (CRITICAL!)
- [ ] Test migration on a staging database first (if available)
- [ ] Ensure all code changes are committed to Git
- [ ] Verify local build works: `npm run build` (in client folder)
- [ ] Check that all environment variables are set in Render

---

## 🚀 Deployment Steps

### 1. Commit and Push Changes

\`\`\`bash
git add .
git commit -m "feat: Generalize from worker to member terminology"
git push origin main
\`\`\`

### 2. Render Auto-Deploy

Render will automatically detect the push and start deploying.

### 3. Run Database Migration

Choose one of the options above to run the migration on production database.

### 4. Verify Deployment

Test these endpoints:
- ✅ `GET /api/members/active`
- ✅ `GET /api/attendance/summary`
- ✅ `GET /api/attendance`

---

## 🔍 Troubleshooting

### Error: "Table 'workers' doesn't exist"
**Solution:** Migration hasn't been run on production database yet.

### Error: "Unknown column 'worker_id'"
**Solution:** Migration partially completed. Run the column rename commands.

### Error: "404 Not Found for /api/members"
**Solution:** Code not deployed to Render yet. Push to GitHub and wait for deployment.

---

## 📞 Quick Fix for Immediate Testing

If you need to test immediately without waiting for production migration:

1. **Temporarily point your frontend to local backend:**
   - Update `client/src/api/axiosInstance.js`
   - Change `API_URL` to `http://localhost:5000`

2. **Or use a different environment variable:**
   - Set `VITE_API_URL=http://localhost:5000` for local testing
   - Keep production URL for deployment

---

## ✅ Post-Migration Verification

After migration, test these features:
1. Member management (add/edit/delete)
2. Attendance tracking with members
3. Expense tracking with member filtering
4. Report generation with member data

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

\`\`\`sql
ALTER TABLE members RENAME TO workers;
ALTER TABLE attendance CHANGE COLUMN member_id worker_id INT DEFAULT NULL;
ALTER TABLE transactions CHANGE COLUMN member_id worker_id INT DEFAULT NULL;
\`\`\`

Then redeploy the previous version of your code.

---

**Need Help?** 
- Check Render logs for detailed error messages
- Verify database connection in Render dashboard
- Ensure migration SQL file is included in your deployment
