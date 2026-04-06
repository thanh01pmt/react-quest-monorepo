# Tasks: Batch Submissions Refactor

## 1. Database Implementation
- [ ] 1.1 Update `submissions` table schema via Supabase migration.
- [ ] 1.2 Update `board_leaderboard` view to handle batch scoring.
- [ ] 1.3 Update RLS policies if necessary.
- [ ] 1.4 Optional: Migration script for existing records.

## 2. Backend API
- [ ] 2.1 Refactor `submission-code.js` to accept `codes` JSONB.
- [ ] 2.2 Update Judging logic to loop through all tasks.
- [ ] 2.3 Implement parallel execution for faster judging.
- [ ] 2.4 Update response structure to include per-task results.

## 3. Frontend Integration
- [ ] 3.1 Update `SupabaseContestService.ts` types and submission methods.
- [ ] 3.2 Refactor `ExamRoom` to send batch data on "Nộp bài".
- [ ] 3.3 Update UI components to display per-task results from the batch response.

## 4. Verification
- [ ] 4.1 Mock an API response with multiple tasks.
- [ ] 4.2 Verify leaderboard reflects the latest snapshot's score.
- [ ] 4.3 End-to-end test with a multi-task exam.
