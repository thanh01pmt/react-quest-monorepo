## 1. Database Migration (Supabase)

- [ ] 1.1 Create `apps/contest-dashboard/supabase/fix_rpc_gateway.sql`
  - [ ] 1.1a Drop FK constraint `participants.user_id → auth.users`; rename column to `external_uid TEXT`
  - [ ] 1.1b Create `get_contest_session(UUID)` — SECURITY DEFINER RPC
  - [ ] 1.1c Create `submit_contest_solution(...)` — SECURITY DEFINER RPC
  - [ ] 1.1d Create `update_participant_status_rpc(UUID, TEXT)` — SECURITY DEFINER RPC
  - [ ] 1.1e Grant EXECUTE on all three to `anon` role

## 2. Frontend — SupabaseContestService.ts

- [ ] 2.1 `getSupabaseContestSession` → use `supabase.rpc('get_contest_session', { p_bp_id })`
- [ ] 2.2 `saveSupabaseSubmission` → use `supabase.rpc('submit_contest_solution', { ... })`
- [ ] 2.3 `updateSupabaseParticipantStatus` → use `supabase.rpc('update_participant_status_rpc', { ... })`

## 3. Verification

- [ ] 3.1 Apply SQL migration in Supabase Dashboard SQL Editor
- [ ] 3.2 Commit & push → trigger Netlify "Clear cache and deploy" for `quest-player`
- [ ] 3.3 Test "Thi thử" flow end-to-end
