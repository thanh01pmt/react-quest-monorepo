# Tasks: Add Practice Mode

## Phase 1: Core Practice Mode ✅

### 1. Setup & Infrastructure ✅
- [x] 1.1 Create `packages/shared-templates` package with pnpm workspace
- [x] 1.2 Define `TemplateConfig` TypeScript types
- [x] 1.3 Create template parser (Markdown → TemplateConfig)
- [x] 1.4 Setup Firebase project and add to `react-quest-app`
- [x] 1.5 Configure Firebase Authentication (Google + Email/Password)
- [x] 1.6 Setup Firestore collections structure

### 2. Shared Templates Package ✅
- [x] 2.1 Create template directory structure (`sequential/`, `loop/`, `conditional/`, `function/`)
- [x] 2.2 Migrate 5 templates to new format
- [x] 2.3 Create `TemplateRegistry` for loading/querying templates
- [x] 2.4 Implement local + remote template merge strategy
- [x] 2.5 Export package for consumption by both Builder and Player

### 3. Practice Configuration UI ✅
- [x] 3.1 Create `/practice` route in `react-quest-app`
- [x] 3.2 Implement topic selection UI (checkboxes per category)
- [x] 3.3 Implement question count selector (per enabled topic)
- [x] 3.4 Implement difficulty slider (5 levels: Rất dễ → Rất khó)
- [x] 3.5 Add "Thách thức tôi" random button (Quick Start)
- [x] 3.6 Style UI with sidebar layout and light/dark theme support

### 4. Practice Generator Service ✅
- [x] 4.1 Create `PracticeGenerator` service
- [x] 4.2 Implement template selection based on config (category + difficulty)
- [x] 4.3 Integrate with `ExerciseToQuestMapper` for map generation
- [x] 4.4 Implement deterministic random with seed support
- [x] 4.5 Generate exercise batch from config

### 5. Authentication Integration ✅
- [x] 5.1 Create `AuthContext` provider
- [x] 5.2 Implement Google Sign-In button
- [x] 5.3 Implement Email/Password sign-in/sign-up
- [x] 5.4 Handle auth state changes
- [x] 5.5 Create `AuthButton` component

### 6. Scoring System ✅
- [x] 6.1 Define `TopicProgress` and `ExerciseResult` types
- [x] 6.2 Implement XP calculation formula
- [x] 6.3 Create progress tracker per concept category (`ProgressService.ts`)
- [x] 6.4 Display progress in Practice UI
- [x] 6.5 Sync progress to Firestore (`FirestoreProgressService.ts`)

### 7. Session Persistence ✅
- [x] 7.1 Setup IndexedDB (`SessionStorage.ts`)
- [x] 7.2 Save session state on exercise completion
- [x] 7.3 Implement base64 encoding for session data
- [x] 7.4 Detect and resume incomplete sessions
- [x] 7.5 Cleanup completed sessions

### 8. Practice Gameplay Loop ✅
- [x] 8.1 Display current exercise from session
- [x] 8.2 Integrate with QuestPlayer (`PracticeContent.tsx`)
- [x] 8.3 Handle exercise completion → next exercise
- [x] 8.4 Show session summary on completion
- [x] 8.5 Update scores and progress

### 9. Testing & Verification ✅
- [x] 9.1 Write unit tests for template parser
- [x] 9.2 Build verification (TypeScript + Vite)
- [x] 9.3 Browser testing (Quick Start, Manual Config, Session)
- [x] 9.4 Theme testing (Light/Dark)
- [ ] 9.5 Mobile browser testing *(Future)*

### 10. Documentation *(Future)*
- [ ] 10.1 Document template format specification
- [ ] 10.2 Document Firebase setup instructions
- [ ] 10.3 Update README with Practice mode usage

---

## Summary

| Component | Status | Key Files |
|-----------|--------|-----------|
| shared-templates | ✅ Complete | `types.ts`, `parser.ts`, `registry.ts`, `scoring.ts` |
| Practice UI | ✅ Complete | `PracticeSidebar`, `PracticeContent` |
| QuestPlayer Integration | ✅ Complete | `ExerciseToQuestMapper.ts` |
| Firebase Auth | ✅ Complete | `AuthContext`, `AuthButton`, `firebase.ts` |
| Firestore Sync | ✅ Complete | `FirestoreProgressService.ts` |
| Services | ✅ Complete | `PracticeGenerator`, `SessionStorage`, `ProgressService` |
