# Education Sector Module - Comprehensive Test Plan

This document outlines the test strategy and specific test cases for the Education Sector module, focusing on Reminders, Attendance, Expenses, and Team Management.

## 1. Reminders Module

### 1.1 Create Reminder
- **Case 1.1.1: Valid Creation**
  - **Input:** Title="Meeting", Date=Future Date, Priority="High".
  - **Expected:** Reminder created successfully. Appears in list.
- **Case 1.1.2: Past Date Validation**
  - **Input:** Title="Past Task", Date=Yesterday.
  - **Expected:** Error "Due date cannot be in the past".
- **Case 1.1.3: Missing Title**
  - **Input:** Title="", Date=Future.
  - **Expected:** Client-side validation prevents submit. Backend returns 400.

### 1.2 Update Reminder (Edit)
- **Case 1.2.1: Full Update**
  - **Input:** Edit existing reminder. Change Title, Description, Date, Priority.
  - **Expected:** Reminder updated with new details. Modal closes. List refreshes.
- **Case 1.2.2: Mark Complete**
  - **Action:** Toggle checkbox.
  - **Expected:** Status changes to "completed". Visual strikethrough.
- **Case 1.2.3: Update with Past Date**
  - **Input:** Edit reminder, set Date=Yesterday.
  - **Expected:** Error "Due date cannot be in the past". No change saved.

### 1.3 Delete Reminder
- **Case 1.3.1: Delete Completed**
  - **Action:** Delete a completed reminder.
  - **Expected:** Reminder removed from list.
- **Case 1.3.2: Delete Incomplete**
  - **Action:** Try to delete incomplete.
  - **Expected:** Button disabled (UI). Backend returns 403/400 if attempted via API.

## 2. Attendance Module

### 2.1 Mark Attendance
- **Case 2.1.1: Single Mark (Create)**
  - **Input:** Member="John Doe", Date=Today, Status="Present".
  - **Expected:** Attendance recorded.
- **Case 2.1.2: Duplicate Entry Prevention**
  - **Input:** Try to mark "John Doe" again for Today.
  - **Expected:** Error "Attendance already marked for this date".
- **Case 2.1.3: Quick Mark (Bulk)**
  - **Input:** Use Quick Actions to mark multiple members.
  - **Expected:** All members updated. Existing records updated, new created.

## 3. Expenses Module

### 3.1 Create Transaction
- **Case 3.1.1: Valid Expense**
  - **Input:** Title="Books", Amount=5000, Category="Supplies", Date=Today.
  - **Expected:** Transaction created. Balance updated.
- **Case 3.1.2: Invalid Amount**
  - **Input:** Amount=0 or Negative.
  - **Expected:** Error "Amount must be greater than 0".
- **Case 3.1.3: Missing Category**
  - **Input:** Category not selected.
  - **Expected:** Error "Category is required".

## 4. Team Management Module

### 4.1 Add Member
- **Case 4.1.1: Valid Member**
  - **Input:** Name="New Teacher", Email="unique@school.com", Role="Teacher".
  - **Expected:** Member added.
- **Case 4.1.2: Duplicate Email**
  - **Input:** Name="Another", Email="unique@school.com" (same as above).
  - **Expected:** Error "Member with this email or phone already exists".
- **Case 4.1.3: Duplicate Phone**
  - **Input:** Phone="1234567890" (if already exists).
  - **Expected:** Error "Member with this email or phone already exists".

## 5. Isolation & Regression
- **Case 5.1: Cross-Sector Safety**
  - **Action:** Access Manufacturing/IT sectors.
  - **Expected:** No regressions. Education validations (e.g. Past Date) do NOT apply to Manufacturing logged work if not standard.
- **Case 5.2: Shared Components**
  - **Action:** Verify `ReminderList` in Personal/IT sectors still works (Edit button should not appear if not passed).
