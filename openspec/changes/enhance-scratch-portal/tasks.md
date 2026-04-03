## 1. Scratch Portal UI Refinement

- [ ] 1.1 **Update Component Interfaces**: Modify `ScratchTurboWarpPanelProps` to accept `Quest` object directly.
- [ ] 1.2 **Starter Project Integration**: 
    - Check `gameConfig` for `starterSb3Url` or `scratchProjectId`.
    - Render a "Dự án mẫu" section in the sidebar with download link and "Open in Editor" shortcut.
- [ ] 1.3 **Sidebar Layout Polish**: 
    - Implement better sectioning (Problem, Submission, Results).
    - Use more descriptive status badges for test results.
    - Polish `ScratchTurboWarpPanel.css` for a "premium" feel.
- [ ] 1.4 **Multi-Challenge Rendering Test**:
    - Add mock data for multiple challenges if necessary to verify sidebar navigation works correctly for high-count quests.

## 2. Shared Assets & Style Updates
- [ ] 2.1 Refine `ScratchEditor.tsx` launcher text to dynamic values.
- [ ] 2.2 Polish `ScratchEditor.css` for better color harmony.
