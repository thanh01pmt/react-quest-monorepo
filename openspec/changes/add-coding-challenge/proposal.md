# Change: add-coding-challenge

## Why
Quest Player hiện tại hỗ trợ các dạng game trực quan (maze, turtle, bird, pond) với Blockly/Monaco editors. Tuy nhiên, nó chưa hỗ trợ dạng bài **lập trình thuật toán** (giống Teky, LeetCode, HackerRank) — nơi học sinh đọc đề bài dạng text, viết code, và chạy đối chiếu với test cases.

Thay đổi này thêm `gameType: 'algo'` tái sử dụng hoàn toàn layout 2-panel hiện có của Maze 3D (left = visualization panel, right = editor + console), chỉ thay thế nội dung:
- **Left panel (Visualization → Problem Statement)**: Thay vì render 3D/2D game canvas, hiển thị đề bài dưới dạng Markdown (tiêu đề, mô tả, input/output format, ví dụ mẫu).
- **Right panel (Editor + Console → Editor + Test Cases)**: Giữ nguyên Blockly + Monaco editor ở trên cho viết code. Thay ConsolePanel ở dưới bằng **TestCasePanel** hiển thị kết quả chạy từng test case (pass/fail, expected vs actual output).

## Chiến lược Thực thi (Execution Strategy)
Để đảm bảo "chính xác tuyệt đối" và hiệu năng tối ưu cho 3 môi trường (Blockly, JS, Python), hệ thống sử dụng kiến trúc hybrid:

1. **JavaScript & Blockly**: 
   - Blockly compile ra JS.
   - Chạy qua `js-interpreter` (sandbox an toàn tuyệt đối). 
   - Inject hàm `prompt()` đọc từ input test case, và `console.log()` ghi ra actual output.
2. **Python (Hybrid Mode)**:
   - **Skulpt (Mặc định - Nhẹ ~1MB)**: Load tức thì. Chạy 100% chính xác các bài toán thuật toán tiêu chuẩn (for, while, if, list, dict, array manipulation, đệ quy).
   - **Pyodide (Nâng cao - Nặng ~11MB)**: Chỉ được nạp khi quest JSON config `pythonRuntime: "pyodide"`. Dành riêng cho các bài toán đặc thù cần `numpy`, thư viện ngoài, hoặc tính năng Python 3.11 phức tạp. Tải ngầm (lazy-load) khi user mở quest.

## App Layer Analysis — `react-quest-app`

> **Kết luận: Tích hợp algo vào chính `react-quest-app`, KHÔNG cần tạo app mới.**

### Lý do:
1. **`react-quest-app` là thin shell**: Toàn bộ rendering delegate cho `QuestPlayer` component. `App.tsx` chỉ làm:
   - Load quest JSON từ `quests/**/*.json` via `import.meta.glob`.
   - Validate bằng `questSchema` (Zod).
   - Pass xuống `<QuestPlayer isStandalone={false} questData={...} />`.
   - Xử lý completion dialog + navigation.
2. **Quest routing đã generic**: Route `/quest/:groupId/:questId` không quan tâm `gameType`. Chỉ cần thêm file JSON vào `quests/algo/` folder là app tự động nhận.
3. **Sidebar + navigation đã generic**: `QuestSidebar` hiển thị danh sách quest theo groupId, không filter theo gameType.
4. **Validation cần update**: `questSchema` trong `schemas.ts` cần thêm `'algo'` vào `gameType` enum và `algoConfigSchema` vào `gameConfigSchema` union. Sau đó `App.tsx` line 204 (`questSchema.safeParse(targetQuest)`) sẽ tự accept algo quests.

### App-layer changes cần thiết:
| File | Thay đổi |
|------|----------|
| `apps/react-quest-app/quests/algo/` | **[NEW]** Thêm folder + sample algo quest JSON |
| `packages/quest-player/src/types/schemas.ts` | **[MODIFY]** Thêm `'algo'` gameType + algoConfigSchema |

> Không cần sửa `App.tsx` vì nó đã generic. Khi `QuestPlayer` nhận quest với `gameType: 'algo'`, nó sẽ tự render `AlgoRenderer` ở left panel + Monaco editor ở right panel.

---

## What Changes (Chi tiết)

### 1. Types Layer — `packages/quest-player/src/types/`

#### [MODIFY] `index.ts`
```diff
-export type GameConfig = MazeConfig | TurtleConfig | PondConfig | BirdConfig;
+export type GameConfig = MazeConfig | TurtleConfig | PondConfig | BirdConfig | AlgoConfig;

 export interface Quest {
-  gameType: 'maze' | 'bird' | 'turtle' | 'movie' | 'music' | 'pond' | 'puzzle';
+  gameType: 'maze' | 'bird' | 'turtle' | 'movie' | 'music' | 'pond' | 'puzzle' | 'algo';

 export interface SolutionConfig {
-  type: 'reach_target' | 'match_drawing' | 'match_music' | 'survive_battle' | 'destroy_target';
+  type: 'reach_target' | 'match_drawing' | 'match_music' | 'survive_battle' | 'destroy_target' | 'match_output';
```

**New interfaces:**
```typescript
export interface TestCase {
  input: string;           // Stdin / prompt() input (mỗi dòng một giá trị)
  expectedOutput: string;  // Expected stdout output (trim + compare)
  isHidden?: boolean;      // Ẩn input/expected từ user, chỉ hiện kết quả
  label?: string;          // Optional display label, ví dụ "Ví dụ 1"
}

export interface AlgoConfig {
  type: 'algo';
  description: string;     // Markdown description của bài toán (full)
  inputFormat?: string;     // Mô tả format input
  outputFormat?: string;    // Mô tả format output
  constraints?: string;     // Ràng buộc (ví dụ "1 <= a, b, c <= 100.000.000.000")
  sampleCases: TestCase[];  // Visible test cases (hiện input+output)
  hiddenCases?: TestCase[]; // Hidden test cases (chỉ hiện pass/fail)
  timeLimit?: number;       // Time limit per test case (ms), default 5000
  supportedLanguages?: ('blockly' | 'javascript' | 'python')[]; // Ngôn ngữ hỗ trợ
  pythonRuntime?: 'skulpt' | 'pyodide'; // Mặc định là skulpt để load nhanh
  initialCode?: Record<string, string>; // Template code per language
}
```

#### [MODIFY] `schemas.ts`
```diff
+const testCaseSchema = z.object({
+  input: z.string(),
+  expectedOutput: z.string(),
+  isHidden: z.boolean().optional(),
+  label: z.string().optional(),
+});
+
+const algoConfigSchema = z.object({
+  type: z.literal('algo'),
+  description: z.string(),
+  inputFormat: z.string().optional(),
+  outputFormat: z.string().optional(),
+  constraints: z.string().optional(),
+  sampleCases: z.array(testCaseSchema),
+  hiddenCases: z.array(testCaseSchema).optional(),
+  timeLimit: z.number().optional(),
+  supportedLanguages: z.array(z.enum(['javascript', 'python'])).optional(),
+  initialCode: z.record(z.string(), z.string()).optional(),
+});

 const gameConfigSchema = z.discriminatedUnion('type', [
   mazeConfigSchema,
   turtleConfigSchema,
   pondConfigSchema,
   birdConfigSchema,
+  algoConfigSchema,
 ]);

 export const questSchema = z.object({
-  gameType: z.enum(['maze', 'bird', 'turtle', 'movie', 'music', 'pond', 'puzzle']),
+  gameType: z.enum(['maze', 'bird', 'turtle', 'movie', 'music', 'pond', 'puzzle', 'algo']),
```

---

### 2. Game Engine — `packages/quest-player/src/games/algo/`

#### [NEW] `AlgoEngine.ts`
Implements `IGameEngine` interface (pattern giống `MazeEngine`).

**Design:**
- **`constructor(gameConfig: GameConfig)`**: Lưu `AlgoConfig`, khởi tạo `AlgoGameState` với tất cả test results ở trạng thái `pending`.
- **`getInitialState(): AlgoGameState`**: Trả `testResults[]` pending, `allPassed: false`.
- **`execute(userCode: string): void`**: Chạy user code với từng test case:
  - Dùng `Function` constructor (sandboxed) hoặc `js-interpreter` (đã có trong project).
  - Mock `prompt()` hoặc custom `readline()` bằng cách inject input từ `testCase.input` line by line.
  - Capture `console.log()` output → so sánh với `expectedOutput` (trim + normalize).
  - Set timeout per test case (default 5000ms).
  - Ghi kết quả vào `testResults[]`.
- **`checkWinCondition(finalState, solutionConfig): boolean`**: Returns `finalState.allPassed`.
- **Không có `step()`** — algo chạy batch mode (tất cả test cases xong ngay lập tức), không cần step-by-step animation. `useGameLoop` sẽ xử lý bằng log-based replay (giống Python/Lua mode).
- **`reset()`**: Reset tất cả `testResults` về `pending`.

**GameState type:**
```typescript
export interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: 'pending' | 'pass' | 'fail' | 'error' | 'timeout';
  errorMessage?: string;
  executionTime?: number; // ms
  isHidden: boolean;
}

export interface AlgoGameState extends GameState {
  testResults: TestCaseResult[];
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
}
```

#### [NEW] `AlgoRenderer.tsx`
Implements `IGameRenderer` interface (pattern giống `Maze2DRenderer`).

**Hiển thị ở LEFT PANEL** (thay cho 3D canvas / visualization area):
- **Header**: Tiêu đề bài (lấy từ `Quest.title` hoặc `Quest.titleKey`).
- **Description**: Render markdown content từ `AlgoConfig.description` (dùng `dangerouslySetInnerHTML` với sanitized HTML hoặc simple markdown parser — đã có pattern trong `GuideRenderer`).
- **Input/Output Format**: Section riêng nếu `inputFormat` / `outputFormat` có.
- **Constraints**: Hiển thị ràng buộc nếu có.
- **Sample Cases**: Render mỗi sample case trong cặp code blocks (Input: / Output:).
- **Styling**: Full-height scrollable, light background, giống document viewer.

#### [NEW] `index.ts`
```typescript
import { AlgoEngine } from './AlgoEngine';
import { AlgoRenderer } from './AlgoRenderer';
export const GameEngine = AlgoEngine;
export const GameRenderer = AlgoRenderer;  // Single renderer (không có Renderers map)
```

---

### 3. Game Registry — `packages/quest-player/src/games/`

#### [MODIFY] `index.ts`
```diff
+import * as AlgoGame from './algo';

 export const gameRegistry: Record<string, GameModule> = {
     bird: BirdGame,
     maze: MazeGame,
     pond: PondGame,
     turtle: TurtleGame,
+    algo: AlgoGame,
 };
```

#### [MODIFY] `GameBlockManager.ts`
Algo không dùng Blockly blocks → thêm noop initializer:
```diff
+// Algo doesn't use Blockly blocks, so no-op initializer
+const initAlgo = (_t: TFunction) => { /* noop */ };

 const initializers: Record<string, (t: TFunction) => void> = {
   maze: initMaze,
   bird: initBird,
   turtle: initTurtle,
   pond: initPond,
+  algo: initAlgo,
 };
```

---

### 4. QuestPlayer Component — `packages/quest-player/src/components/QuestPlayer/`

#### [MODIFY] `index.tsx`
Khi `gameType === 'algo'`, cần hiệu chỉnh behavior tại các điểm sau:

**A. Left Panel (lines ~854-943):**
- `controlsArea`: Ẩn camera selector `is3DRenderer` (đã tự ẩn vì algo không phải maze 3D). Giữ nút Run/Reset. Thêm logic nút "Submit" (chạy cả hidden test cases).
- `<Visualization>` vẫn nhận `AlgoRenderer` → hiển thị đề bài (không cần sửa `Visualization` component — nó chỉ forward props).
- `descriptionArea` (line 941): Ẩn khi `gameType === 'algo'` vì đề bài đã hiển thị trong renderer.

**B. Right Panel — Editor (lines ~946-1060):**
- `EditorToolbar`: Khi algo, `supportedEditors` lấy từ `AlgoConfig.supportedLanguages` (ví dụ `['blockly', 'javascript', 'python']`).
- Editor area: Tùy tab được chọn mà render `BlocklyWorkspace` hoặc `MonacoEditor`.
- `SettingsPanel`: Ẩn Blockly-specific settings (renderer, theme, grid, block mode) không liên quan đến algo.

**C. Right Panel — Bottom Console (lines ~1069-1076):**
- Khi algo: Thay `<ConsolePanel>` bằng `<TestCasePanel>` hiển thị test results từ `AlgoGameState.testResults`.
- `TestCasePanel` nhận `testResults: TestCaseResult[]` và hiển thị:
  - Mỗi test case: index, input (code block), expected, actual, status badge (✅/❌/⏳).
  - Summary: "3/5 tests passed".

**D. handleRun (lines ~612-661):**
- Khi algo, skip Blockly workspace check. Transpile `aceCode` (Monaco content) và pass trực tiếp cho `runGame()`.

**E. useEditorManager hook:**
- Khi `initialEditor` là 'javascript' hoặc 'python' (algo quest), set `aceCode` từ `AlgoConfig.initialCode[language]`.

---

### 5. TestCasePanel — `packages/quest-player/src/components/TestCasePanel/`

#### [NEW] `TestCasePanel.tsx` + `TestCasePanel.css`
- Layout giống `ConsolePanel`: header bar + scrollable content.
- Header: "Test Cases" title + clear/re-run button.
- Content: List of test case cards:
  ```
  ┌─────────────────────────────────────┐
  │ Test #1                     ✅ Pass │
  │ Input:    1 1 1                      │
  │ Expected: 800000                     │
  │ Actual:   800000           ⏱ 12ms   │
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ Test #2                     ❌ Fail │
  │ Input:    2 3 1                      │
  │ Expected: 1300000                    │
  │ Actual:   1200000          ⏱ 8ms    │
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ Hidden Test #1              ✅ Pass │
  │ (Input/Output hidden)       ⏱ 5ms  │
  └─────────────────────────────────────┘
  ```

---

### 6. Public API Exports — `packages/quest-player/src/index.ts`

#### [MODIFY]
```diff
 export type {
   Quest,
   QuestPlayerSettings,
   QuestCompletionResult,
   QuestMetrics,
   GameState,
   SolutionConfig,
   MazeConfig,
   Collectible,
   Interactive,
+  AlgoConfig,
+  TestCase,
 } from './types';
```

---

### 7. Sample Quest JSON — `apps/react-quest-app/quests/algo/`

#### [NEW] `tong-tien-mung-tuoi.json`
```json
{
  "id": "ALGO.MATH.SIMPLE_APPLY.A1",
  "gameType": "algo",
  "level": 1,
  "titleKey": "Algo.A1.Title",
  "title": "Bài 1: Tính tổng tiền mừng tuổi",
  "descriptionKey": "Algo.A1.Description",
  "supportedEditors": ["javascript", "python"],
  "translations": {
    "vi": {
      "Algo.A1.Title": "Bài 1: Tính tổng tiền mừng tuổi",
      "Algo.A1.Description": "Giúp bạn An đếm tổng số tiền mừng tuổi"
    }
  },
  "gameConfig": {
    "type": "algo",
    "description": "**Bài 1:** Bạn An là học sinh lớp 1...\n\n**Yêu cầu:** Tính tổng tiền...\n\n**Input:** 3 số nguyên dương a, b, c\n\n**Output:** Tổng tiền",
    "inputFormat": "Nhập vào 3 số nguyên dương: a, b, c",
    "outputFormat": "In ra tổng số tiền",
    "constraints": "1 <= a, b, c <= 100.000.000.000",
    "sampleCases": [
      { "input": "1\n1\n1", "expectedOutput": "800000", "label": "Ví dụ 1" },
      { "input": "2\n3\n1", "expectedOutput": "1300000", "label": "Ví dụ 2" }
    ],
    "hiddenCases": [
      { "input": "0\n0\n0", "expectedOutput": "0" },
      { "input": "10\n5\n2", "expectedOutput": "3000000" }
    ],
    "timeLimit": 5000,
    "supportedLanguages": ["javascript", "python"],
    "initialCode": {
      "javascript": "// Đọc input\nconst a = parseInt(prompt());\nconst b = parseInt(prompt());\nconst c = parseInt(prompt());\n\n// Viết code tại đây\n",
      "python": "# Đọc input\na = int(input())\nb = int(input())\nc = int(input())\n\n# Viết code tại đây\n"
    }
  },
  "solution": {
    "type": "match_output",
    "optimalLines": 5
  }
}
```

---

## Layout Comparison: Maze 3D vs Algo

```
┌─────────────── Maze 3D ────────────────┐   ┌─────────── Algo Challenge ─────────────┐
│ ┌──────────────┬─────────────────────┐  │   │ ┌──────────────┬─────────────────────┐  │
│ │ Left Panel   │ Right Panel         │  │   │ │ Left Panel   │ Right Panel         │  │
│ │              │                     │  │   │ │              │                     │  │
│ │ ┌──────────┐ │ ┌─────────────────┐ │  │   │ │ ┌──────────┐ │ ┌─────────────────┐ │  │
│ │ │ Controls │ │ │ EditorToolbar   │ │  │   │ │ │ Controls │ │ │ EditorToolbar   │ │  │
│ │ │ Run|Debug│ │ │ Blocks|JS|Py|.. │ │  │   │ │ │ Run|Submit│ │ │ JS | Python     │ │  │
│ │ ├──────────┤ │ ├─────────────────┤ │  │   │ │ ├──────────┤ │ ├─────────────────┤ │  │
│ │ │          │ │ │                 │ │  │   │ │ │ Bài 1:   │ │ │                 │ │  │
│ │ │  3D Game │ │ │  Blockly/Monaco │ │  │   │ │ │ Mô tả... │ │ │  Monaco Editor  │ │  │
│ │ │  Canvas  │ │ │  Editor         │ │  │   │ │ │ Input:.. │ │ │  (code area)    │ │  │
│ │ │          │ │ │                 │ │  │   │ │ │ Output:..│ │ │                 │ │  │
│ │ ├──────────┤ │ ├─────────────────┤ │  │   │ │ │ Ví dụ:  │ │ ├─────────────────┤ │  │
│ │ │Descript. │ │ │  Console Panel  │ │  │   │ │ │ a=1,b=1 │ │ │ TestCase Panel  │ │  │
│ │ │ Task:... │ │ │  > output logs  │ │  │   │ │ │ → 800000│ │ │ TC1: ✅ Pass    │ │  │
│ │ └──────────┘ │ └─────────────────┘ │  │   │ │ └──────────┘ │ │ TC2: ❌ Fail    │ │  │
│ └──────────────┴─────────────────────┘  │   │ └──────────────┴─────────────────────┘  │
└─────────────────────────────────────────┘   └─────────────────────────────────────────┘
```

## Integration Flow Diagram

```
App.tsx                         QuestPlayer                          Game Layer
┌──────────┐                   ┌──────────────┐                    ┌──────────────┐
│ Loads     │  questData       │              │  useQuestLoader    │ gameRegistry │
│ JSON from │ ────────────────►│ QuestPlayer  │ ──────────────────►│   .algo      │
│ quests/   │  (validated      │              │  finds AlgoGame    │              │
│ algo/*.json│  by Zod)        │              │  in registry       │  AlgoEngine  │
│           │                  │              │                    │  AlgoRenderer│
└──────────┘                   │  Left Panel: │                    └──────────────┘
                               │  <Visualization>                         │
                               │    └─ <AlgoRenderer> ◄───────────────────┘
                               │       (shows problem)                    │
                               │                                          │
                               │  Right Panel:                            │
                               │  <EditorToolbar> (JS|Python)             │
                               │  <MonacoEditor>                          │
                               │  <TestCasePanel> ◄── AlgoGameState.testResults
                               └──────────────────────────┘
```

## Impact
- **Files tạo mới**: 5 files (`AlgoEngine.ts`, `AlgoRenderer.tsx`, `algo/index.ts`, `TestCasePanel/`, sample JSON)
- **Files sửa đổi**: 5 files (`types/index.ts`, `types/schemas.ts`, `games/index.ts`, `GameBlockManager.ts`, `QuestPlayer/index.tsx`, `src/index.ts`)
- **Breaking changes**: **KHÔNG**. Tất cả thay đổi đều additive
- **Dependencies mới**: Không. Tái sử dụng `js-interpreter`, `@monaco-editor/react`, `react-resizable-panels` đã có
- **App `react-quest-app`**: Chỉ cần thêm JSON files vào `quests/algo/` — **không cần sửa `App.tsx`**
