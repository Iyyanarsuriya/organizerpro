# 🔧 API 404 Error Fix - IT Sector Members

**Issue:** Getting 404 error for `/api/it-sector/members`  
**Status:** Server restart required

---

## Problem

The IT Expense Tracker is showing 404 errors for member-related API calls because the server hasn't reloaded the new route configurations.

---

## Solution: Restart the Server

### Step 1: Stop the Server
1. Go to the terminal running the server
2. Press `Ctrl + C` to stop the server

### Step 2: Restart the Server
```bash
cd server
npm run dev
```

### Step 3: Verify Server Started
You should see:
```
Server running on port 5001
```

---

## Why This Happened

When we added the new routes to `server/src/app.js`, the changes were saved to the file, but Node.js doesn't automatically reload route configurations. The server needs to be restarted to pick up these changes.

---

## Routes That Were Added

The following routes are now configured for IT sector:

```javascript
// IT Sector Routes
itRouter.use('/members', require("./routes/Manufacturing/memberRoutes"));
itRouter.use('/member-roles', require("./routes/Manufacturing/memberRoleRoutes"));
itRouter.use('/projects', require("./routes/Manufacturing/projectRoutes"));
itRouter.use('/categories', categoryRoutes);
itRouter.use('/notes', require("./routes/Personal/noteRoutes"));
```

---

## After Restart - Test These Endpoints

### 1. Members API
```
GET  /api/it-sector/members
POST /api/it-sector/members
PUT  /api/it-sector/members/:id
DELETE /api/it-sector/members/:id
GET  /api/it-sector/members/active
```

### 2. Projects API
```
GET  /api/it-sector/projects
POST /api/it-sector/projects
DELETE /api/it-sector/projects/:id
```

### 3. Categories API
```
GET  /api/it-sector/categories
POST /api/it-sector/categories
DELETE /api/it-sector/categories/:id
```

---

## Verification Steps

After restarting the server:

1. **Refresh the IT Expense Tracker page**
2. **Check browser console** - Should see no 404 errors
3. **Test functionality:**
   - View transactions
   - Add/edit categories
   - Manage projects
   - View team members

---

## If Still Getting Errors

### Check 1: Server is Running
```bash
# In server directory
npm run dev
```

### Check 2: Correct Port
- Server should be on port 5001
- Client should be on port 5173
- Check `server/.env` for PORT configuration

### Check 3: Database Connection
- Ensure MySQL is running
- Check database credentials in `server/.env`

### Check 4: Clear Browser Cache
- Hard refresh: `Ctrl + Shift + R`
- Or clear browser cache completely

---

## Quick Restart Script

For future reference, you can create a restart script:

**Windows (PowerShell):**
```powershell
# restart-server.ps1
cd server
npm run dev
```

**Usage:**
```powershell
.\restart-server.ps1
```

---

## Alternative: Use Nodemon

To avoid manual restarts in the future, you can use nodemon:

```bash
# Install nodemon
npm install -D nodemon

# Update package.json
"scripts": {
  "dev": "nodemon src/server.js"
}
```

This will automatically restart the server when files change.

---

## Summary

✅ **Routes are configured correctly** in `app.js`  
⚠️ **Server restart required** to load new routes  
🔄 **After restart:** All IT sector APIs will work  

---

**Next Step:** Restart the server and refresh the browser!
