# Tasks: Migrate Contest to Supabase Auth

## 1. Preparation

- [ ] 1.1 Verify `@supabase/supabase-js` is present in `apps/react-quest-app/package.json` (should already exist via `lib/supabase.ts`).
- [ ] 1.2 Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set in `apps/react-quest-app/.env`.
- [ ] 1.3 Create Supabase tables for migration targets (run migration SQL in Supabase dashboard):
  - `user_progress` table (for `SupabaseProgressService`)
  - `shared_sessions` table (for `SupabaseSharedSessionService`)

## 2. Authentication Migration

- [ ] 2.1 Rewrite `AuthContext.tsx` to use `supabase.auth`:
  - Replace `onAuthStateChanged` with `supabase.auth.onAuthStateChange`
  - Replace `signInWithEmailAndPassword` with `supabase.auth.signInWithPassword`
  - Replace `createUserWithEmailAndPassword` with `supabase.auth.signUp`
  - Replace `firebaseSignOut` with `supabase.auth.signOut`
  - Remove `signInWithGoogle` (not used in Contest flow — can add OAuth later)
  - Change `user` type from `firebase/auth.User` to `@supabase/supabase-js.User`
- [ ] 2.2 Update `EntrancePage/index.tsx` to use the new `signInWithEmail` / `signUpWithEmail` from refactored context.
- [ ] 2.3 Update `App.tsx` routes — verify auth guard still works with Supabase session.
- [ ] 2.4 Find and fix all `user.uid` references → `user.id` across the codebase:
  - `ContestContext.tsx` lines: `user.uid` in `findParticipant()` and `createParticipant()` calls
  - Any other component consuming `useAuth().user.uid`

## 3. Data Service Unification

- [ ] 3.1 Add `getSupabaseSubmissions(boardParticipantId)` to `SupabaseContestService.ts` — needed by `restoreChallengeStates` in `ContestContext`.
- [ ] 3.2 Rewrite `ContestContext.tsx` to remove all Firebase fallback paths:
  - Remove `IS_UUID_REGEX` branching — all contests are now UUID-based
  - Replace `findParticipant` / `createParticipant` (Firestore) → no-op for pre-created participant model (Supabase uses `get_contest_session` RPC which already returns participant)
  - Replace `restoreChallengeStates` to call `getSupabaseSubmissions` from Task 3.1
  - Replace `saveSubmission` (Firestore) → `saveSupabaseSubmission` (already exists)
  - Replace `updateParticipantStatus` (Firestore) → `updateSupabaseParticipantStatus` (already exists)
  - Remove all imports from `../services/ContestService`
- [ ] 3.3 Create `SupabaseProgressService.ts` to replace `FirestoreProgressService.ts`:
  - `getCloudProgress(userId)` — reads from `user_progress` table via `supabase.from('user_progress')`
  - `saveCloudProgress(userId, progress)` — upserts to `user_progress`
  - `updateCategoryProgress(userId, category, result)` — update category fields
  - `initializeUserDocument(user)` — upsert user record on first login
  - Migrate `User` type dependency: use `@supabase/supabase-js.User` instead of `firebase/auth.User`
- [ ] 3.4 Create `SupabaseSharedSessionService.ts` to replace `SharedSessionService.ts`:
  - `shareSession(session, mode, userId)` — upsert to `shared_sessions` table
  - `getSharedSession(shareId)` — read from `shared_sessions` by ID
  - Use `supabase.from('shared_sessions')` with appropriate RLS or SECURITY DEFINER RPC
- [ ] 3.5 Update all callers of `FirestoreProgressService` and `SharedSessionService` to use new Supabase services.
- [ ] 3.6 Verify RLS policies in Supabase allow anon access via RPC Gateway for contest operations.

## 4. Cleanup & Removal

- [ ] 4.1 Delete `apps/react-quest-app/src/services/FirestoreProgressService.ts`.
- [ ] 4.2 Delete `apps/react-quest-app/src/services/SharedSessionService.ts`.
- [ ] 4.3 Delete `apps/react-quest-app/src/services/ContestService.ts`.
- [ ] 4.4 Delete `apps/react-quest-app/src/config/firebase.ts`.
- [ ] 4.5 Remove `VITE_FIREBASE_*` entries from `apps/react-quest-app/.env` and `.env.example`.
- [ ] 4.6 Update `types/contest.ts` — change comment on `ContestParticipant.uid` from "Firebase Auth UID" to "Supabase Auth UID".
- [ ] 4.7 **Final step only after all above tasks complete**: Uninstall `firebase` package from `apps/react-quest-app` (check `package.json` for usage before running `npm uninstall firebase`).

## 5. Verification

- [ ] 5.1 Manual test — Practice Mode: Sign up new user → verify progress saved to Supabase `user_progress` table.
- [ ] 5.2 Manual test — Practice Mode: Login existing user → verify progress restored from Supabase.
- [ ] 5.3 Manual test — Contest Mode: Enter contest with UUID-based ID → login → verify `get_contest_session` RPC works.
- [ ] 5.4 Manual test — Contest Mode: Submit solution → verify `submit_contest_solution` RPC records in `board_submissions`.
- [ ] 5.5 Manual test — Dashboard: Open Live Monitor → verify real-time updates appear when contestant submits.
- [ ] 5.6 Manual test — Sharing: Share a practice session → verify link works via `shared_sessions` table.
- [ ] 5.7 Confirm `contest-dashboard` is unaffected (no Firebase imports, no regressions).
- [ ] 5.8 Run TypeScript build: `npm run build` in `apps/react-quest-app` — zero Firebase-related errors.
- [ ] 5.9 Run OpenSpec validation: `openspec validate migrate-contest-to-supabase-auth --strict`.
