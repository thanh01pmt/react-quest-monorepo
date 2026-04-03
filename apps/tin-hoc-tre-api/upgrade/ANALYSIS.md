# Phân tích tích hợp `upgrade/` → Monorepo

## 1. Bối cảnh kiến trúc hiện tại

```
react-quest-monorepo/
├── apps/
│   ├── react-quest-app/          ← Frontend React (Vite + TS), phòng thi học sinh
│   │   └── src/
│   │       ├── contexts/ContestContext.tsx     ← State management cuộc thi
│   │       ├── services/SupabaseContestService.ts
│   │       ├── pages/ExamRoom/index.tsx        ← Phòng thi, render ScratchUploader
│   │       └── components/ScratchUploader/     ← UI nộp bài Scratch (đã có)
│   │
│   ├── contest-dashboard/        ← Admin dashboard (Vite + TS)
│   │   └── src/pages/            ← Quản lý cuộc thi, bảng điểm, tài khoản
│   │
│   └── tin-hoc-tre-api/          ← Backend Node.js/Express
│       ├── src/routes/
│       │   ├── problems.js        ← GET /api/problems/current
│       │   ├── submit.js          ← POST /api/submit (Multer + Bull queue)
│       │   ├── leaderboard.js     ← GET /api/leaderboard/:problem_id
│       │   └── violations.js
│       └── upgrade/              ← **FILES CẦN TÍCH HỢP**
│
└── packages/
    ├── scratch-run/              ← Go binary: headless Scratch judge (server-side)
    ├── tin-hoc-tre-problems/data/ ← JSON đề thi (public + hidden)
    └── tin-hoc-tre-shared/       ← DB client (Supabase) dùng chung
```

---

## 2. Mapping từng file upgrade → nơi tích hợp

### `contest-v2.js` → TurboWarp Extension (KHÔNG thuộc monorepo trực tiếp)

**Mục đích:** Extension TurboWarp unsandboxed, expose `window.CONTEST_BRIDGE` để portal
giao tiếp với VM. Cung cấp `runTests()`, `exportSb3()`, `getProblem()`.

**Vấn đề:** File này phải **chạy inside TurboWarp/scratch-gui** như một extension JS —
không phải React component hay npm package. TurboWarp cho phép load extension từ URL.

**Chiến lược tích hợp ưu tiên:**
```
Option A (Đơn giản, không tự host TurboWarp):
  ScratchUploader dùng @turbowarp/sbdl để tải .sb3 từ URL (đã implement)
  → Không cần contest-v2.js, không cần iframe TurboWarp
  → Phù hợp với bài toán hiện tại (học sinh làm bài trên Scratch offline/online,
    sau đó upload .sb3 lên hệ thống)

Option B (Tích hợp full TurboWarp — phức tạp hơn):
  Serve TurboWarp editor build tại /editor trong tin-hoc-tre-api
  Nhúng iframe /editor vào react-quest-app với Contest Portal UI
  Load contest-v2.js như extension URL: turbowarp.org?extension=/ext/contest-v2.js
  → Học sinh code trực tiếp trong trình duyệt, không cần cài Scratch offline
```

> **Khuyến nghị:** Bắt đầu với Option A (đã phần nào implement), chuyển sang B
> khi cần trải nghiệm in-browser editor.

---

### `index.html` + `contest-portal.js` + `contest-portal.css` → `react-quest-app`

**Mục đích:** Portal HTML thuần (không React) có layout 2 cột: iframe TurboWarp | sidebar
với tab Đề bài / Kết quả / Lần nộp, nút Test và Submit, timer đếm ngược.

**Điểm chồng lắp với code hiện tại:**

| Tính năng trong upgrade/portal | Tương đương hiện tại |
|-------------------------------|---------------------|
| Timer đếm ngược | `ContestContext.remainingSeconds` + timer UI trong ExamRoom |
| Tab "Đề bài" | Render đề từ `currentQuest.description` |
| Tab "Kết quả" (testcase cards) | **CHƯA CÓ** — ScratchUploader chỉ show status nộp |
| Tab "Lần nộp" | **CHƯA CÓ** — không có lịch sử per-quest trong UI |
| Nút Test (client-side) | **CHƯA CÓ** — chỉ có Submit |
| Nút Submit → polling | `submitSb3` trong ContestContext + polling 3s |
| Best score header | Hiển thị tổng score, không per-quest |

**Chiến lược tích hợp:**

Thay vì port nguyên HTML thuần sang React, cần **nâng cấp `ScratchUploader.tsx`**:

```
ScratchUploader (hiện tại)          →  ScratchQuestPanel (đề xuất)
─────────────────────────────────       ─────────────────────────────────
[Upload .sb3 hoặc URL]                  [Tab: Đề bài | Kết quả | Lần nộp]
[Nút Submit]                            [Nút Test] [Nút Submit]
[Status: pending/judging/done]          [Live testcase cards per-TC]
                                        [Lịch sử nộp]
                                        [Best score badge]
```

**Nguồn dữ liệu testcase:**
- Public testcases tải từ `GET /api/problems/current` (đã có route)
- Nhưng cần thêm testcase vào `quest_data` trong DB (hiện tại `scratch1.public.json`
  có `test_cases: []` — trống)

---

### `portal.js` (backend route) → `tin-hoc-tre-api/src/routes/`

**Mục đích:** Express router serve portal static files + thêm route lịch sử nộp bài.

**Điểm chồng lắp:**

| Route trong upgrade/portal.js | Route hiện tại |
|-------------------------------|---------------|
| `GET /api/submit/history/:problem_id` | **Chưa có** — `submit.js` chỉ có GET /:id |
| `POST /api/violations` | `violations.js` đã có |
| `GET /leaderboard` (serve HTML) | Không cần (leaderboard là React route) |
| `GET /` + `/portal/*` (static) | Không cần (frontend là Vite SPA trên Netlify) |

**Cần thêm vào `submit.js`:**
```javascript
// GET /api/submit/history/:quest_id
// Lấy lịch sử nộp bài của thí sinh cho 1 câu hỏi
router.get('/history/:quest_id', requireAuth, async (req, res, next) => {
  const { rows } = await db.query(`
    SELECT s.id, s.score, s.status, s.judge_log, s.submitted_at, s.is_dry_run
    FROM submissions s
    JOIN board_participants bp ON s.board_participant_id = bp.id
    WHERE bp.user_id = $1 AND s.quest_id = $2
    ORDER BY s.submitted_at DESC
    LIMIT 20
  `, [req.user.id, req.params.quest_id]);
  res.json(rows);
});
```

---

### `leaderboard.html` → `contest-dashboard/`

**Mục đích:** Trang bảng xếp hạng tự refresh mỗi 15s, fetch `/api/leaderboard/:problem_id`.

**Điểm chồng lắp:** `leaderboard.js` route đã có, query VNOJ-style đã đúng.

**Vấn đề:** `contest-dashboard` đã có React page cho bảng điểm. Tuy nhiên bảng điểm
trong dashboard là admin-view, còn leaderboard.html là public-view cho học sinh.

**Chiến lược:**
- Tạo route public leaderboard trong `react-quest-app` (không cần auth)
- Hoặc tạo standalone page `/leaderboard` trong `contest-dashboard` nhưng không cần
  đăng nhập admin

> **Khuyến nghị:** Thêm route `/leaderboard/:contestId` vào `react-quest-app` với
> data fetch từ `GET /api/leaderboard/:problem_id`.

---

## 3. Điểm cần lưu ý khi tích hợp

### 3.1 Client-side test với `runTests()` (contest-v2.js)

Extension contest-v2.js thực hiện test client-side bằng cách:
1. Set list `inputData` và `expected` trên Scratch Stage
2. Green flag → chờ VM populate list `output`
3. So sánh `output` vs `expected`

**Điều này yêu cầu:**
- TurboWarp VM đang chạy trong browser (iframe hoặc embedded)
- Scratch project của học sinh phải đọc `inputData` và ghi vào `output`
- Đề bài phải quy ước học sinh dùng list `inputData` / `output`

**Hiện tại với ScratchUploader chỉ nhận .sb3 file/URL:**
- Không thể chạy client-side test mà không có VM
- Giải pháp: dùng `@turbowarp/sbdl` để tải .sb3, sau đó cần `scratch-vm` để chạy

**Độ phức tạp:** Chạy scratch-vm trong browser cho phép test client-side nhưng:
- Bundle size nặng (~3-5MB)
- Không hỗ trợ extensions (trừ khi build custom)

> **Khuyến nghị ngắn hạn:** Bỏ qua client-side test với VM, chỉ làm "preview" metadata
> của .sb3 (danh sách sprites, variables...). Server-side judge bằng scratch-run là đủ.
>
> **Dài hạn:** Nếu muốn in-browser editor, dùng Option B (iframe TurboWarp + contest-v2.js).

### 3.2 Authentication token

`contest-portal.js` dùng JWT từ `localStorage.contest_token` để gọi API.
Hệ thống hiện tại dùng **Supabase auth** với session cookie/header chuẩn —
không tương thích trực tiếp.

**Cần cập nhật:** Nếu có page portal HTML thuần, phải lấy Supabase access token
và đưa vào localStorage, hoặc chuyển API call xác thực sang Supabase pattern.

### 3.3 `problems.js` route — schema mới vs cũ

Route `GET /api/problems/:id` đang trả về `501 Not Implemented`. Cần implement:
```javascript
router.get('/:id', requireAuth, async (req, res, next) => {
  // Tìm quest trong exam hiện tại của user, filter theo quest_id === req.params.id
  // Trả về thông tin đề + test_cases.filter(tc => tc.is_sample)
});
```

### 3.4 `scratch-run` binary — status tích hợp

Package `scratch-run` là Go binary, có sẵn precompiled binaries cho các platform.
Backend `submit.js` đang dùng **Bull queue** để push job. Worker process (chưa thấy
trong codebase) sẽ gọi binary này để chấm bài.

**Cần xác nhận:** Worker file ở đâu? Có thể là `tin-hoc-tre-judge` app.

---

## 4. Đề xuất lộ trình tích hợp

### Phase 1 — Hoàn thiện luồng hiện tại (ngắn hạn)

```
✅ Đã làm: ScratchUploader nhận .sb3 file/URL
✅ Đã làm: submitSb3 trong ContestContext → POST /api/submit → Bull queue
✅ Đã làm: Polling kết quả 

🔲 Cần làm:
  1. Thêm test_cases vào scratch problems (ít nhất 3-5 TC mẫu với input/expected)
  2. Thêm GET /api/submit/history/:quest_id (từ portal.js)
  3. Hiển thị lịch sử nộp trong ScratchUploader (tab "Lần nộp")
  4. Hiển thị kết quả judge_log per-testcase sau khi Submit (từ judge_log JSON)
  5. Implement GET /api/problems/:id (không còn 501)
```

### Phase 2 — Nâng cấp UX (trung hạn)

```
🔲 Nâng cấp ScratchUploader thành ScratchQuestPanel:
   - 3 tab: Đề bài | Kết quả | Lần nộp
   - Hiển thị live testcase cards sau Submit (từ judge_log)
   - Best score badge
   - Drag & drop .sb3 upload

🔲 Public Leaderboard page trong react-quest-app
```

### Phase 3 — In-browser editor (dài hạn, tuỳ chọn)

```
🔲 Serve TurboWarp editor build tại /editor trong tin-hoc-tre-api
🔲 Load contest-v2.js như extension
🔲 Tích hợp iframe editor vào ExamRoom (Option B)
🔲 Client-side test với CONTEST_BRIDGE.runTests()
```

---

## 5. Quick wins có thể làm ngay

### 5.1 Thêm route lịch sử nộp bài

Thêm vào `tin-hoc-tre-api/src/routes/submit.js`:
```javascript
router.get('/history/:quest_id', requireAuth, async (req, res, next) => {
  const { rows } = await db.query(`
    SELECT s.id, s.score, s.status, s.judge_log, s.submitted_at, s.is_dry_run
    FROM submissions s
    JOIN board_participants bp ON s.board_participant_id = bp.id
    WHERE bp.user_id = $1 AND s.quest_id = $2
    ORDER BY s.submitted_at DESC LIMIT 20
  `, [req.user.id, req.params.quest_id]);
  res.json(rows.map(r => ({
    ...r,
    judge_log: Array.isArray(r.judge_log)
      ? r.judge_log.map(({ index, passed, status, ms, weight }) => ({ index, passed, status, ms, weight }))
      : null
  })));
});
```

### 5.2 Hiển thị testcase grid từ judge_log

Sau khi server trả kết quả, `ScratchUploader` có thể render:
```tsx
{submission?.judge_log?.map((tc, i) => (
  <div key={i} className={`tc-pill ${tc.passed ? 'pass' : tc.status}`}>
    TC{tc.index} {tc.passed ? '✓' : tc.status === 'tle' ? 'TLE' : '✗'}
    <span>{tc.ms}ms</span>
  </div>
))}
```

### 5.3 Thêm mẫu testcase vào đề bài Scratch

Cập nhật `scratch1.public.json` với test_cases thực tế (nếu đề có tính năng
kiểm tra tự động). Hiện tại đề này yêu cầu review thủ công bởi giáo viên nên
`test_cases: []` là hợp lý — chỉ cần thêm TC khi đề có thể auto-grade.

---

## 6. Tóm tắt ra quyết định

| Câu hỏi | Quyết định đề xuất |
|---------|-------------------|
| Có dùng TurboWarp iframe không? | **Giai đoạn 3** — không cần ngay |
| `contest-v2.js` tích hợp ở đâu? | Serve từ Express `/ext/contest-v2.js` khi cần |
| `contest-portal.js` port sang React? | Port logic (timer, testcase cards, polling) vào ScratchUploader component |
| `portal.js` backend thêm vào đâu? | Merge vào `submit.js` (route history) và `server.js` (static) |
| `leaderboard.html` xử lý thế nào? | Tạo React route `/leaderboard/:contestId` trong `react-quest-app` |
| Client-side test thực tế? | Chỉ khi có iframe TurboWarp — defer sang Phase 3 |
