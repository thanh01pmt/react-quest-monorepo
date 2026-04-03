## 1. Preparation
- [x] 1.1 Research existing components and types.
- [x] 1.2 Drafting the modernize-scratch-contest-ui proposal.

## 2. Global Styles
- [ ] 2.1 Update `apps/react-quest-app/src/index.css` with global design tokens.

## 3. Component Redesign
- [x] 3.1 Redesign `ScratchQuestPanel` to a two-column glassmorphism layout. (Already done)
- [x] 3.2 Redesign `ScratchTurboWarpPanel` with a collapsible sidebar. (Already done)
- [ ] 3.3 Modernize `TestcaseGrid.css` styling (circular score charts, glass cards).
- [ ] 3.4 Modernize `SubmissionHistory.css` with better selection states.
- [ ] 3.5 Modernize `ScratchUploader.css` (drag-and-drop zone improvements).

## 4. Logical Integration
- [x] 4.1 Update `ExamRoom/index.tsx` to pass the full `quest` object. (Already done)
- [x] 4.2 Update `ScratchQuestPanel.tsx` and `ScratchTurboWarpPanel.tsx` to handle the new prop structure. (Already done)

## 5. Verification
- [ ] 5.1 Test responsive layout for the sidebar.
- [ ] 5.2 Test "Starter Project" links.
- [ ] 5.3 Test submission flow and results feedback.
