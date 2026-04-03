# Change: Modernize Scratch Contest UI

## Why
The current Scratch contest interface is functional but looks basic and disjointed from the premium design standards of the project. It needs a more professional, cohesive layout with better resource accessibility (starter projects) and visual feedback.

## What Changes
- **MODIFIED**: Redesign `ScratchQuestPanel` to a two-column glassmorphism layout.
- **MODIFIED**: Redesign `ScratchTurboWarpPanel` with a collapsible sidebar for better editor space.
- **ADDED**: Integrated "Dự án mẫu" (Starter Project) section to both panels.
- **MODIFIED**: Update component props to pass full `quest` object for richer metadata access.
- **MODIFIED**: Modernize `TestcaseGrid` and `SubmissionHistory` styling.
- **ADDED**: Global design tokens transition in `index.css`.

## Impact
- Specs: `openspec/specs/react-quest-app/spec.md`
- Code: 
  - `apps/react-quest-app/src/components/ScratchQuestPanel/*`
  - `apps/react-quest-app/src/components/ScratchTurboWarpPanel/*`
  - `apps/react-quest-app/src/index.css`
  - `apps/react-quest-app/src/pages/ExamRoom/index.tsx`
