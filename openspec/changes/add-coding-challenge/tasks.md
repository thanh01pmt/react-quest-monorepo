## 1. Types Layer
- [ ] 1.1 Add `AlgoConfig`, `TestCase` interfaces and `'algo'` to `GameConfig` / `Quest.gameType` union in `types/index.ts`.
- [ ] 1.2 Add `algoConfigSchema`, `testCaseSchema` and `'algo'` to `gameConfigSchema` / `questSchema` in `types/schemas.ts`.
- [ ] 1.3 Add `'match_output'` to `SolutionConfig.type` and `solutionConfigSchema`.

## 2. Game Engine & Renderer
- [ ] 2.1 Create `games/algo/AlgoEngine.ts` implementing `IGameEngine` with test case execution.
- [ ] 2.2 Create `games/algo/AlgoRenderer.tsx` implementing `IGameRenderer` with markdown problem display.
- [ ] 2.3 Create `games/algo/index.ts` exporting `GameEngine` and `GameRenderer`.

## 3. Game Registry Integration
- [ ] 3.1 Register `algo: AlgoGame` in `games/index.ts`.
- [ ] 3.2 Add noop initializer for algo in `GameBlockManager.ts`.

## 4. QuestPlayer Component Adaptation
- [ ] 4.1 Adapt left panel: hide `descriptionArea` when algo; controls show Run + Submit (no camera).
- [ ] 4.2 Adapt right panel: algo forces Monaco-only (no Blockly); set initial code from `AlgoConfig.initialCode`.
- [ ] 4.3 Adapt bottom panel: render `TestCasePanel` instead of `ConsolePanel` when algo.
- [ ] 4.4 Adapt `handleRun`: for algo, skip Blockly workspace checks and pass `aceCode` directly.

## 5. TestCasePanel Component
- [ ] 5.1 Create `components/TestCasePanel/TestCasePanel.tsx` + CSS.

## 6. Public API & App Integration
- [ ] 6.1 Export `AlgoConfig`, `TestCase` from `src/index.ts`.
- [ ] 6.2 Create sample algo quest JSON in `apps/react-quest-app/quests/algo/`.

## 7. Verification
- [ ] 7.1 Run `pnpm build` to verify no type or compilation errors.
- [ ] 7.2 Load sample algo quest in standalone quest-player and test pass/fail scenarios.
