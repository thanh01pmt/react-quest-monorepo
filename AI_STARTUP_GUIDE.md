# AI AGENT & DEVELOPER BOOTSTRAP GUIDE

> **MANDATORY READ**: If you are an AI assistant or new developer joining this project, start here to align your context with the current project state.

## 1. 🧭 Project Coordinates
*   **Name**: My Feelings Edu Platform
*   **Current Phase**: Phase 2 Start - "Analytics & Insights"
*   **Last Major Milestone**: Completed "Session Management Refactor" (Dashboard 2.0) on 2026-01-04.

## 2. ⚡️ Quick Context Loading (The "Right Flow")

To fully understand the system, read the following files in this **exact order**:

### Step A: High-Level Overview
1.  **`.antigravity/project-context.md`**: The architectural map. Explains the "Session Management Engine", "Smart Scopes", and dual-app structure.
2.  **`PROJECT_INTRO.md`**: The mission statement and user-facing value proposition.

### Step B: Execution Status (Where are we?)
3.  **`task.md`** (`.gemini/antigravity/...` or root): The granular checklist.
    *   *Check*: "Session Management" should be `[x]`.
    *   *Check*: "Analytics" should be `[ ]`.
4.  **`PROJECT_STATUS.md`**: The executive summary of stable vs. active components.

### Step C: Technical Truth
5.  **`apps/teacher-dashboard/master_schema_v2.sql`**: **CRITICAL**. This is the Database Bible. Do not trust other SQL snippets over this file. It contains the unified `sessions` table, `ended_by` columns, and RBAC policies.
6.  **`apps/teacher-dashboard/src/utils/supabase/queries.ts`**: The core data fetching logic. Look at `getDashboardSessions` to see how we handle permissions.

---

## 3. 🎯 Current Mission: Analytics Upgrade

We have just finished building the **Operations Center** (`/activities`). The system creates rich data (who started, who ended, when, how many students).
**Your Goal**: Turn this data into charts.

### Immediate To-Do List (from `implementation_plan.md`)
- [ ] **Participation Chart**: Graph student attendance trends.
- [ ] **Duration Stats**: Calculate average session lengths.
- [ ] **Student Deep Dive**: Show session history on Student Detail pages.

---

## 4. 🤖 Operational Protocols (Roles & Rules)

### 👮‍♂️ For Backend/SQL Tasks
*   **Golden Rule**: NEVER modify the `sessions` table structure without updating `master_schema_v2.sql`.
*   **Foreign Keys**: Always ensure explicit FK constraints (like `ended_by -> profiles`) so Supabase PostgREST works.
*   **Safety**: Use `check_policies.sql` (or similar) to verify RBAC before marking a task done.

### 🎨 For Frontend/UI Tasks
*   **Design System**: We use TailwindCSS + HeadlessUI/Radix. Keep it clean.
*   **Data Fetching**: Use Server Actions (`actions.ts`) for mutations and direct Supabase Client (`queries.ts`) for reading data.
*   **Localization**: Keep user-facing strings in Vietnamese (vi) as the primary language.

---

## 5. ⚠️ Known Traps
*   **"Free Sessions" vs "Class Sessions"**: They share the same `sessions` table.
    *   *Class*: Has `class_id`.
    *   *Free*: `class_id` is NULL.
    *   *Always* handle both cases in UI components (`ClassSessionsList.tsx`).
*   **PostgREST Cache**: If you add a column and the API crashes, run `NOTIFY pgrst, 'reload schema'` in SQL.

---
*End of Bootstrap Guide. You are now synced.*
