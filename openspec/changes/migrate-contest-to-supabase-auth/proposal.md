# Change: Migrate Contest to Supabase Auth

## Why

Currently, the monorepo uses a hybrid approach: `contest-dashboard` uses Supabase exclusively, while `react-quest-app` relies on Firebase Auth and Firestore as its primary store—with partial Supabase integration added later. This creates inconsistency, increases bundle size with duplicate SDKs, and complicates session management between the Player app and the Dashboard's Live Monitor feature.

## What Changes

### Breaking Changes
- **BREAKING**: Remove Firebase Auth from `react-quest-app` — `AuthContext.tsx` migrated to Supabase Auth.
- **BREAKING**: `AuthContextType.user` type changes from `firebase/auth.User` to `@supabase/supabase-js.User` — all consumers of `user.uid` must switch to `user.id`.
- **BREAKING**: Delete `src/config/firebase.ts` and `src/services/ContestService.ts` (Firestore implementations).
- **BREAKING**: Delete `src/services/FirestoreProgressService.ts` — progress storage migrated to Supabase table `user_progress`.

### Feature Changes
- **Auth**: `EntrancePage` updated to use `supabase.auth.signInWithPassword` / `supabase.auth.signUp` instead of Firebase Auth popup/email flows.
- **Contest data**: All `ContestContext.tsx` calls now route exclusively through `SupabaseContestService.ts` RPC functions. The `IS_UUID_REGEX` branching logic is removed.
- **Progress sync**: `FirestoreProgressService` replaced by new `SupabaseProgressService` using the `user_progress` table in Supabase PostgreSQL.
- **Session sharing** (`SharedSessionService.ts`): Migrated from Firestore `shared_practice_sessions` collection to a new Supabase table `shared_sessions`.
- **Type safety**: `ContestParticipant.uid` comment updated from "Firebase Auth UID" to "Supabase Auth UID".
- **Env cleanup**: `VITE_FIREBASE_*` environment variables removed from `.env` and `.env.example`.

### Not Changed
- `contest-dashboard`: Already 100% Supabase-native. **No changes required.**
- `SupabaseContestService.ts`: Existing RPC functions (`get_contest_session`, `submit_contest_solution`, `update_participant_status_rpc`) remain unchanged.
- Supabase RLS / RPC functions: No new database functions required (reuse SECURITY DEFINER pattern already in place).

## Impact

### Specs
- `specs/auth/spec.md`
- `specs/contest/spec.md`

### Code — Files Modified
- `apps/react-quest-app/src/contexts/AuthContext.tsx` — full rewrite to Supabase Auth
- `apps/react-quest-app/src/contexts/ContestContext.tsx` — remove Firebase fallback paths, fix `user.uid` → `user.id`
- `apps/react-quest-app/src/services/SupabaseContestService.ts` — add `getSupabaseSubmissions()` for restoring challenge states
- `apps/react-quest-app/src/types/contest.ts` — update comment on `ContestParticipant.uid`
- `apps/react-quest-app/.env` / `.env.example` — remove `VITE_FIREBASE_*` vars
- `apps/react-quest-app/main.tsx` — remove Firebase Auth Provider comment

### Code — Files Added
- `apps/react-quest-app/src/services/SupabaseProgressService.ts` — replaces `FirestoreProgressService.ts` using Supabase `user_progress` table
- `apps/react-quest-app/src/services/SupabaseSharedSessionService.ts` — replaces `SharedSessionService.ts` using Supabase `shared_sessions` table

### Code — Files Deleted
- `apps/react-quest-app/src/config/firebase.ts`
- `apps/react-quest-app/src/services/ContestService.ts`
- `apps/react-quest-app/src/services/FirestoreProgressService.ts`
- `apps/react-quest-app/src/services/SharedSessionService.ts`

### Database — Supabase Tables Required
- `user_progress` — stores per-user learning progress (categories, XP, streaks)
- `shared_sessions` — stores serialized practice sessions for URL sharing

## No Side Effects on `contest-dashboard`

`contest-dashboard` has been verified to contain **zero Firebase imports**. It uses only `@supabase/supabase-js` throughout:
- `src/App.tsx` → `supabase.auth.getSession()`
- `src/pages/LoginPage.tsx` → `supabase.auth`
- `src/pages/AccountsPage.tsx` → `supabase.from('participants')`
- `src/pages/LiveMonitorPage.tsx` → `supabase.channel()` realtime

This migration is **fully isolated to `react-quest-app`**.
