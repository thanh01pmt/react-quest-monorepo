# contest-judge Specification

## Purpose

TBD - created by archiving change refactor-express-judge. Update Purpose after archive.

## Requirements

### Requirement: Submission Handling

The system SHALL provide an API to accept submissions from authorized participants.

#### Scenario: Successful Submission

- **WHEN** a participant submits code for a valid quest with a valid Supabase JWT.
- **THEN** the system SHALL create a submission record in the database with status `pending`.

### Requirement: Multi-Language Evaluation

The system SHALL support evaluating multiple programming languages, including but not limited to:

- Blockly (XML/JSON)
- JavaScript
- Python
- Lua
- Scratch (.sb3)

#### Scenario: Script Evaluation

- **WHEN** a submission contains text-based code (JS/Python/Lua).
- **THEN** the judge SHALL execute it against predefined test cases and return a score.

#### Scenario: Scratch Evaluation

- **WHEN** a submission contains a `.sb3` file.
- **THEN** the judge SHALL use a headless Scratch runner to verify sprites, coordinates, and block counts.

### Requirement: Scratch Structural Judging

Hệ thống judge SHALL có khả năng kiểm tra cấu trúc của file Scratch (.sb3) dựa trên các tiêu chí tĩnh.

#### Scenario: Kiểm tra sự tồn tại của nhân vật (Sprite)

- **WHEN** Bài làm có nhân vật tên "Phù Thủy"
- **THEN** Judge SHALL xác nhận yêu cầu này vượt qua

#### Scenario: Kiểm tra sự tồn tại của khối lệnh (Block)

- **WHEN** Bài làm sử dụng khối lệnh `control_forever`
- **THEN** Judge SHALL xác nhận yêu cầu này vượt qua

### Requirement: Judge Response Format

Kết quả trả về từ judge SHALL bao gồm cả thông tin chấm điểm thuật toán và chấm điểm cấu trúc.

#### Scenario: Tổng hợp điểm số

- **WHEN** Bài làm đạt 50 điểm thuật toán và 50 điểm cấu trúc
- **THEN** Tổng điểm SHALL là 100

### Requirement: Asynchronous Updates

For long-running tasks like Scratch evaluation, the system SHALL support asynchronous status updates.

#### Scenario: Polling for Result

- **WHEN** a submission is in `judging` state.
- **THEN** the client SHALL pull the submission status until a final score is assigned.

### Requirement: Historical Logs

The system SHALL update both `judge_log` AND `test_results` columns to ensure frontend display compatibility.

#### Scenario: Unified Result View

- **WHEN** a submission is finalized.
- **THEN** the record SHALL contain results in both log and specific result columns.
