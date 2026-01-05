# Tasks: Add Practice Mode

## 1. Setup & Infrastructure

- [ ] 1.1 Create `packages/shared-templates` package with pnpm workspace
- [ ] 1.2 Define `TemplateConfig` TypeScript types
- [ ] 1.3 Create template parser (Markdown → TemplateConfig)
- [ ] 1.4 Setup Firebase project and add to `react-quest-app`
- [ ] 1.5 Configure Firebase Authentication (Google + Email/Password)
- [ ] 1.6 Setup Firestore collections structure

## 2. Shared Templates Package

- [ ] 2.1 Create template directory structure (`sequential/`, `loop/`, `conditional/`, etc.)
- [ ] 2.2 Migrate 3-5 existing templates from Builder to new format
- [ ] 2.3 Create `TemplateRegistry` for loading/querying templates
- [ ] 2.4 Implement local + remote template merge strategy
- [ ] 2.5 Export package for consumption by both Builder and Player

## 3. Practice Configuration UI

- [ ] 3.1 Create `/practice` route in `react-quest-app`
- [ ] 3.2 Implement topic selection UI (checkboxes per category)
- [ ] 3.3 Implement question count selector (per enabled topic)
- [ ] 3.4 Implement difficulty slider (5 levels: Rất dễ → Rất khó)
- [ ] 3.5 Add "Thách thức tôi" random button
- [ ] 3.6 Style UI to match existing app design

## 4. Practice Generator Service

- [ ] 4.1 Create `PracticeGenerator` service
- [ ] 4.2 Implement template selection based on config (category + difficulty)
- [ ] 4.3 Integrate with `TemplateInterpreter` for map generation
- [ ] 4.4 Implement deterministic random with seed support
- [ ] 4.5 Generate exercise batch from config

## 5. Authentication Integration

- [ ] 5.1 Create `AuthContext` provider
- [ ] 5.2 Implement Google Sign-In button
- [ ] 5.3 Implement Email/Password sign-in/sign-up forms
- [ ] 5.4 Handle auth state changes
- [ ] 5.5 Create user profile display component

## 6. Scoring System

- [ ] 6.1 Define `TopicProgress` and `ExerciseResult` types
- [ ] 6.2 Implement XP calculation formula
- [ ] 6.3 Create progress tracker per concept category
- [ ] 6.4 Display progress in Practice UI
- [ ] 6.5 Sync progress to Firestore

## 7. Session Persistence

- [ ] 7.1 Setup IndexedDB with Dexie.js (or idb)
- [ ] 7.2 Save session state on exercise completion
- [ ] 7.3 Implement base64 encoding for session data
- [ ] 7.4 Detect and resume incomplete sessions
- [ ] 7.5 Cleanup completed sessions

## 8. Practice Gameplay Loop

- [ ] 8.1 Display current exercise from session
- [ ] 8.2 Integrate with existing Blockly editor
- [ ] 8.3 Handle exercise completion → next exercise
- [ ] 8.4 Show session summary on completion
- [ ] 8.5 Update scores and progress

## 9. Testing & Verification

- [ ] 9.1 Write unit tests for template parser
- [ ] 9.2 Write unit tests for PracticeGenerator
- [ ] 9.3 Write integration tests for auth flow (mocked)
- [ ] 9.4 Manual testing on Chrome, Firefox, Safari
- [ ] 9.5 Mobile browser testing

## 10. Documentation

- [ ] 10.1 Document template format specification
- [ ] 10.2 Document Firebase setup instructions
- [ ] 10.3 Update README with Practice mode usage
