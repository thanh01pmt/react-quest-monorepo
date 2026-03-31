## 1. Foundation (Types & Service Layer)

- [ ] 1.1 Create `src/types/contest.ts` with `Contest`, `ContestParticipant`, `ContestSubmission` interfaces
- [ ] 1.2 Create `src/services/ContestService.ts` — Firestore CRUD for contests, participants, submissions
- [ ] 1.3 Create `src/contexts/ContestContext.tsx` — React context holding current contest state + participant info

## 2. Entrance Page

- [ ] 2.1 Create `src/pages/EntrancePage/index.tsx` — login form (username/password) + contact info (name, email, phone)
- [ ] 2.2 Create `src/pages/EntrancePage/EntrancePage.css` — premium glassmorphism styling
- [ ] 2.3 Integrate with `AuthContext.signInWithEmail` for Firebase login
- [ ] 2.4 Save participant record to `contest_participants` on successful login
- [ ] 2.5 Add contest info display (title, description, schedule, countdown)

## 3. Exam Room

- [ ] 3.1 Create `src/components/ContestSidebar/index.tsx` — challenge list with status icons (pending/pass/fail)
- [ ] 3.2 Create `src/components/ContestSidebar/ContestSidebar.css` — collapsible sidebar styling
- [ ] 3.3 Create `src/components/ContestTimer/index.tsx` — countdown timer with warning states
- [ ] 3.4 Create `src/pages/ExamRoom/index.tsx` — layout combining ContestSidebar + QuestPlayer
- [ ] 3.5 Create `src/pages/ExamRoom/ExamRoom.css` — exam room layout styling
- [ ] 3.6 Load quest data dynamically from contest config (not import.meta.glob)
- [ ] 3.7 Handle challenge switching — update QuestPlayer when user clicks sidebar item

## 4. Submission & Scoring

- [ ] 4.1 Capture `QuestCompletionResult` from QuestPlayer `onQuestComplete` callback
- [ ] 4.2 Calculate per-challenge score from `TestCaseResult`s
- [ ] 4.3 Save submission to `contest_submissions` in Firestore
- [ ] 4.4 Update sidebar status icons after each submission
- [ ] 4.5 Implement scoring mode (highest vs latest per challenge)

## 5. Route Integration & Guards

- [ ] 5.1 Add `/contest/:contestId` and `/contest/:contestId/exam` routes to `App.tsx`
- [ ] 5.2 Create route guard: redirect to entrance if not authenticated
- [ ] 5.3 Create route guard: check contest is active (between start/end time)
- [ ] 5.4 Wrap contest routes with `ContestContext.Provider`

## 6. Final Submission & Results

- [ ] 6.1 Add "Nộp bài" (Submit all) button on sidebar
- [ ] 6.2 Show confirmation dialog before final submission
- [ ] 6.3 Calculate total score and lock exam after submission
- [ ] 6.4 Show results summary page after submission

## 7. Verification

- [ ] 7.1 Create sample contest config in Firestore with 3 algo challenges
- [ ] 7.2 Test entrance flow: login → contact info → exam room
- [ ] 7.3 Test challenge switching and submission flow
- [ ] 7.4 Test timer countdown and auto-submit on timeout
- [ ] 7.5 Verify `pnpm build` — no type/compilation errors
