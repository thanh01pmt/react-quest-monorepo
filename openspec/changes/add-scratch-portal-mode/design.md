## Context

Hệ thống contest Scratch hiện cho phép upload `.sb3` qua `ScratchUploader`. Cần nâng cấp lên hai
chế độ UI phân biệt được cấu hình tại đề thi:

1. **`upload`** — học sinh tự làm ở Scratch/TurboWarp ngoài, export/share file/URL, paste vào portal
2. **`turbowarp`** — học sinh code trực tiếp trong iframe TurboWarp gắn liền trong portal

Cả hai mode đều dùng chung backend judge pipeline (POST `/api/submit` + Bull queue).

## Goals / Non-Goals

**Goals:**
- Mode mặc định là `upload` — không break bất kỳ đề Scratch nào hiện tại
- Cấu hình mode nằm trong `quest_data` JSON (trong DB hoặc file `/packages/tin-hoc-tre-problems/`)
- Tab "Kết quả" dùng `judge_log` từ polling — không cần WebSocket mới
- Tab "Lần nộp" dùng API mới, auth bằng Supabase JWT (không dùng `localStorage.contest_token`)
- Leaderboard public — không cần đăng nhập; dùng rate-limit 30 req/min

**Non-Goals:**
- Không implement custom Scratch VM mới — dùng TurboWarp GUI build sẵn
- Không sync state giữa 2 browser tab

## Architecture Decisions

### Decision 1: Mode flag nằm trong quest_data, không phải .env
- **Lý do:** Một cuộc thi có thể có nhiều đề, mỗi đề dùng mode khác nhau tùy cấu hình GV
- **Ảnh hưởng:** Frontend đọc `(quest as any).scratch_ui_mode` hoặc `quest.gameConfig?.scratch_ui_mode`
- **Default:** `undefined` → xử lý như `'upload'`

### Decision 2: `ScratchQuestPanel` (upload mode) và `ScratchTurboWarpPanel` (turbowarp mode) tách biệt
- **Lý do:** Hai layout khác nhau căn bản (single-column vs dual-column), tránh conditional nesting phức tạp
- **Pattern:** `ExamRoom/index.tsx` chọn component dựa vào `scratch_ui_mode`

### Decision 3: Auth dùng Supabase JWT từ context, không phải localStorage token
- **Lý do:** Monorepo đã migrate sang Supabase auth; `localStorage.contest_token` là pattern cũ từ upgrade/
- **Implementation:** Dùng `useAuth()` hook → `session.access_token` → gửi qua `Authorization: Bearer` header

### Decision 4: `CONTEST_BRIDGE` là optional, không cần cài Extension thủ công
- **Lý do:** Mô hình giao tiếp iframe → parent phụ thuộc vào version TurboWarp extension
- **Pattern:** `waitForBridge(timeout=30000)` — timeout gracefully nếu extension chưa load

## Component Tree (Phase 3)

```
ExamRoom
├── [upload mode]   → ScratchQuestPanel
│   ├── Tab: Nộp bài  → UploadArea + UrlInput
│   ├── Tab: Kết quả  → TestcaseGrid (from judge_log)
│   └── Tab: Lần nộp  → SubmissionHistory
│
└── [turbowarp mode] → ScratchTurboWarpPanel
    ├── Left: TurboWarpFrame (iframe)
    └── Right: Sidebar
        ├── Timer
        ├── Tab: Đề bài   → ProblemDescription (Markdown)
        ├── Tab: Kết quả  → TestcaseGrid (live via CONTEST_BRIDGE)
        └── Tab: Lần nộp  → SubmissionHistory
```

## API Routes Summary

| Method | Path | Auth | Phase |
|--------|------|------|-------|
| GET | `/api/problems/:id` | JWT | 1 |
| GET | `/api/submit/history/:quest_id` | JWT | 1 |
| GET | `/api/leaderboard/:problem_id` | None | 2 |
| GET | `/ext/contest-v2.js` | None | 3 |
| GET | `/editor/*` | None | 3 |

## Migration Plan

- Không cần migration schema DB — `scratch_ui_mode` được lưu trong cột `quest_data` (JSONB)
- Các đề Scratch hiện tại tiếp tục hoạt động: thiếu field → default `'upload'`
- TurboWarp build cần được generate riêng, serve từ `tin-hoc-tre-api/public/editor/` — không commit vào git

## Risks / Trade-offs

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| TurboWarp iframe bị block bởi CSP | Medium | Cấu hình Content-Security-Policy allow iframe từ cùng origin |
| `exportSb3()` unreliable nếu project lớn | Low | Size check < 50MB trước khi submit |
| `CONTEST_BRIDGE` không load kịp | Medium | `waitForBridge` timeout 30s + hiển thị hướng dẫn |
| Backend `/api/problems/:id` route conflict | Low | Kiểm tra không conflict với route `:id` của express |

## Resolved Decisions

### TurboWarp Build Strategy: **Self-hosted (bắt buộc)**
- `turbowarp.org` embed không hoạt động với `CONTEST_BRIDGE` do cross-origin restriction
- `iframe.contentWindow.CONTEST_BRIDGE` bị block bởi Same-Origin Policy nếu iframe ≠ cùng domain
- **Kết luận:** Phase 3 bắt buộc self-hosted build (~8-15MB), serve từ `tin-hoc-tre-api/public/editor/`
- TurboWarp GUI build không commit vào git → lưu qua CI artifact hoặc volume mount riêng

### Grading Mode: `grading_mode` field
Mỗi đề Scratch cần khai báo cách chấm điểm:
- `"io"` — Judge I/O deterministic: dùng list `inputData`/`output` trong VM (xem `_runOneTc` trong contest-v2.js)
- `"structural"` — Phân tích cấu trúc `.sb3` (project.json): đếm sprites, kiểm tra block type, biến...
- `"manual"` — Chấm tay (default cho game tương tác thuần túy)

**Đề mẫu đã thiết kế:**
| Problem ID | Title | Mode | grading_mode |
|---|---|---|---|
| `scratch-1` | Mèo bắt chuột | upload | structural |
| `scratch-2` | Tính tổng dãy số | upload | io |
| `scratch-3` | Robot đi theo lệnh | turbowarp | io |

## Open Questions
*(Đã giải quyết — không còn open question)*
