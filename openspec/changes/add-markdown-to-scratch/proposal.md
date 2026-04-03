# Change: Add Markdown Support to Scratch Quest Portal

## Why
The problem description in the Scratch quest portal currently only supports basic line breaks using `dangerouslySetInnerHTML`. This makes it difficult to present complex task requirements with headers, lists, and bold text, leading to a poor user experience compared to other contest types.

## What Changes
- Create a reusable `MarkdownRenderer` component in `@repo/quest-player`.
- Export `MarkdownRenderer` from the main library.
- Update `ScratchQuestPanel` in `react-quest-app` to use the markdown renderer.

## Impact
- Specs: `scratch-portal` (ADD)
- Code: `packages/quest-player/src/components/MarkdownRenderer/*`, `apps/react-quest-app/src/components/ScratchQuestPanel/ScratchQuestPanel.tsx`
