# Generalization from Worker to Member Terminology

## Overview
This migration generalizes the application from "worker" terminology to "member" terminology, making it domain-agnostic and suitable for general attendance tracking across different use cases (students, staff, team members, etc.).

## Database Changes

### Tables Renamed
- `workers` → `members`

### Columns Renamed
- `attendance.worker_id` → `attendance.member_id`
- `transactions.worker_id` → `transactions.member_id`

### Migration Script
Run the SQL migration script located at:
```
server/migrations/generalize_to_members.sql
```

**Important:** Back up your database before running the migration!

## Backend Changes

### Models
- `server/src/models/memberModel.js` - Updated all SQL queries to use `members` table
- `server/src/models/attendanceModel.js` - Updated to use `member_id` and `members` table
  - Renamed `getWorkerSummary()` → `getMemberSummary()`
- `server/src/models/transactionModel.js` - Updated to use `member_id` and `members` table
  - Renamed `getWorkerProjectStats()` → `getMemberProjectStats()`

### Controllers
- `server/src/controllers/attendanceController.js`
  - Updated parameter names: `workerId` → `memberId`
  - Renamed function: `getWorkerSummary` → `getMemberSummary`
- `server/src/controllers/transactionController.js`
  - Updated parameter names: `worker_id` → `member_id`, `workerId` → `memberId`
  - Updated response field: `workerProjects` → `memberProjects`

### Routes
- `server/src/routes/attendanceRoutes.js`
  - Updated import and route handler: `getWorkerSummary` → `getMemberSummary`

## Frontend Changes

### API Layer
- `client/src/api/memberApi.js` - Already using member terminology (previously created)
- `client/src/api/attendanceApi.js` - Updated to use `getMemberSummary`

### Components
- `client/src/components/MemberManager.jsx` - Generalized component for managing members
  - Updated all UI labels from "worker" to "member"
  - Updated API calls to use `memberId` instead of `workerId`
- `client/src/components/WorkerManager.jsx` - **DEPRECATED** (can be removed)

### Pages
- `client/src/pages/AttendanceTracker.jsx`
  - Updated all API calls to use `memberId` instead of `workerId`
  - Updated data fields: `worker_name` → `member_name`, `worker_id` → `member_id`
  - Updated UI labels and filter names
  
- `client/src/pages/ExpenseTracker.jsx`
  - Updated all references: `filterWorker` → `filterMember`
  - Updated data fields: `worker_name` → `member_name`, `worker_id` → `member_id`
  - Updated stats: `workerStats` → `memberStats`
  - Updated UI labels: "Worker Ledger" → "Member Ledger"

## Migration Steps

1. **Backup Database**
   ```bash
   mysqldump -u your_username -p your_database > backup.sql
   ```

2. **Run Migration Script**
   ```bash
   mysql -u your_username -p your_database < server/migrations/generalize_to_members.sql
   ```

3. **Restart Backend Server**
   ```bash
   cd server
   npm run dev
   ```

4. **Clear Browser Cache** (if needed)
   - The frontend changes are backward compatible with the new API

5. **Verify Functionality**
   - Test member management (add/edit/delete)
   - Test attendance tracking with members
   - Test expense tracking with member filtering
   - Test report generation

## API Changes Summary

### Request Parameters
- `workerId` → `memberId` (in query parameters and request bodies)
- `worker_id` → `member_id` (in request bodies)

### Response Fields
- `worker_name` → `member_name`
- `worker_id` → `member_id`
- `workerProjects` → `memberProjects`

## UI Changes

### Labels Updated
- "Workers" → "Members"
- "Worker" → "Member"
- "Manage Workers" → "Manage Members"
- "Worker Ledger" → "Member Ledger"
- "Worker Summary" → "Member Summary"

### Placeholders Updated
- "Worker name" → "Member name"
- "e.g. Developer, Designer" → "e.g. Student, Staff, Regular"

## Backward Compatibility

⚠️ **Breaking Changes:**
- The database schema has changed - old API calls using `workerId` will need to be updated
- Frontend components must be updated to use the new member terminology

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Backend server starts without errors
- [ ] Member CRUD operations work correctly
- [ ] Attendance tracking with members functions properly
- [ ] Expense tracking with member filtering works
- [ ] Reports generate correctly with member data
- [ ] All UI labels display "member" instead of "worker"
- [ ] Export functions (PDF/CSV/TXT) include member information correctly

## Rollback Plan

If you need to rollback:

1. Restore database from backup:
   ```bash
   mysql -u your_username -p your_database < backup.sql
   ```

2. Revert code changes using git:
   ```bash
   git revert <commit-hash>
   ```

## Notes

- The term "member" is more generic and can represent workers, students, staff, team members, or any other type of person being tracked
- All foreign key relationships have been preserved
- Past data remains intact with the new terminology
- The application is now more suitable for various domains beyond just worker management
