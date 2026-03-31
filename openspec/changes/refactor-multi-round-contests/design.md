## Context
Current contest-dashboard uses a flat data model where each contest contains `quest_data` (JSONB array of challenges) directly. This does not support multiple rounds, exam variants, or regional exam boards. The user needs to run large-scale competitions with Olympic-style multi-round progression.

## Goals / Non-Goals
- **Goals**:
  - Support Contest → N Rounds → N Exams + N Boards hierarchy
  - Configurable timing (synchronized vs per-board), promotion (auto vs manual), exam assignment (shared vs unique)
  - 3-level leaderboards (board, round, contest)
  - JSON import/export at contest, round, and exam levels
  - Dynamic configuration (no hardcoded limits on rounds/boards)
- **Non-Goals**:
  - Migration of existing data (fresh start)
  - Mobile-specific UI
  - Multi-tenant support

## Decisions

### Decision: Data Model Hierarchy
```
contests (top-level metadata + global settings)
  └── rounds (ordered phases, each with timing + promotion config)
       ├── exams (question sets, quest_data JSONB)
       └── exam_boards (regional clusters, FK to exam, optional timing override)
            └── board_participants (assignment of participant to board for a round)
                 └── submissions (linked to board_participant + exam)
```

### Decision: Timing Architecture
- `rounds.timing` JSONB: `{timingMode: "synchronized"|"per_board", start_time, end_time, duration_minutes}`
- When `timingMode = "synchronized"`: all boards use round-level timing
- When `timingMode = "per_board"`: each `exam_boards.timing_override` JSONB provides board-specific timing
- Individual participant `deadline` in `board_participants` for flexible mode

### Decision: Promotion System
- `rounds.promotion_config` JSONB: `{mode: "auto"|"manual", autoRule: {type, value}}`
- Auto rules: `top_n` (top N participants), `min_score` (minimum score threshold), `top_percent` (top X%)
- Manual: Admin reviews a promotion page with current rankings and selects who advances
- Promotion creates `board_participants` entries in the next round's boards

### Decision: Leaderboard Architecture
- Use Postgres VIEWs for each level:
  - `board_leaderboard`: scores within a single board
  - `round_leaderboard`: aggregated across all boards in a round
  - `contest_leaderboard`: aggregated across all rounds (cumulative)
- Each view uses the same best-score-per-quest pattern from current `leaderboard` view

### Decision: JSON Import/Export
- Full contest JSON schema includes nested rounds → exams + boards
- Import resolves references by title (e.g., board's `exam_title` links to exam by title within same round)
- Export generates the same schema from database
- Support partial import: round-only or exam-only

## Risks / Trade-offs
- **Complexity vs Simplicity**: The hierarchical model adds significant complexity. Mitigated by keeping the UI progressive (simple contests still work with 1 round + 1 board)
- **Performance**: 3-level leaderboard queries may be slow with 1000+ participants. Mitigated by proper indexes and materialized views if needed
- **Supabase Free Tier**: More tables = more RLS policies = more overhead. Mitigated by using SECURITY DEFINER functions where appropriate

## Open Questions
- Should the system support "practice rounds" that don't count toward promotion?
- Should boards be allowed to span multiple rounds (e.g., a regional cluster that persists)?
