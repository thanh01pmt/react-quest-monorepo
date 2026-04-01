## 1. Database Migrations
- [ ] 1.1 Create `20260401_resolve_participant_session.sql` with `get_public_contest_info(p_contest_id)` enforcing `status != 'draft'`.
- [ ] 1.2 Add `resolve_participant_session(p_contest_id)` RPC that joins `exam_boards` and `rounds` to get the correct timing and enforces `status != 'draft'`.

## 2. React Client Logic
- [ ] 2.1 Update `SupabaseContestService.ts` with `getPublicContestInfo` and `resolveSupabaseContestSession`.
- [ ] 2.2 Refactor `ContestContext.tsx` to handle the Guest state and the Authenticated state independently, using the new RPCs.

## 3. UI/UX Updates
- [ ] 3.1 Update `EntrancePage` to show the correct "not found/draft" error and redirect.
- [ ] 3.2 Update `EntrancePage` lobby to utilize the Board-specific `start_time` for the countdown.
