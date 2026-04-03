# Change: add-scratch-portal-mode

## Why

Hiện tại hệ thống chỉ hỗ trợ một UX duy nhất cho bài thi Scratch: học sinh tự làm bài trên
Scratch offline/online rồi upload file `.sb3`. Tuy nhiên kiến trúc trong `upgrade/` đã thiết kế
một UX thay thế: học sinh code trực tiếp trong **TurboWarp embedded** trong browser, với
client-side test chạy live per-testcase qua `window.CONTEST_BRIDGE`.

Hai UX phục vụ hai nhu cầu khác nhau (với/không có Scratch cài sẵn, với/không có internet
ổn định để chạy TurboWarp). Giải pháp là cho phép **cấu hình chế độ giao diện ngay trong
metadata đề thi (`quest_data`)**, không hardcode vào `.env`.

## What Changes

### Phase 1 — Submission UX & Judge Feedback (không cần TurboWarp)
- **ADDED** field `scratch_ui_mode: 'upload'` vào schema đề Scratch (mặc định, backward-compatible)
- **ADDED** route `GET /api/submit/history/:quest_id` — lịch sử nộp bài per-câu hỏi
- **ADDED** hiển thị `judge_log` dưới dạng testcase grid trong `ScratchUploader`
- **ADDED** tab "Lần nộp" với lịch sử per-quest
- **MODIFIED** `GET /api/problems/:id` — implement thay vì trả 501
- **MODIFIED** `ScratchUploader` — nâng cấp thành `ScratchQuestPanel` với 3 tab

### Phase 2 — Public Leaderboard & Problem Panel (không cần TurboWarp)
- **ADDED** `GET /api/leaderboard/:problem_id` public endpoint (không cần auth)
- **ADDED** route `/leaderboard/:contestId` trong `react-quest-app`
- **MODIFIED** `ScratchQuestPanel` — panel đề bài render Markdown, best score badge
- **ADDED** `problem_select_list` trong leaderboard — dropdown đề bài

### Phase 3A — TurboWarp.org Embed Editor (`scratch_ui_mode: 'turbowarp-embed'`) ← middle-ground
- **ADDED** `scratch_ui_mode: 'turbowarp-embed'` — embed `turbowarp.org/editor` trong iframe bên trái
- **ADDED** `ScratchTurboWarpEmbedPanel` — layout 2 cột: iframe turbowarp.org (trái) + sidebar upload (phải)
- Học sinh code trong TurboWarp, tự export `.sb3` → upload qua sidebar (không cần Bridge)
- Không cần self-hosted build, không cần CONTEST_BRIDGE

### Phase 3B — Self-Hosted TurboWarp + CONTEST_BRIDGE (`scratch_ui_mode: 'turbowarp'`)
- **ADDED** `scratch_ui_mode: 'turbowarp'` — iframe self-hosted TurboWarp với extension pre-baked
- **ADDED** endpoint `GET /ext/contest-v2.js` — serve TurboWarp contest extension
- **ADDED** `CONTEST_BRIDGE` integration — client-side test live per-testcase với live feedback
- **ADDED** `exportSb3()` flow trong Submit — học sinh không cần tự export file
- **ADDED** TurboWarp GUI build (~15MB) served từ `tin-hoc-tre-api/public/editor/`

## Impact

- Specs: `react-quest-app`, `contest-judge`, `contest-data` (new)
- Code: `apps/react-quest-app`, `apps/tin-hoc-tre-api`, `packages/tin-hoc-tre-problems`
- **NON-BREAKING**: mặc định là `'upload'` — các đề Scratch hiện tại không cần thay đổi

## Schema mới của quest_data (Scratch)

```jsonc
{
  "problem_id": "scratch-1",
  "gameType": "scratch",
  "scratch_ui_mode": "upload",   // "upload" (mặc định) | "turbowarp"
  "title": "...",
  "description": "...",
  "time_limit": 30,
  "test_cases": [
    {
      "id": "tc1",
      "is_sample": true,         // true = gửi cho frontend
      "input": ["5", "3"],
      "expected": ["8"],
      "weight": 10
    }
  ],
  "hints": { "description": "..." }
}
```
