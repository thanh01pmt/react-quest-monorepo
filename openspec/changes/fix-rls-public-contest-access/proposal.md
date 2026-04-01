# Change: fix-rls-public-contest-access

## Why

The Quest Player app (`react-quest-app`) crashes with `PGRST116` ("0 rows") when opening
a contest session URL because Supabase RLS blocks direct `SELECT` on `board_participants`
for anonymous (non-Supabase-auth) users.

Additionally, the `participants` table has `user_id UUID REFERENCES auth.users(id)`, 
making it impossible to insert a participant whose identity comes from Firebase Auth 
(a different UUID namespace). The "Thi thử" (trial exam) flow creates a disposable 
participant record that doesn't need a Supabase auth user at all.

## What Changes

- **BREAKING (schema):** `participants.user_id` FK to `auth.users` is dropped. 
  Replaced with a plain `TEXT` column `external_uid` (accepts Firebase UID, Supabase UID, 
  or any string). Existing `user_id` data is migrated.
- **NEW (RPC functions):** Three `SECURITY DEFINER` RPC functions added as a secure 
  "gateway": the anon role can call them with a known UUID but cannot enumerate tables.
  - `get_contest_session(p_bp_id UUID)` – fetch session + exam data
  - `submit_contest_solution(...)` – insert a submission
  - `update_participant_status_rpc(p_bp_id UUID, p_status TEXT)` – finish/submit
- **Frontend:** `SupabaseContestService.ts` refactored to use `.rpc()` calls instead 
  of direct table queries.
- **No RLS policy changes** – existing policies are untouched, preventing data leakage.

## Impact

- Specs: `database` (new)
- Code: 
  - `apps/contest-dashboard/supabase/fix_rpc_gateway.sql` (NEW)
  - `apps/react-quest-app/src/services/SupabaseContestService.ts` (MODIFY)
