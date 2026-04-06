# Change: Refactor Batch Submissions

## Why
Currently substrate (submissions) are recorded per quest. This makes it difficult to have a consistent "snapshot" of a student's entire exam progress at a single point in time. It also complicates the leaderboard logic (requiring `SUM(MAX(score))`). 
Transitioning to a batch submission model allows for:
- Simplified scoring (Latest/Best snapshot wins).
- Consistent results across multiple tasks.
- Atomic "Nộp bài" action for the entire exam.

## What Changes
- **Breaking**: `submissions` table schema changed to store multi-task data in `jsonb`.
- **Breaking**: Judge API updated to accept and return multi-task results.
- **Improved**: Leaderboard view simplified to scalar scoring.
- **Metadata**: Consolidation of `time_ms`, `storage_path`, and logs into a single record.

## Impact
- Specs: `openspec/specs/react-quest-app/spec.md` (to be updated via delta)
- Code: 
    - `apps/tin-hoc-tre-api/src/routes/submission-code.js`
    - `apps/react-quest-app/src/services/SupabaseContestService.ts`
    - `apps/contest-dashboard/supabase/migration.sql`
