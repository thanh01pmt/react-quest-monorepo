## 1. Database Schema
- [ ] 1.1 Rewrite `migration.sql` with new tables: `contests`, `rounds`, `exams`, `exam_boards`, `participants`, `board_participants`, `submissions`, `drafts`, `contest_progress`
- [ ] 1.2 Create ENUMs: `contest_status`, `participant_status`, `promotion_mode`, `timing_mode`
- [ ] 1.3 Create DB functions: `start_round()`, `end_round()`, `promote_participants()`, `generate_short_code()`
- [ ] 1.4 Create leaderboard VIEWs: `board_leaderboard`, `round_leaderboard`, `contest_leaderboard`
- [ ] 1.5 Create RLS policies for all new tables
- [ ] 1.6 Enable Realtime for `submissions`, `board_participants`, `contest_progress`

## 2. TypeScript Types
- [ ] 2.1 Rewrite `types/index.ts` with new interfaces: `Contest`, `Round`, `Exam`, `ExamBoard`, `Participant`, `BoardParticipant`, `Submission`, `ContestSettings`, `RoundTiming`, `PromotionConfig`
- [ ] 2.2 Define JSON import/export schema types

## 3. Contest Management (Refactor)
- [ ] 3.1 Update `ContestEditorPage` — remove quest_data/timing, add Rounds tab
- [ ] 3.2 Update `ContestListPage` — display round count, board count
- [ ] 3.3 Update `ChallengeBuilderPage` — receive `exam_id` instead of `contest_id`

## 4. Round & Board Management (New)
- [ ] 4.1 Create `RoundManagerPage` — CRUD rounds, configure timing + promotion
- [ ] 4.2 Create `BoardManagerPage` — CRUD boards per round, assign exams, configure timing override
- [ ] 4.3 Create `PromotionPage` — review/approve/execute promotions between rounds

## 5. Live Monitoring (Refactor)
- [ ] 5.1 Update `LiveMonitorPage` — add Round/Board filter selectors
- [ ] 5.2 Implement 3-level leaderboard tabs (Board / Round / Contest)
- [ ] 5.3 Update Realtime subscriptions for `board_participants` + `contest_progress`

## 6. Account & Assignment (Refactor)
- [ ] 6.1 Update `AccountsPage` — assign participants to boards
- [ ] 6.2 Add bulk board assignment (import list or auto-distribute)

## 7. JSON Import/Export
- [ ] 7.1 Create `JsonImportModal` component with 3 import levels
- [ ] 7.2 Implement contest-level JSON export
- [ ] 7.3 Implement round-level and exam-level partial import/export

## 8. Verification
- [ ] 8.1 Run complete `migration.sql` on fresh Supabase project
- [ ] 8.2 Build verification (`pnpm build`)
- [ ] 8.3 End-to-end flow test: Create contest → Add rounds → Add exams → Assign boards → Run → Promote → Final leaderboard
