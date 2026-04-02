## 1. Database & Views
- [ ] 1.1 Update `board_leaderboard` view to use `bp.score` as primary source.
- [ ] 1.2 Update `round_leaderboard` and `contest_leaderboard` views.
- [ ] 1.3 Add `contest_progress` triggers (optional) or rely on API updates.

## 2. Participant App (react-quest-app)
- [ ] 2.1 Update `SupabaseContestService.ts` to call Express Judge API.
- [ ] 2.2 Handle Authentication (Supabase JWT -> Express).
- [ ] 2.3 Update `ExamPlayer` to display judge progress and logs.

## 3. Admin Dashboard (contest-dashboard)
- [ ] 3.1 Update `SubmissionDetails` to display `worker_log` and `time_ms`.
- [ ] 3.2 Verify Leaderboard reflecting new judge scores.

## 4. Final Integration
- [ ] 4.1 Test full flow: Submission -> Judge -> Leaderboard.
- [ ] 4.2 Clean up unused direct-insert logic from RPCs.
