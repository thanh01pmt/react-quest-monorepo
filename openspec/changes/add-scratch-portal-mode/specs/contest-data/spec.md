# contest-data Specification (New Capability)

## Purpose
Define the data schema and contract for contest quest metadata, including the Scratch-specific fields
that control both the judging pipeline and the frontend UI mode.

---

## ADDED Requirements

### Requirement: scratch_ui_mode Field in Quest Data
Every Scratch quest (`gameType === 'scratch'`) SHALL support an optional `scratch_ui_mode` field.

#### Scenario: Default — upload mode when field absent
- **WHEN** a Scratch quest's `quest_data` does not contain `scratch_ui_mode`
- **THEN** the system treats it as `'upload'` — no breaking change to existing quests

#### Scenario: Explicit turbowarp mode
- **WHEN** `quest_data.scratch_ui_mode === 'turbowarp'`
- **THEN** the frontend renders `ScratchTurboWarpPanel` and the backend serves the TurboWarp extension

---

### Requirement: Sample Test Case Annotation
Test cases in `quest_data.test_cases` SHALL support an `is_sample` boolean field.

#### Scenario: Sample test cases exposed to frontend
- **WHEN** `test_cases[n].is_sample === true`
- **THEN** `GET /api/problems/:id` includes this test case in its response for client-side preview

#### Scenario: Private test cases hidden
- **WHEN** `test_cases[n].is_sample` is `false` or absent
- **THEN** this test case is NOT included in the `/api/problems/:id` response — only used server-side by the judge

---

### Requirement: Test Case Schema Validation
The judge SHALL validate each test case entry before execution.

#### Scenario: Valid test case structure
- **WHEN** a test case has `id` (string), `input` (string[]), `expected` (string[]), `weight` (number)
- **THEN** the judge proceeds with evaluation

#### Scenario: Malformed test case
- **WHEN** a test case is missing required fields
- **THEN** the judge logs an error for that TC and marks it as `error` — does not crash the entire submission
