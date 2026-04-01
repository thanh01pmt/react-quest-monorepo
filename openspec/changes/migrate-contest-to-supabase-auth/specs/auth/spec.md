# Capability: Authentication

## ADDED Requirements

### Requirement: Supabase Auth Integration
The application SHALL utilize Supabase Auth for user identity management in `react-quest-app`.

#### Scenario: Successful Login
- **WHEN** user provides valid credentials (email/password) to Supabase Auth
- **THEN** user session is established and `onAuthStateChange` callback fires with the new session

#### Scenario: Successful Sign Up
- **WHEN** user registers with a new email and password in `react-quest-app`
- **THEN** a new identity is created in Supabase Auth and user is automatically signed in

#### Scenario: Session Persistence
- **WHEN** user refreshes the page after logging in
- **THEN** the Supabase session is restored automatically without requiring re-login

### Requirement: Supabase Progress Storage
The application SHALL store and retrieve user learning progress using Supabase PostgreSQL `user_progress` table instead of Firestore.

#### Scenario: Save Progress
- **WHEN** user completes a practice exercise
- **THEN** XP and category stats are upserted to the `user_progress` table using `supabase.from('user_progress')`

#### Scenario: Restore Progress on Login
- **WHEN** user logs in via Supabase Auth
- **THEN** their previous progress is loaded from the `user_progress` table and applied to local state

### Requirement: Supabase Session Sharing
The application SHALL persist shareable practice sessions to Supabase `shared_sessions` table instead of Firestore.

#### Scenario: Share Practice Session
- **WHEN** user shares a practice session link
- **THEN** the serialized session is stored in `shared_sessions` and a unique share ID is returned

#### Scenario: Load Shared Session
- **WHEN** recipient opens a shared session URL with a valid share ID
- **THEN** the session data is retrieved from `shared_sessions` and loaded into the practice player

## MODIFIED Requirements

### Requirement: Contest Identity Mapping
The application SHALL map the authenticated user identity to a `contest_participants` record using Supabase Auth UUID.

#### Scenario: UUID Identity Used in Contest
- **WHEN** user is authenticated via Supabase Auth
- **THEN** `user.id` (Supabase UUID) is used as the participant identifier in all contest operations

#### Scenario: No Firebase UID in Contest Flow
- **WHEN** user loads or joins a contest
- **THEN** no reference to `user.uid` (Firebase property) exists — only `user.id` (Supabase) is used

## REMOVED Requirements

### Requirement: Firebase Auth SDK
**Reason**: Consolidating on Supabase to reduce library overhead, eliminate dual-SDK complexity, and unify session management across `react-quest-app` and `contest-dashboard`.
**Migration**: Replace all `AuthContext` logic with Supabase Auth client calls. Uninstall `firebase` package after all Firestore service migrations are complete.

### Requirement: Firestore Progress Storage
**Reason**: Firestore `users/{uid}/progress/main` subcollection creates a dependency on Firebase SDK purely for Practice Mode — outside the Contest scope.
**Migration**: Create `SupabaseProgressService.ts` using `user_progress` table. Delete `FirestoreProgressService.ts`.

### Requirement: Firestore Session Sharing
**Reason**: Firestore `shared_practice_sessions` collection creates a Firebase dependency for non-contest features.
**Migration**: Create `SupabaseSharedSessionService.ts` using `shared_sessions` table. Delete `SharedSessionService.ts`.
