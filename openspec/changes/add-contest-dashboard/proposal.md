# Change: Add Contest Dashboard

## Why

Cần một ứng dụng riêng cho Ban Giám Khảo/Admin để thiết lập cuộc thi, theo dõi thí sinh realtime, và quản lý kết quả. App sử dụng Supabase (Free Tier) thay vì Firebase để hỗ trợ tối thiểu 1000 concurrent users với chiến lược "Zero-Realtime Participant".

## What Changes

- **New app** `apps/contest-dashboard` — Vite + React + TypeScript
- **New SQL schema** — Supabase Postgres (contests, participants, submissions, drafts)
- **Supabase Auth** — thay thế Firebase Auth cho contest flow
- **Supabase Realtime** — chỉ cho Admin Dashboard (200 connections, cần ~5)
- **PostgREST API** — Thí sinh gọi trực tiếp REST API (unlimited requests)

### Impact

- Specs: `contest-dashboard` (new capability)
- Code: `apps/contest-dashboard/` (mới hoàn toàn)
- **BREAKING**: Không — app mới hoàn toàn, không ảnh hưởng existing code

## Architecture

### Supabase Free Tier — "Zero-Realtime Participant"

| Resource | Allocation |
|----------|-----------|
| PostgREST API (unlimited) | Thí sinh: login, load, submit |
| Realtime (200 conn) | Admin Dashboard only (~5 tabs) |
| Edge Functions (500k/mo) | Leaderboard aggregate, admin actions |
| Auth (50k MAU) | Both admin and contestants |

### Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Routing**: React Router v6
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Charts**: Recharts (leaderboard visualization)
- **Styling**: Vanilla CSS (dark theme, consistent with existing apps)

## V1 (MVP) Pages

### Admin Dashboard

| Page | Route | Feature |
|------|-------|---------|
| Login | `/login` | Supabase Auth (admin role) |
| Contests | `/` | List all contests |
| Contest Editor | `/contest/:id/edit` | CRUD contest config |
| Challenge Builder | `/contest/:id/challenges` | Edit algo quests + test cases |
| Accounts | `/contest/:id/accounts` | Generate + export credentials |
| Live Monitor | `/contest/:id/live` | Realtime leaderboard + participants |
| Results | `/contest/:id/results` | Final standings + export |
