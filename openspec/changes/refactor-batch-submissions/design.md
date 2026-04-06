# Design: Batch Submissions Refactor

## Context
Transition the Tin Hoc Tre platform from **Atomic Submission** (one record per task) to **Batch Submission** (one record for the entire exam).

## Goals / Non-Goals
- **Goals**:
    - Atomic submission for the whole exam.
    - Simplified Leadboard scoring (one row = one exam state).
    - Consistent data across all tasks.
- **Non-Goals**:
    - Maintaining backward compatibility for old rows (migration required).
    - Per-quest improvement history (history will be per-exam snapshot).

## Decisions

### 1. New Table Schema (`submissions`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `board_participant_id` | `uuid` | Reference |
| `exam_id` | `uuid` | Reference |
| `codes` | `jsonb` | Map: `quest_id` -> `CodeItem` |
| `test_results` | `jsonb` | Map: `quest_id` -> `TestResult[]` |
| `score` | `int` | Total score for all tasks |
| `metadata` | `jsonb` | Map: `quest_id` -> `QuestMetadata` |
| `submitted_at` | `timestamptz` | Submission time |

### 2. `codes` Schema (JSONB)
Lưu trữ mã nguồn của tất cả các câu hỏi trong Exam. Mỗi key là một `quest_id`.
```json
{
  "q1": {
    "code": "print('hello')",
    "language": "python",
    "storage_path": "optional/path/to/sb3"
  }
}
```
```json
{
  "type": "object",
  "additionalProperties": {
    "type": "object",
    "required": ["code", "language"],
    "properties": {
      "code": { "type": "string" },
      "language": { "type": "string", "enum": ["javascript", "python", "scratch", "blockly"] },
      "storage_path": { "type": "string" }
    }
  }
}
```

### 3. `test_results` Schema (JSONB)
Lưu trữ kết quả chấm chi tiết. Mỗi key là một `quest_id`.
```json
{
  "type": "object",
  "additionalProperties": {
    "type": "array",
    "items": {
      "type": "object",
      "required": ["test", "passed", "score"],
      "properties": {
        "test": { "type": "string" },
        "passed": { "type": "boolean" },
        "score": { "type": "number" },
        "message": { "type": "string" }
      }
    }
  }
}
```

### 4. `metadata` Schema (JSONB)
Lưu trữ thông tin vận hành. Mỗi key là một `quest_id`.
```json
{
  "type": "object",
  "additionalProperties": {
    "type": "object",
    "properties": {
      "time_ms": { "type": "number" },
      "memory_kb": { "type": "number" },
      "worker_log": { "type": "string" }
    }
  }
}
```

---

## 5. JSON Mẫu (Sample Data)

### codes.json
```json
{
  "q1": { "code": "print('hi')", "language": "python" },
  "q2": { "code": "", "language": "scratch", "storage_path": "path/to/file.sb3" }
}
```

### test_results.json
```json
{
  "q1": [{ "test": "T1", "passed": true, "score": 100 }],
  "q2": []
}
```

## Risks & Side Effects

### 1. API Latency
- **Risk**: Chấm nhiều bài cùng lúc có thể vượt quá timeout 30s của HTTP request (đặc biệt với Python/Scratch heavy tests).
- **Mitigation**: Judge API nên trả về kết quả ngay sau khi đẩy vào queue (Async) HOẶC Frontend phải có cơ chế retry/long-waiting UI. Trong giai đoạn đầu, ta sẽ tối ưu worker để chạy song song (Node.js Worker Threads hoặc Child Processes).

### 2. Database Migration (Breaking Change)
- **Risk**: Các submisison cũ (Atomic) sẽ không hiển thị đúng trên Leaderboard mới.
- **Mitigation**: Cần chạy một script migration để gộp các dòng cũ cùng `board_participant_id` vào 1 bản ghi Batch duy nhất, hoặc chấp nhận reset dữ liệu cũ nếu đang trong giai đoạn Beta.

### 3. Data Bloat (JSONB)
- **Risk**: File Scratch (.sb3) có thể lớn. Nếu lưu binary/base64 vào JSONB sẽ làm chậm query toàn bảng.
- **Mitigation**: **Bắt buộc** upload file lên Supabase Storage và chỉ lưu `storage_path` trong JSONB.

### 4. Leaderboard Consistency
- **Risk**: Nếu một Snapshot mới có tổng điểm thấp hơn Snapshot cũ, Leaderboard có thể bị giảm điểm nếu không dùng logic `MAX(score)`.
- **Mitigation**: Leaderboard view sẽ lấy `MAX(score)` của tất cả các Batch Submission của một Participant để đảm bảo điểm chỉ tăng hoặc giữ nguyên.

## Open Questions

- **Should we allow partial "Nộp bài"?** 
    - **Decision**: **Yes**. Submitting partial exams is allowed. Quests that are not submitted (unoccupied) will get empty answers/0 score in that specific snapshot.

- **How to handle "Run" vs "Submit"?**
    - **Decision**: **"Run" is in-memory only**. It does not persist to the `submissions` table. **"Submit" is always batch** and persists the entire exam state to the `submissions` table.
