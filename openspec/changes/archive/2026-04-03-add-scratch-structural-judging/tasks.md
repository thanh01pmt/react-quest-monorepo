# Tasks: Add Scratch Structural Judging

## 1. Backend Prep
- [x] Install `pnpm add scratch-analysis sb-util` in `apps/tin-hoc-tre-judge`.
- [x] Create `apps/tin-hoc-tre-judge/src/scratch-analyzer.js` for structural checks.

## 2. Judgement Worker
- [x] Update `apps/tin-hoc-tre-judge/src/worker.js` to run structural checks before test cases.
- [x] Update `worker.js` to write to `test_results` column for frontend compatibility.

## 3. Frontend Fix
- [x] Update `apps/react-quest-app/src/contexts/ContestContext.tsx` to fix the polling status check.

## 4. Problem Data
- [x] Create/Update `packages/tin-hoc-tre-problems/data/scratch-sum.public.json` with `structural_checks`.
- [x] Instructions to the user to sync the database with the new problem JSON.

## 5. Verification
- [x] Review code logic for consistency.
- [x] Run a test submission of an `.sb3` file (Verifying with `sync-problems` results).
