# Change: Refactor to Express Judge API

## Why
The current judge system relies on direct client-side Supabase RPC calls which makes it difficult to manage complex judge logic, implement detailed logging (worker logs), and scale worker processes independently. Moving to a dedicated Express-based API provides a centralized point for authentication, validation, and judge orchestration.

## What Changes
- **Judge Integration**: Implement `POST /submissions` in `tin-hoc-tre-api`.
- **Worker Logic**: Decouple judge execution into `tin-hoc-tre-judge`.
- **Database Model**: Update `board_participants.score` to be the primary scoring field.
- **Frontend Sync**: Update `react-quest-app` to call the new API and display historical judge logs.

## Impact
- Specs: `contest-judge` (New)
- Code: 
    - `apps/tin-hoc-tre-api` (New/Modify)
    - `apps/tin-hoc-tre-judge` (New/Modify)
    - `apps/react-quest-app/src/services/SupabaseContestService.ts` (Modify)
    - `apps/contest-dashboard/supabase/migration.sql` (Modify Views)
