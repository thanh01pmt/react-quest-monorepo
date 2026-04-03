# Modified Requirements: contest-judge

## ADDED Requirements

### Requirement: Scratch Structural Judging

Hệ thống judge SHALL có khả năng kiểm tra cấu trúc của file Scratch (.sb3) dựa trên các tiêu chí tĩnh.

#### Scenario: Kiểm tra sự tồn tại của nhân vật (Sprite)

- **WHEN** Bài làm có nhân vật tên "Phù Thủy"
- **THEN** Judge SHALL xác nhận yêu cầu này vượt qua

#### Scenario: Kiểm tra sự tồn tại của khối lệnh (Block)

- **WHEN** Bài làm sử dụng khối lệnh `control_forever`
- **THEN** Judge SHALL xác nhận yêu cầu này vượt qua

## MODIFIED Requirements

### Requirement: Judge Response Format

Kết quả trả về từ judge SHALL bao gồm cả thông tin chấm điểm thuật toán và chấm điểm cấu trúc.

#### Scenario: Tổng hợp điểm số

- **WHEN** Bài làm đạt 50 điểm thuật toán và 50 điểm cấu trúc
- **THEN** Tổng điểm SHALL là 100

### Requirement: Historical Logs
The system SHALL update both `judge_log` AND `test_results` columns to ensure frontend display compatibility.

#### Scenario: Unified Result View
- **WHEN** a submission is finalized.
- **THEN** the record SHALL contain results in both log and specific result columns.
