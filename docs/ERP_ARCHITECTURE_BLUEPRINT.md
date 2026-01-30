# OrganizerPro ERP: Attendance Architecture & Validation Blueprint

## Part 1: Attendance Design & Validation

### 1.1 Review & Validation of Tabs
**Current State (Manufacturing):**
- **Records:** Master list of all logs. (Essential)
- **Summary:** Aggregated stats. (Essential for supervisors)
- **Daily Sheet:** The primary "Action Center" for today. (Critical)
- **Members:** Staff management. (Essential)

**Proposed Additions:**
- **Shifts & Rules:** **APPROVED.** Reference data for "what is a working day". Needed to calculate "Late" and "Overtime" automatically.
- **Approvals / Exceptions:** **APPROVED.** This is the "Inbox" for managers. It unifies:
    - *Exceptions:* Missing punch, Late arrival.
    - *Requests:* Overtime claims, Leave applications.
- **Calendar / Holidays:** **APPROVED.** Defines the "Non-working days" so the system doesn't mark people as "Absent" on a Sunday or Festival.

**Missing Tabs?**
- **Reports:** *Recommendation:* Do not add a top-level tab. Keep reports inside "Summary" or as an "Export" action to avoid clutter. The current `ExportButtons` component is sufficient for a mini-ERP.

### 1.2 Shared Core Attendance Rules (The "Engine")
To align Manufacturing (Mfg) and IT, we define a **Unified Attendance Record**:

| Field | Type | Description |
|---|---|---|
| `date` | Date | The specific day. |
| `member_id` | FK | Who? |
| `status` | Enum | Present, Absent, Half-Day, Late, Holiday, Week-off, Leave (CL/SL). |
| `check_in` | Time | Nullable. Start of work. |
| `check_out` | Time | Nullable. End of work. |
| `total_hours` | Decimal | **The Truth Field.** Calculated (`out - in`) OR Manual Entry. |
| `project_id` | FK | Cost allocation target. |
| `billable_status` | Enum | Billable / Non-Billable (IT specific, defaults to Billable for Mfg). |

**Sector-Specific Logic:**
*   **Manufacturing (Strict Mode):**
    *   `Status` is derived from `CheckIn` vs `Shift.StartTime`.
    *   `TotalHours` must match `CheckOut - CheckIn`.
    *   **Overtime:** Triggered if `TotalHours > Shift.Hours`. Requries Approval.
*   **IT Sector (Flexible Mode):**
    *   `Status` is derived from `TotalHours`.
    *   `CheckIn/Out` are optional documentation.
    *   **Overtime:** Usually generally not applicable, or strictly project-based.

---

## Part 2: End-to-End Workflow Simulation (1 Month)

**Scenario:** November 2025 (30 Days).
**Staff:**
1.  **Alex (Manager, Salary):** Fixed $5000/mo. IT Sector.
2.  **Bob (Worker, Daily):** $100/day. Mfg Sector.
3.  **Charlie (Intern, Stipend):** $500/mo. Mfg Sector.

### Day 1-5 (Regular Week)
*   **Action:** Bob punches in 09:00, out 18:00 (9h). Lunch 1h.
*   **System:** Calc Duration = 8h. Shift = 8h.
*   **Result:** Status = `Present`. Cost = $100 (Bob).

### Day 6 (Saturday - OT Scenario)
*   **Action:** Bob works 09:00 - 13:00.
*   **Rule:** Mfg Saturday = Half Day? Or OT?
*   **System Check:** If Shift Rule says "Sat is Off", this is **OT**.
*   **Result:** `TotalHours` = 4. `Status` = `Week-off`. `Overtime` = 4h.
*   **Flow:** Sends "Overtime Request: 4h" to **Approvals Tab**. Manager MUST Click "Approve" for it to hit Payroll.

### Day 15 (Mid-Month Holiday)
*   **Action:** System Scheduler checks `Calendar` table. Finds "Founder's Day".
*   **Result:** Auto-marks everyone as `Holiday`.
*   **Cost:**
    *   Alex (Salary): Paid (Included in monthly).
    *   Bob (Daily): **Unpaid** (unless "Paid Holiday" rule exists).
    *   Charlie (Stipend): Paid.

### Day 20 (The "Missed Punch")
*   **Action:** Bob checks in 09:00. Forgets to check out.
*   **System (Nightly Job):** Sees `CheckIn` but no `CheckOut`.
*   **Result:** Status = `Exception` (or `Error`).
*   **Flow:** Appears in **Approvals / Exceptions Tab**. Supervisor manually fixes: "Punched out at 18:00". Status -> `Present`.

---

## Part 3: Linkage (The Financial Backbone)

### 3.1 Attendance → Salary
*   **Monthly Staff:** `(FixedSalary / TotalDaysInMonth) * (PresentDays + PaidLeaves + Holidays)`.
*   **Daily Staff:** `(DailyRate * PresentDays) + (OT_Hours * OT_Rate)`.

### 3.2 Salary → Expenses
When Payroll is **Finalized** for November:
1.  System calculates Total Payout (e.g., $15,000).
2.  System creates a **Expense Transaction**:
    *   **Category:** "Salaries & Wages"
    *   **Amount:** $15,000
    *   **Date:** Nov 30 (Accrual) or Dec 1 (Payment).
    *   **Status:** "Paid" or "Pending".

### 3.3 Salary → Project Cost (Job Costing)
*   If Bob worked 20 days on **Project Alpha** and 5 days on **Project Beta**:
*   Cost for Alpha = 20 * $100 = $2000.
*   Cost for Beta = 5 * $100 = $500.
*   *Note:* This requires `project_id` to be locked on the Attendance Record.

### 3.4 The "Lock" Mechanism
*   Once Payroll is finalized, **Attendance for that month becomes Read-Only.**
*   Any edits require "Unlocking Payroll" (Admin only) or passing a specific "Adjustment Entry" in the next month.

---

## Part 4: QA & Functional Testing Plan

### 4.1 Functional Test Cases
1.  **Shift Crossing Midnight:** Punch In 22:00 (Day 1), Out 06:00 (Day 2). System must count this as **one shift** for Day 1.
2.  **Double Punch:** User clicks "Present" manually, then punches in. System should warn or merge.
3.  **Leave Conflict:** Applying for Leave on a day already marked "Present". System should ask to overwrite.

### 4.2 Edge Cases (The "Bugs" to Watch For)
*   **Feb 29th:** Leap year salary calculation logic (divide by 29 or 30?).
*   **Zero Hours:** Punch In 09:00, Out 09:01. Is this `Present`? **Rule:** Minimum 4h for Half-Day. Less than 4h = Absent.
*   **Project Switch:** Staff changes project at 13:00. Requires **Split Shift** or simple "Majority Rule" (whichever project had more hours).

### 4.3 Data Consistency
*   `Sum(Project Costs)` must <= `Total Gross Salary`.
*   `Days Present` + `Days Absent` + `Holidays` + `Weekoffs` must == `DaysInMonth`.

---

## Part 5: Report Validation

### 5.1 Required Reports
1.  **Muster Roll:** Grid view (Days 1-31) showing P/A/L codes. Standard statutory requirement.
2.  **Overtime Sheet:** List of approved OT hours x Rate.
3.  **Project Labor Report:** Aggregated hours/cost per project.

### 5.2 Expected Values (Sample)
*   If Bob is `Present` 20 days @ $100:
    *   **Attendance Report:** 20 P.
    *   **Salary Report:** Gross $2000.
    *   **Project Report:** Project A ($2000).
    *   *Mismatch Check:* If Salary says $2100, check if an OT record was approved but not listed in the standard Attendance grid.

---

## Part 6: SaaS & Production Readiness Checklist

### Data Integrity
- [ ] **Audit Trail:** Every edit to a past attendance record MUST log `who`, `when`, `old_value`, `new_value`. (Already partially implemented in `Audit Logs` tab).
- [ ] **Soft Deletes:** Never `DELETE` attendance rows. Use `status = 'archived'`.

### Access Control
- [ ] **Role: Manager:** Can Approve, cannot Change Final Salary Rates.
- [ ] **Role: Staff:** Read-only for past records. Write access only for "Today" (if Self-Service is enabled).

### Locks
- [ ] **Payroll Lock:** Flag `is_payroll_finalized = true` in the `months` table. Blocks all write operations for that month.

### Multi-Tenant (Future Proofing)
- [ ] Ensure `organization_id` (or similar scope) is in EVERY query. (Currently implicit via single-tenant deployment, but keep in mind).

---

**Architect's Verdict:**
The system foundation is solid. The move to add **Shifts**, **Approvals**, and **Calendar** is the correct next step to mature from a "Tracker" to an "ERP Module".
