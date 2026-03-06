# Specification: quest-player-algo

## Description
This capability allows the `quest-player` package to render standard text-based algorithmic coding challenges (e.g., Teky, LeetCode). It reuses the existing two-panel layout of the Maze 3D game, replacing the 3D visualization with a problem statement renderer and the console with a test case results panel.

## ADDED Requirements

### Requirement: Algorithm Game Type Registration
The quest-player SHALL support `algo` as a valid `gameType` within the `Quest` interface and `AlgoConfig` as a valid member of the `GameConfig` discriminated union.

#### Scenario: Registration Success
- **WHEN** a `Quest` JSON with `gameType: "algo"` and a `gameConfig` of `type: "algo"` is loaded.
- **THEN** the `useQuestLoader` hook finds the `algo` module in `gameRegistry`.
- **THEN** it instantiates `AlgoEngine` and selects `AlgoRenderer`.

#### Scenario: Zod Validation Success
- **WHEN** `questSchema.safeParse()` is called on a valid algo quest JSON.
- **THEN** validation succeeds and the parsed data includes the `AlgoConfig` fields.

---

### Requirement: Problem Statement Renderer (Left Panel)
The `AlgoRenderer` SHALL display the full problem statement in the left panel area, replacing the game visualization canvas.

#### Scenario: Full Problem Display
- **WHEN** the `AlgoRenderer` component mounts with a valid `AlgoConfig`.
- **THEN** it renders in the `<Visualization>` slot (left panel).
- **THEN** it displays the problem title, markdown description, input/output format, constraints, and sample test cases.
- **THEN** the content is scrollable and styled consistently with the existing `descriptionArea` aesthetic.

#### Scenario: Description Area Hidden
- **WHEN** `gameType === 'algo'`.
- **THEN** the bottom `descriptionArea` bar in the left panel is hidden (since the description is integrated into the renderer).

---

### Requirement: Cross-Language Supported Editor (Right Panel Top)
When `gameType === 'algo'`, the right panel editor area SHALL support Blockly, JavaScript, and Python interchangeably.

#### Scenario: Editor Initialization
- **WHEN** an algo quest loads with `supportedLanguages: ['blockly', 'javascript', 'python']`.
- **THEN** `EditorToolbar` shows "Blocks", "JavaScript", and "Python" tabs.
- **THEN** selecting JS or Python initializes `MonacoEditor` with the template code from `AlgoConfig.initialCode[selectedLanguage]`.
- **THEN** selecting Blocks initializes `BlocklyWorkspace` with `blocklyConfig`.

#### Scenario: Language Switching
- **WHEN** the user switches between language tabs.
- **THEN** the Monaco editor content updates to the `initialCode` template for the selected language.
- **THEN** each language tab preserves the user's code independently.

---

### Requirement: Multi-Language Test Case Execution Engine
The `AlgoEngine` SHALL execute user code (Blockly-compiled-JS, JS, or Python) against defined test cases and produce a structured result for each, using the appropriate runtime.

#### Scenario: JavaScript & Blockly Execution
- **WHEN** the user runs JS code (or JS compiled from Blockly).
- **THEN** the engine uses `js-interpreter` to sandbox execution.
- **THEN** it mocks `prompt()` to feed test case input line by line.

#### Scenario: Lightweight Python Execution (Default)
- **WHEN** the user runs Python code and `pythonRuntime` is not explicitly `pyodide`.
- **THEN** the engine uses `Skulpt` for near-instant execution.
- **THEN** it mocks `input()` to feed test case input and captures `print()`.

#### Scenario: Advanced Python Execution (Pyodide)
- **WHEN** the user runs Python code and `pythonRuntime === 'pyodide'`.
- **THEN** the engine lazy-loads Pyodide WASM (if not already loaded).
- **THEN** it executes the full CPython environment for the test cases.
- **THEN** it captures `console.log()` / `print()` output.
- **THEN** it compares actual output (trimmed) to `expectedOutput`.
- **THEN** each test case receives status `'pass'` or `'fail'`.

#### Scenario: Submit Execution
- **WHEN** the user clicks "Submit".
- **THEN** the engine executes the code against ALL test cases (sample + hidden).
- **THEN** hidden test cases show only pass/fail status, not input/expected output.
- **THEN** if all tests pass, `checkWinCondition` returns `true`.

#### Scenario: Code Error
- **WHEN** the user's code throws a runtime error.
- **THEN** the test case result status is `'error'` with `errorMessage` populated.

#### Scenario: Timeout
- **WHEN** the user's code exceeds `AlgoConfig.timeLimit` (default 5000ms).
- **THEN** the test case result status is `'timeout'`.

---

### Requirement: Test Case Results Panel (Right Panel Bottom)
A `TestCasePanel` component SHALL replace the `ConsolePanel` in the bottom of the right panel when `gameType === 'algo'`.

#### Scenario: Results Display
- **WHEN** code execution completes.
- **THEN** the `TestCasePanel` shows each test case with: index, input (code block), expected output, actual output, status badge (✅ Pass / ❌ Fail / ⏳ Pending / ⚠️ Error / ⏱ Timeout).
- **THEN** a summary line shows "X/Y tests passed".

#### Scenario: Hidden Tests Display
- **WHEN** a test case has `isHidden: true`.
- **THEN** only the status badge and execution time are shown. Input and expected output are hidden.

---

### Requirement: Scoring and Completion
The algo quest SHALL use the existing `QuestCompletionResult` and star-rating system.

#### Scenario: Completion Flow
- **WHEN** all test cases (sample + hidden) pass after "Submit".
- **THEN** `checkWinCondition` returns `true`.
- **THEN** `onQuestComplete` is called with `isSuccess: true`, `unitLabel: 'line'`, `unitCount` = logical line count.
- **THEN** stars are awarded: 3 stars if `lineCount <= optimalLines`, otherwise 2 stars.

---

### Requirement: App Integration (react-quest-app)
The `react-quest-app` SHALL automatically support algo quests without code changes to `App.tsx`.

#### Scenario: Auto-Discovery
- **WHEN** algo quest JSON files are added to `apps/react-quest-app/quests/algo/`.
- **THEN** `import.meta.glob('../quests/**/*.json')` picks them up.
- **THEN** `questSchema.safeParse()` validates them successfully.
- **THEN** the quests appear in the sidebar and render correctly via `QuestPlayer`.
