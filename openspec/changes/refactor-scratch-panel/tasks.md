# Tasks: Refactor Scratch Quest Panel & History

## 1. Backend: History API & UUID Fix
- [ ] 1.1. Add `GET /api/submit/history/:quest_id` to `apps/tin-hoc-tre-api/src/routes/submit.js`.
- [ ] 1.2. Update `submissions` database schema if needed (ensuring `quest_id` etc. are text or correctly handled).
- [ ] 1.3. Test the history endpoint with mock data.

## 2. Frontend: Scratch Quest UI Refactor
- [ ] 2.1. Create `ScratchQuestPanel.tsx` with 3 tabs.
- [ ] 2.2. Implement the "Nộp bài" tab using existing logic.
- [ ] 2.3. Add `getSubmissionHistory` method to `SupabaseContestService.ts`.
- [ ] 2.4. Build the "Lịch sử" tab to fetch and display participant's submissions.
- [ ] 2.5. Integrate the "Cách nộp" instructions.
- [ ] 2.6. Update `ExamRoom.tsx` to use the new panel.

## 3. Verification
- [ ] 3.1. Verify that "invalid input syntax for type uuid" error is gone.
- [ ] 3.2. Check tab switching and data fetching.
- [ ] 3.3. Verify upload flow works and updates history.
