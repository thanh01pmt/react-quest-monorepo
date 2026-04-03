# react-quest-app Scratch Portal Delta

## MODIFIED Requirements

### Requirement: Scratch Player Render Condition
The system SHALL render the appropriate Scratch component based on `quest.scratch_ui_mode`.

#### Scenario: Default upload mode
- **WHEN** quest is a Scratch quest and `scratch_ui_mode` is `'upload'` or undefined
- **THEN** `ExamRoom` renders `ScratchQuestPanel` (the enhanced uploader)

#### Scenario: TurboWarp embedded mode
- **WHEN** quest is a Scratch quest and `scratch_ui_mode === 'turbowarp'`
- **THEN** `ExamRoom` renders `ScratchTurboWarpPanel` (iframe + sidebar layout)

---

## ADDED Requirements

### Requirement: Scratch Quest Panel — Three-Tab Interface (Phase 1)
The `ScratchQuestPanel` SHALL present a three-tab UI: **Nộp bài**, **Kết quả**, **Lần nộp**.

#### Scenario: Upload tab — file or URL input
- **WHEN** the student is on the "Nộp bài" tab
- **THEN** they can either drop/select a `.sb3` file OR paste a public Scratch/TurboWarp share URL; the URL is fetched via `@turbowarp/sbdl` and staged into an in-memory File

#### Scenario: Result tab — testcase grid after submission
- **WHEN** a submission completes (polling returns final status)
- **THEN** the "Kết quả" tab becomes active and shows a grid of testcase cards, each displaying pass/fail/TLE status based on `judge_log`

#### Scenario: History tab — load on mount
- **WHEN** the student opens the "Lần nộp" tab
- **THEN** the system fetches `GET /api/submit/history/:quest_id` and lists the 20 most recent submissions with score, status, and timestamp

---

### Requirement: Best Score Badge (Phase 1)
The `ScratchQuestPanel` SHALL display the student's best score for the current quest.

#### Scenario: Best score calculated from history
- **WHEN** the submission history is loaded
- **THEN** the highest `score` value is extracted and displayed as a badge (e.g., "Tốt nhất: 80/100") next to the quest title

---

### Requirement: Problem Description Rendering (Phase 2)
The `ScratchQuestPanel` SHALL include a "Đề bài" tab that renders the problem description in Markdown.

#### Scenario: Problem content displayed
- **WHEN** the problem metadata includes a `description` field as Markdown
- **THEN** the "Đề bài" tab renders it with proper formatting including sample input/output tables

---

### Requirement: TurboWarp Panel Layout (Phase 3)
The `ScratchTurboWarpPanel` SHALL use a two-column layout: TurboWarp iframe on the left, sidebar on the right.

#### Scenario: TurboWarp editor loads in iframe
- **WHEN** `scratch_ui_mode === 'turbowarp'`
- **THEN** an iframe loads TurboWarp GUI with the `contest-v2.js` extension preloaded; a loading spinner shows while the iframe and `CONTEST_BRIDGE` are not ready

---

### Requirement: Live Testcase Feedback via CONTEST_BRIDGE (Phase 3)
The student SHALL be able to run public test cases against their live Scratch project before submitting.

#### Scenario: Running tests via CONTEST_BRIDGE
- **WHEN** the student clicks "Kiểm tra"
- **THEN** the system calls `bridge.runTests(questId, onProgress)` and each testcase card updates from "Chờ" → "Đang chạy" → "✓ Đúng" or "✗ Sai" or "TLE" in real-time

#### Scenario: CONTEST_BRIDGE timeout
- **WHEN** `waitForBridge()` reaches 30 seconds without the extension loading
- **THEN** the system shows an error message with instructions to reload, and the "Kiểm tra" button is disabled

---

### Requirement: Export-and-Submit Flow (Phase 3)
Submitting in TurboWarp mode SHALL NOT require the student to manually save/export a file.

#### Scenario: Export triggered automatically on submit
- **WHEN** the student clicks "Nộp bài"
- **THEN** the system calls `bridge.exportSb3()` to receive the `.sb3` blob directly from the TurboWarp VM, validates it starts with the ZIP magic bytes (`50 4B`), then POSTs it to `/api/submit`
