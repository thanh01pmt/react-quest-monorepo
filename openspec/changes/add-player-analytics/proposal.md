# Change: Add Player Analytics

## Why
To measure student effort and competence, we need to track user interactions and performance timing details. This data allows educators to analyze learning patterns, such as trial-and-error behavior vs. thoughtful planning.

## What Changes
- **Detailed Interaction Tracking**:
    - **Run/Debug Counts**: Count how many times the user attempts to run or debug.
    - **Timings**:
        - **Intervals**: Time (in ms) between each Run/Debug attempt.
        - **Star Milestones**: Timestamp when the user first achieves 1, 2, and 3 stars.
- **QuestMetrics Interface**: A new data structure to hold these metrics.
- **Completion Result**: `QuestCompletionResult` will include `metrics: QuestMetrics`.

## Impact
- **Specs**:
    - `specs/quest-player/spec.md`: ADDED requirements for Metrics Tracking.
- **Code**:
    - `packages/quest-player/src/types/index.ts`: Update types.
    - `packages/quest-player/src/components/QuestPlayer/index.tsx`: Implement tracking logic.
