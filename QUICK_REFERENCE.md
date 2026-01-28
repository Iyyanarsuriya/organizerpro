# 📚 OrganizerPro - Quick Reference Guide

## Database Schema Overview

**Total Tables:** 32  
**Schema File:** `server/database/schema.sql`

### Table Breakdown by Sector

| Sector | Tables | Prefix |
|--------|--------|--------|
| Shared | 2 | - |
| Personal | 4 | `personal_` |
| Manufacturing | 11 | `manufacturing_` |
| IT | 8 | `it_` |
| Education | 7 | `education_` |

---

## API Endpoint Structure

### Pattern
```
/api/{sector}-sector/{resource}
```

### Examples
- Personal: `/api/reminders`, `/api/notes`, `/api/transactions`
- Manufacturing: `/api/manufacturing-sector/attendance`
- IT: `/api/it-sector/members`
- Education: `/api/education-sector/departments`

---

## Backend Architecture

### Controllers (`server/src/controllers/`)
```
Common/
  ├── authController.js
  ├── categoryController.js
  ├── expenseCategoryController.js
  ├── pushController.js
  └── transactionController.js

Personal/
  ├── noteController.js
  ├── reminderController.js
  └── vehicleLogController.js

Manufacturing/
  ├── attendanceController.js
  ├── dailyWorkLogController.js
  ├── memberController.js
  ├── memberRoleController.js
  ├── projectController.js
  ├── teamController.js
  └── workTypeController.js

IT/
  └── attendanceController.js

Education/
  ├── attendanceController.js
  └── departmentController.js
```

### Models (`server/src/models/`)
All models support sector-based table selection via `getTableName(sector)` function.

---

## Frontend API Services

### Structure (`client/src/api/`)
```
Attendance/
  ├── attendanceApi.js (Hotel only)
  ├── eduAttendance.js
  ├── itAttendance.js
  └── mfgAttendance.js

Expense/
  ├── eduExpense.js
  ├── itExpense.js
  ├── mfgExpense.js
  └── personalExpense.js

Reminder/
  ├── eduReminder.js
  ├── itReminder.js
  ├── mfgReminder.js
  └── personalReminder.js

TeamManagement/
  ├── teamApi.js (Hotel only)
  ├── eduTeam.js
  ├── itTeam.js
  └── mfgTeam.js
```

---

## Common Operations

### Adding a New Sector

1. **Database:**
   - Add tables to `schema.sql` with `{sector}_` prefix
   - Follow naming convention: `{sector}_{resource}`

2. **Backend:**
   - Update models to include new sector in `getTableName()`
   - Create sector-specific controllers if needed
   - Add routes in `server/src/app.js`

3. **Frontend:**
   - Create API service file: `{sectorName}{Resource}.js`
   - Update components to use sector-specific APIs

### Sector Parameter Flow

```
Frontend Component
  ↓ (passes sector prop)
API Service
  ↓ (includes sector in request)
Backend Route
  ↓ (injects sector via middleware)
Controller
  ↓ (passes sector to model)
Model
  ↓ (selects correct table)
Database
```

---

## Key Features by Sector

### Personal
- ✅ Reminders with categories
- ✅ Notes with colors and pinning
- ✅ Income/expense transactions
- ✅ Vehicle logs (manufacturing)

### Manufacturing
- ✅ Employee attendance tracking
- ✅ Project management
- ✅ Work logs and types
- ✅ Vehicle tracking
- ✅ Member roles and management
- ✅ Expense categories
- ✅ Financial transactions

### IT
- ✅ Team attendance
- ✅ Project management
- ✅ Member roles
- ✅ Categories for expenses
- ✅ Financial transactions
- ✅ Notes and reminders

### Education
- ✅ Student/staff attendance
- ✅ Department management
- ✅ Member roles
- ✅ Financial transactions
- ✅ Categories
- ✅ Notes and reminders

---

## Useful Commands

### Database
```bash
# View all tables
mysql -u root -p organizer_pro -e "SHOW TABLES;"

# Reset database
node server/scripts/reset_db.js
```

### Development
```bash
# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev
```

---

## Documentation Files

- `FINAL_CLEANUP_SUMMARY.md` - Complete cleanup report
- `DATABASE_CLEANUP_SUMMARY.md` - Database changes
- `CLEANUP_COMPLETE.md` - Step-by-step cleanup
- `QUICK_REFERENCE.md` - This file
- `schema.sql` - Database schema with table of contents

---

**Last Updated:** January 28, 2026  
**Version:** 2.0 (Post-Cleanup)
