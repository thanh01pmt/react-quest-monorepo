# Change: Enhance Scratch Portal Mode

## Why
The current Scratch Portal Mode (TurboWarp Embed) lacks sufficient challenge information (starter projects, rich descriptions) and it's unclear to the user how to navigate between multiple challenges if they exist. The UI also needs to feel more premium to align with modern educational platforms.

## What Changes
- **MODIFIED** [ExamRoom/index.tsx](file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/apps/react-quest-app/src/pages/ExamRoom/index.tsx) to pass the entire quest object.
- **MODIFIED** [ScratchTurboWarpPanel.tsx](file:///Users/tonypham/MEGA/WebApp/blockly-react/react-quest-monorepo/apps/react-quest-app/src/components/ScratchTurboWarpPanel/ScratchTurboWarpPanel.tsx) to support starter projects and richer info.
- **NEW** Starter Project section with download links and "Open in Editor" shortcuts.
- **REFINE** UI styling with premium glassmorphism and smooth transitions.
- **VERIFY** Sidebar rendering for contests with 2+ challenges.

## Impact
- Specs: `openspec/specs/contest/spec.md` (if exists)
- Code: `ExamRoom.tsx`, `ScratchTurboWarpPanel.tsx`, `ScratchTurboWarpPanel.css`, `ScratchEditor.tsx`
