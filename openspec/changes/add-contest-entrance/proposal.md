# Change: Add Contest Entrance

## Why

Cần một trang "entrance" cho cuộc thi lập trình — thí sinh vào đúng route, đăng nhập bằng thông tin được cấp (username/password), cung cấp thông tin liên lạc (email, SĐT), rồi vào phòng thi với 10 thử thách algo hiển thị sẵn ở sidebar.

## What Changes

- **New route** `/contest/:contestId` → Entrance page (login + contact info)
- **New route** `/contest/:contestId/exam` → Exam room (sidebar 10 challenges + QuestPlayer)
- **New service** `ContestService.ts` — fetch contest config & quests from Firestore
- **New Firestore collections** — `contests`, `contest_participants`, `contest_submissions`
- **New components** — `EntrancePage`, `ExamRoom`, `ContestSidebar`, `ContestTimer`
- **Extend** `AuthContext` — add contest-specific registration fields (email, phone)
- **Route guard** — redirect to entrance if not authenticated for contest

### Impact

- Specs: `contest-entrance` (new capability)
- Code: `apps/react-quest-app/src/pages/`, `src/services/`, `src/components/`, `App.tsx`
- **BREAKING**: None — all changes are additive

## Detailed Design

### 1. Firestore Data Model

#### Collection: `contests/{contestId}`

```json
{
  "title": "Cuộc thi Lập trình Teky 2026",
  "description": "10 bài toán thuật toán",
  "startTime": "2026-03-15T09:00:00+07:00",
  "endTime": "2026-03-15T11:00:00+07:00",
  "durationMinutes": 120,
  "status": "scheduled | active | ended",
  "questIds": ["algo-sum-2-numbers", "algo-fibonacci", "..."],
  "questData": [
    { /* inline Quest JSON cho bài 1 */ },
    { /* inline Quest JSON cho bài 2 */ }
  ],
  "credentials": {
    "type": "pre-created",
    "accounts": [
      { "username": "ts001", "password": "abc123" },
      { "username": "ts002", "password": "def456" }
    ]
  },
  "settings": {
    "allowLanguages": ["blockly", "javascript", "python"],
    "showHiddenTestCases": false,
    "maxSubmissionsPerChallenge": 5,
    "scoringMode": "highest | latest"
  }
}
```

#### Collection: `contest_participants/{participantId}`

```json
{
  "contestId": "abc123",
  "uid": "firebase-uid",
  "username": "ts001",
  "displayName": "Nguyễn Văn A",
  "email": "nva@gmail.com",
  "phone": "0901234567",
  "joinedAt": "2026-03-15T09:05:00+07:00",
  "status": "active | submitted | disqualified"
}
```

#### Collection: `contest_submissions/{submissionId}`

```json
{
  "contestId": "abc123",
  "participantId": "participant-doc-id",
  "questId": "algo-sum-2-numbers",
  "code": "function solve() { ... }",
  "language": "javascript",
  "testResults": [
    { "id": "tc1", "status": "pass", "actualOutput": "15" },
    { "id": "tc2", "status": "fail", "actualOutput": "-1" }
  ],
  "score": 70,
  "submittedAt": "2026-03-15T09:30:00+07:00",
  "attempt": 1
}
```

### 2. Route Structure

```
/contest/:contestId         → EntrancePage
/contest/:contestId/exam    → ExamRoom (protected)
```

### 3. Component Architecture

#### EntrancePage

```
┌─────────────────────────────────────────┐
│            Contest Banner                │
│         (title, description)            │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Username:  [____________]        │  │
│  │  Password:  [____________]        │  │
│  │                                   │  │
│  │  --- Thông tin liên hệ ---        │  │
│  │  Họ tên:    [____________]        │  │
│  │  Email:     [____________]        │  │
│  │  SĐT:       [____________]        │  │
│  │                                   │  │
│  │  [      VÀO PHÒNG THI      ]     │  │
│  └───────────────────────────────────┘  │
│                                         │
│    Cuộc thi bắt đầu: 09:00 15/03       │
│    Thời gian làm bài: 120 phút          │
└─────────────────────────────────────────┘
```

#### ExamRoom

```
┌──────────┬──────────────────────────────┐
│ Sidebar  │                              │
│          │                              │
│ ⏱ 01:45 │                              │
│ ──────── │                              │
│ ✅ Bài 1 │      QuestPlayer             │
│ ⬜ Bài 2 │      (algo mode)             │
│ 🔴 Bài 3 │                              │
│ ⬜ Bài 4 │      Left: AlgoRenderer      │
│ ⬜ Bài 5 │      Right: Editor + Tests   │
│ ...      │                              │
│          │                              │
│ ──────── │                              │
│ [NỘP BÀI]│                              │
└──────────┴──────────────────────────────┘
```

### 4. Scoring Logic

Mỗi bài toán 100 điểm, tổng 1000 điểm cho 10 bài.

```
score = (passedTestCases / totalTestCases) * 100
totalScore = sum(bestScore per challenge)
```

- `scoringMode: "highest"` → lấy điểm cao nhất qua các lần submit
- `scoringMode: "latest"` → lấy điểm lần submit cuối

### 5. Authentication Flow

1. Thí sinh truy cập `/contest/:contestId`
2. App fetch `contests/{contestId}` từ Firestore → hiển thị thông tin cuộc thi
3. Thí sinh nhập username/password (đã được cấp trước)
4. Firebase `signInWithEmail` với `username@contest.local` convention
5. Sau khi đăng nhập → collect thêm email, SĐT
6. Lưu vào `contest_participants`
7. Redirect → `/contest/:contestId/exam`

> **Lý do dùng `username@contest.local`:** Firebase Auth yêu cầu email format. Ta tạo sẵn accounts dạng `ts001@contest.local` với password tương ứng trên Firebase Console hoặc qua Admin SDK.

### 6. File Changes

#### New Files

| File | Purpose |
|------|---------|
| `src/pages/EntrancePage/index.tsx` | Login + contact form |
| `src/pages/EntrancePage/EntrancePage.css` | Styling |
| `src/pages/ExamRoom/index.tsx` | Exam room layout |
| `src/pages/ExamRoom/ExamRoom.css` | Styling |
| `src/components/ContestSidebar/index.tsx` | Challenge list + timer |
| `src/components/ContestSidebar/ContestSidebar.css` | Styling |
| `src/components/ContestTimer/index.tsx` | Countdown timer |
| `src/services/ContestService.ts` | Firestore contest CRUD |
| `src/types/contest.ts` | TypeScript interfaces |

#### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/contest/:contestId` and `/contest/:contestId/exam` routes |
| `src/contexts/AuthContext.tsx` | Optional: add `contestParticipantId` to context |
