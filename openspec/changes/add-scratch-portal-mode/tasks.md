## 1. Phase 1 — Submission UX & Judge Feedback

### 1.1 Backend: route lịch sử nộp bài
- [ ] 1.1.1 Thêm `GET /api/submit/history/:quest_id` vào `submit.js` — trả về tối đa 20 lần nộp gần nhất của user cho quest đó (rút gọn judge_log, bỏ output chi tiết)
- [ ] 1.1.2 Implement `GET /api/problems/:id` (hiện là 501) — trả về đề + sample test_cases của quest theo quest_id trong exam hiện tại của user

### 1.2 Frontend: nâng cấp ScratchQuestPanel
- [ ] 1.2.1 Rename/refactor `ScratchUploader` → `ScratchQuestPanel` (giữ backward-compat)
- [ ] 1.2.2 Thêm 3 tab: **Nộp bài** (upload area) | **Kết quả** (judge_log grid) | **Lần nộp** (history list)
- [ ] 1.2.3 Render testcase grid từ `judge_log` sau khi polling trả kết quả — badge pass/fail/tle per TC
- [ ] 1.2.4 Tab "Lần nộp": fetch `GET /api/submit/history/:quest_id` khi mount, hiển thị score + status + timestamp
- [ ] 1.2.5 Best score badge: tính từ lịch sử nộp, hiển thị cạnh tên quest

### 1.3 Data: thêm sample test_cases vào đề Scratch
- [ ] 1.3.1 Cập nhật `scratch1.public.json` — thêm ≥3 sample test_cases với `is_sample: true` nếu đề có thể auto-grade
- [ ] 1.3.2 Thêm field `scratch_ui_mode: 'upload'` vào tất cả đề Scratch hiện tại (backward-compat default)

---

## 2. Phase 2 — Public Leaderboard & Problem Panel

### 2.1 Backend: leaderboard public
- [ ] 2.1.1 Thêm middleware cho phép unauthenticated access tới `GET /api/leaderboard/:problem_id` (hoặc tạo route public riêng)
- [ ] 2.1.2 Xử lý `CONTEST_START_TIME` từ exam record thay vì process.env (join với rounds table)

### 2.2 Frontend: leaderboard page
- [ ] 2.2.1 Tạo route `/leaderboard/:contestId` trong `react-quest-app` — public, không cần login
- [ ] 2.2.2 Tạo `LeaderboardPage.tsx` — dropdown chọn đề, bảng xếp hạng, auto-refresh 15s
- [ ] 2.2.3 Styling chuẩn theo design system hiện tại

### 2.3 Frontend: problem description panel
- [ ] 2.3.1 Thêm tab "Đề bài" vào `ScratchQuestPanel` — render `description` từ quest metadata dưới dạng Markdown
- [ ] 2.3.2 Hiển thị example input/output nếu đề có

---

## 3. Phase 3A — TurboWarp.org Embed Editor (middle-ground, không cần Bridge)

### 3A.1 Frontend: ScratchTurboWarpEmbedPanel
- [ ] 3A.1.1 Trong `ExamRoom/index.tsx` — detect `scratch_ui_mode === 'turbowarp-embed'` → render `ScratchTurboWarpEmbedPanel`
- [ ] 3A.1.2 Tạo `ScratchTurboWarpEmbedPanel.tsx` — layout 2 cột:
  - Trái: `<iframe src="https://turbowarp.org/editor" />` (full-height, sandboxed)
  - Phải: sidebar — hướng dẫn export + upload area (tái dùng từ `ScratchQuestPanel`) + timer
- [ ] 3A.1.3 Hiển thị banner hướng dẫn học sinh: "Code xong → File → Save to your computer → upload vào đây"
- [ ] 3A.1.4 Sidebar vẫn có tab Lần nộp (fetch history) — reuse component từ Phase 1

### 3A.2 Schema & cấu hình
- [ ] 3A.2.1 Cập nhật type `QuestConfig` — thêm `'turbowarp-embed'` vào union type `scratch_ui_mode`
- [ ] 3A.2.2 Tạo `scratch3.public.json` với `scratch_ui_mode: 'turbowarp-embed'` làm đề demo

---

## 4. Phase 3B — Self-Hosted TurboWarp + CONTEST_BRIDGE (full per-TC feedback)

### 4.1 Backend: serve TurboWarp extension + editor build
- [ ] 4.1.1 Copy `upgrade/contest-v2.js` → `tin-hoc-tre-api/public/ext/contest-v2.js`
- [ ] 4.1.2 Thêm static route `GET /ext/contest-v2.js` với `Content-Type: text/javascript`
- [ ] 4.1.3 Thêm static route `GET /editor/*` → serve TurboWarp GUI build tự host
- [ ] 4.1.4 Tài liệu hóa quy trình build TurboWarp GUI với `contest-v2.js` pre-loaded

### 4.2 Frontend: ScratchTurboWarpPanel (full Bridge)
- [ ] 4.2.1 Detect `scratch_ui_mode === 'turbowarp'` → render `ScratchTurboWarpPanel`
- [ ] 4.2.2 Tạo `ScratchTurboWarpPanel.tsx` — layout 2 cột: iframe self-hosted (trái) + sidebar (phải)
  - Sidebar: timer + 3 tab (Đề bài | Kết quả live | Lần nộp)
- [ ] 4.2.3 Implement `waitForBridge()` — poll `iframe.contentWindow.CONTEST_BRIDGE` timeout 30s
- [ ] 4.2.4 Nút **Kiểm tra** — `bridge.runTests(questId, onTcProgress)` → update TestcaseCard live
- [ ] 4.2.5 Nút **Nộp bài** — `bridge.exportSb3()` → verify ZIP magic bytes → POST `/api/submit`

### 4.3 Frontend: live testcase cards
- [ ] 4.3.1 Tạo `TestcaseCard.tsx` — badge Chờ → Đang chạy → ✓ Đúng / ✗ Sai / TLE với animation
- [ ] 4.3.2 Hiển thị output thực tế vs expected khi TC fail/TLE (expandable)

### 4.4 Schema & cấu hình
- [ ] 4.4.1 Cập nhật `QuestConfig` — thêm `'turbowarp'` vào union type
- [ ] 4.4.2 Tạo `scratch4.public.json` với `scratch_ui_mode: 'turbowarp'` + IO test_cases lambda demo
