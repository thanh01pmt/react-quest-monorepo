# Change: Refactor to Multi-Round Contest Architecture

## Why
The current flat contest model (1 contest → N challenges) cannot support real-world competition requirements:
- Multiple rounds (preliminary → semi-final → final)
- Multiple exam variants per round (different papers for different regions)
- Multiple exam boards/clusters with independent timing
- Automated or manual promotion between rounds
- Multi-level leaderboards (board → round → contest)

## What Changes
- **BREAKING**: Replace flat `contests.quest_data` with hierarchical `rounds → exams → exam_boards` tables
- **BREAKING**: Replace `participants` direct contest link with `board_participants` for round/board assignment
- **BREAKING**: Replace `submissions` direct contest link with references to `board_participant_id` + `exam_id`
- Add configurable timing modes per round (synchronized all boards vs per-board override)
- Add configurable promotion between rounds (auto by score/rank/percent vs manual admin review)
- Add JSON import/export at 3 levels: full contest, single round, single exam
- Add 3-level leaderboard views (board, round, contest)
- Add new UI pages: RoundManager, BoardManager, PromotionReview, JsonImport

## Impact
- Specs: `contest-dashboard`
- Code: `apps/contest-dashboard/supabase/migration.sql`, `apps/contest-dashboard/src/types/`, `apps/contest-dashboard/src/pages/*`
- **BREAKING**: Existing data in `contests.quest_data` will not be migrated (fresh start per user decision)
