# Change: Refactor Scratch Quest Panel & History

## Why
Users need to view their submission history and instructions while working on Scratch challenges. Additionally, there are UUID-related submission errors that need to be resolved.

## What Changes
- [NEW] `GET /api/submit/history/:quest_id` endpoint for participants.
- [MODIFY] Backend `submit.js` to ensure UUID compatibility.
- [NEW] `ScratchQuestPanel` component with 3 tabs (Nộp bài, Lịch sử, Cách nộp).
- [MODIFY] `ExamRoom` to use the new panel.
- **BREAKING**: Replaces `ScratchUploader` component.

## Impact
- Specs: `submissions`
- Code: `apps/tin-hoc-tre-api/src/routes/submit.js`, `apps/react-quest-app/src/components/ScratchQuestPanel.tsx`, `apps/react-quest-app/src/pages/ExamRoom.tsx`
