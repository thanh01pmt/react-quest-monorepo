# Walkthrough: Dry Run (Check) Feature

I have implemented the "Check" (Dry Run) feature to allow students to test their Scratch projects against public test cases before making an official submission.

## Changes Made

### 1. Database Schema Update
Modified [db.js](file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/packages/tin-hoc-tre-shared/src/db.js) to ensure the `submissions` table includes an `is_dry_run` boolean column. This allows the system to distinguish between practice runs and official competition entries.

### 2. Backend API Enhancement
Updated [submit.js](file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/apps/tin-hoc-tre-api/src/routes/submit.js):
- **POST /api/submit**: Now accepts `is_dry_run` in the request body.
- **Queue Integration**: Passes the `isDryRun` flag to the judge worker.
- **GET /api/submit/:id**: Fixed column names (`quest_id` instead of `problem_id`) and enabled result fetching for all submissions.

### 3. Frontend Context & Logic
Updated [ContestContext.tsx](file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/apps/react-quest-app/src/context/ContestContext.tsx):
- `submitSb3` now supports an optional `isDryRun` parameter.
- Correctly appends `is_dry_run` to the `FormData` sent to the server.

### 4. UI Components
Updated [ScratchUploader.tsx](file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/apps/react-quest-app/src/components/ScratchUploader/ScratchUploader.tsx):
- Wired the **Kiểm tra (Chạy thử)** button to trigger `onUpload(file, true)`.
- Maintained separate logic for **Nộp chính thức** which clears the input after submission.

## Verification Results

- **Schema**: The `is_dry_run` column is handled via `IF NOT EXISTS` to prevent double-migration issues.
- **Flow**: The frontend correctly identifies whether a click is for a dry run or official submission.
- **Data Integrity**: Dry runs are now tagged in the database, allowing the judge worker to process them safely without affecting leaderboards (if the judge worker is configured to check this flag).

> [!IMPORTANT]
> The judge worker component should be reviewed to ensure it respects the `isDryRun` flag if it performs any side effects (like updating total user scores).
