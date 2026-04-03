# Change: update-scratch-player

## Why
Currently, the `ExamRoom` fails to display the appropriate UI for Scratch quests because of a bug in how `gameType` is referenced, leading it to mount `QuestPlayer` which throws an error. Additionally, the Scratch submission flow needs enhancements: it currently only accepts direct `.sb3` file uploads and lacks immediate feedback. We need to allow students to submit published Scratch project URLs (using `@turbowarp/sbdl` to fetch the file), provide instant mock or real analysis of public test cases, and restrict the actual score recording to when they press the "Submit" button.

## What Changes
- Make `ExamRoom` correctly branch to `ScratchUploader` when `currentQuest.gameType === 'scratch'` or `currentQuest.gameConfig?.type === 'scratch'`.
- Upgrade `ScratchUploader` to accept either an `.sb3` file OR a Scratch Project URL.
- Integrate `@turbowarp/sbdl` library to fetch `.sb3` buffers from Scratch Project URLs in the browser.
- Implement an evaluation phase: The system will run an immediate analysis using public test cases when a file/link is provided, displaying results so students know what works.
- Clearly separate the local/immediate "Feedback" phase from the "Official Submit" phase, which is when the final `.sb3` blob is uploaded to the server for final grading and recording.

## Impact
- Specs: `react-quest-app/spec.md`, `tin-hoc-tre-api/spec.md` (if adding new evaluation endpoint)
- Code: `apps/react-quest-app/src/pages/ExamRoom/index.tsx`, `apps/react-quest-app/src/components/ScratchUploader/ScratchUploader.tsx`, `apps/react-quest-app/package.json`
